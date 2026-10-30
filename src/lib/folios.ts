import { and, desc, eq, max, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cargas, configuracion, folioSeries, transferenciasTanque } from "@/db/schema";
import { formatFolioNumber } from "@/lib/folio-format";

export type FolioOrigen = "patio" | "campo";
export type FolioSerieOrigen = FolioOrigen | "compartida";
export type FolioSerieCaptura = {
  id: number;
  origen: FolioOrigen;
  codigo: string;
  nombre: string;
  folioMin: number;
  folioMax: number;
  predeterminada: boolean;
  siguienteFolio: number | null;
};
type FolioDb = typeof db;

const defaultConfigKey = (origen: FolioOrigen) => `folio_serie_default_${origen}`;
const sharedDefaultConfigKey = "folio_serie_default_compartida";

export async function getDefaultFolioSerieId(origen: FolioOrigen, database: FolioDb = db): Promise<number> {
  const [shared] = await database.select({ valor: configuracion.valor }).from(configuracion)
    .where(eq(configuracion.clave, sharedDefaultConfigKey)).limit(1);
  const sharedId = shared ? Number.parseInt(shared.valor, 10) : NaN;
  if (Number.isInteger(sharedId)) {
    const [serie] = await database.select({ id: folioSeries.id }).from(folioSeries)
      .where(and(eq(folioSeries.id, sharedId), eq(folioSeries.origen, "compartida"), eq(folioSeries.activa, true))).limit(1);
    if (serie) return serie.id;
  }
  const configured = await database.select({ valor: configuracion.valor }).from(configuracion)
    .where(eq(configuracion.clave, defaultConfigKey(origen))).limit(1);
  const id = configured[0] ? Number.parseInt(configured[0].valor, 10) : NaN;
  if (Number.isInteger(id)) {
    const [serie] = await database.select({ id: folioSeries.id }).from(folioSeries)
      .where(and(eq(folioSeries.id, id), eq(folioSeries.origen, origen), eq(folioSeries.activa, true))).limit(1);
    if (serie) return serie.id;
  }
  const [fallback] = await database.select({ id: folioSeries.id }).from(folioSeries)
    .where(and(eq(folioSeries.origen, origen), eq(folioSeries.activa, true)))
    .orderBy(desc(folioSeries.id)).limit(1);
  if (!fallback) throw new Error(`No hay una serie activa para ${origen}. Configúrala en Sistema → Configuración → Folios.`);
  return fallback.id;
}

export async function getFolioSerieActiva(origen: FolioOrigen, serieId: number, database: FolioDb = db) {
  const [serie] = await database.select().from(folioSeries)
    .where(and(
      eq(folioSeries.id, serieId),
      or(eq(folioSeries.origen, origen), eq(folioSeries.origen, "compartida")),
      eq(folioSeries.activa, true),
    )).limit(1);
  if (!serie) throw new Error(`La serie seleccionada no está activa para ${origen}`);
  return serie;
}

export function assertFolioEnSerie(
  folio: number,
  serie: { codigo: string; nombre: string; folioMin: number; folioMax: number },
) {
  if (serie.folioMin > 0 && folio < serie.folioMin)
    throw new Error(`El folio ${folio} es menor al mínimo de la serie ${serie.codigo} (${serie.folioMin})`);
  if (serie.folioMax > 0 && folio > serie.folioMax)
    throw new Error(`El folio ${folio} supera el máximo de la serie ${serie.codigo} (${serie.folioMax})`);
}

export function normalizeFolioConflict(error: unknown, folio: number, serieCodigo: string): Error {
  const details = typeof error === "object" && error !== null
    ? error as { code?: unknown; constraint?: unknown; message?: unknown }
    : {};
  const message = String(details.message ?? error ?? "");
  const constraint = String(details.constraint ?? "");
  const isUniqueFolioViolation =
    (String(details.code ?? "") === "23505" && /folio/i.test(constraint)) ||
    /folio.{0,80}(ya existe|already exists)/i.test(message) ||
    (/duplicate key value violates unique constraint/i.test(message) && /folio/i.test(message));
  if (!isUniqueFolioViolation) return error instanceof Error ? error : new Error(message || "No se pudo guardar el folio");
  return new Error(`FOLIO OCUPADO: ${formatFolioNumber(folio, serieCodigo)} ya está registrado en esa serie. Verifica el ticket o captura otro número.`);
}

export async function getSiguienteFolioPatioCompartido(database: FolioDb = db, serieId?: number): Promise<number | null> {
  const id = serieId ?? await getDefaultFolioSerieId("patio", database);
  const serie = await getFolioSerieActiva("patio", id, database);
  const [cargaResult, transferenciaResult] = await Promise.all([
    database.select({ maxFolio: max(cargas.folio) }).from(cargas)
      .where(and(
        eq(cargas.folioSerieId, id),
        eq(cargas.origen, "patio"),
        sql`${cargas.folio} BETWEEN 1 AND 99999`,
      )),
    database.select({ maxFolio: max(transferenciasTanque.folio) }).from(transferenciasTanque)
      .where(and(
        eq(transferenciasTanque.folioSerieId, id),
        sql`${transferenciasTanque.folio} BETWEEN 1 AND 99999`,
      )),
  ]);
  const maxCarga = cargaResult[0]?.maxFolio ?? null;
  const maxTransferencia = transferenciaResult[0]?.maxFolio ?? null;
  const maxGlobal = maxCarga !== null && maxTransferencia !== null
    ? Math.max(Number(maxCarga), Number(maxTransferencia))
    : maxCarga ?? maxTransferencia;
  const siguiente = maxGlobal !== null
    ? Number(maxGlobal) + 1
    : Math.max(serie.folioBase, serie.folioMin || 1);
  if (siguiente > 99999 || (serie.folioMax > 0 && siguiente > serie.folioMax)) return null;
  return siguiente;
}

export async function assertFolioDisponible(
  folio: number,
  origen: FolioOrigen,
  serieId: number,
  database: FolioDb = db,
  exclude?: { cargaId?: number },
) {
  const [serie] = await database.select({ origen: folioSeries.origen, codigo: folioSeries.codigo }).from(folioSeries)
    .where(eq(folioSeries.id, serieId)).limit(1);
  const cargaConds: SQL[] = [
    eq(cargas.folio, folio),
    eq(cargas.folioSerieId, serieId),
  ];
  if (serie?.origen !== "compartida") cargaConds.push(eq(cargas.origen, origen));
  if (exclude?.cargaId) cargaConds.push(sql`${cargas.id} <> ${exclude.cargaId}`);

  const cargaDup = await database.select({ id: cargas.id }).from(cargas)
    .where(and(...cargaConds)).limit(1);
  if (cargaDup.length > 0)
    throw new Error(`FOLIO OCUPADO: ${formatFolioNumber(folio, serie?.codigo)} ya está registrado en esa serie.`);

  if (serie?.origen === "compartida") {
    const transferenciaDup = await database.select({ id: transferenciasTanque.id }).from(transferenciasTanque)
      .where(and(eq(transferenciasTanque.folio, folio), eq(transferenciasTanque.folioSerieId, serieId))).limit(1);
    if (transferenciaDup.length > 0)
      throw new Error(`FOLIO OCUPADO: ${formatFolioNumber(folio, serie.codigo)} ya está registrado en esa serie.`);
  }

}

export async function assertFolioTransferenciaDisponible(
  folio: number,
  serieId: number,
  database: FolioDb = db,
  excludeId?: number,
) {
  const [serie] = await database.select({ origen: folioSeries.origen, codigo: folioSeries.codigo }).from(folioSeries)
    .where(eq(folioSeries.id, serieId)).limit(1);
  const conditions: SQL[] = [
    eq(transferenciasTanque.folio, folio),
    eq(transferenciasTanque.folioSerieId, serieId),
  ];
  if (excludeId) conditions.push(sql`${transferenciasTanque.id} <> ${excludeId}`);
  const duplicate = await database.select({ id: transferenciasTanque.id }).from(transferenciasTanque)
    .where(and(...conditions)).limit(1);
  if (duplicate.length) throw new Error(`FOLIO OCUPADO: ${formatFolioNumber(folio, serie?.codigo)} ya está registrado en esa serie.`);

  if (serie?.origen === "compartida") {
    const cargaDup = await database.select({ id: cargas.id }).from(cargas)
      .where(and(eq(cargas.folio, folio), eq(cargas.folioSerieId, serieId))).limit(1);
    if (cargaDup.length) throw new Error(`FOLIO OCUPADO: ${formatFolioNumber(folio, serie.codigo)} ya está registrado en esa serie.`);
  }
}

export async function getSiguienteFolioEnSerie(origen: FolioOrigen, serieId: number, database: FolioDb = db): Promise<number | null> {
  if (origen === "patio") return getSiguienteFolioPatioCompartido(database, serieId);
  const serie = await getFolioSerieActiva(origen, serieId, database);
  const [result] = await database.select({ maxFolio: max(cargas.folio) }).from(cargas)
    .where(and(
      eq(cargas.folioSerieId, serieId),
      eq(cargas.origen, origen),
      sql`${cargas.folio} BETWEEN 1 AND 99999`,
    ));
  const maxCarga = result?.maxFolio == null ? null : Number(result.maxFolio);
  const siguiente = maxCarga !== null
    ? maxCarga + 1
    : Math.max(serie.folioBase, serie.folioMin || 1);
  if (siguiente > 99999 || (serie.folioMax > 0 && siguiente > serie.folioMax)) return null;
  return siguiente;
}
