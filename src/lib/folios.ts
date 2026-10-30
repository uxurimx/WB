import { and, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cargas, configuracion, folioSeries, transferenciasTanque } from "@/db/schema";

export type FolioOrigen = "patio" | "campo";
export type FolioSerieOrigen = FolioOrigen | "compartida";
export type FolioSerieCaptura = {
  id: number;
  origen: FolioOrigen;
  codigo: string;
  nombre: string;
  folioMin: number;
  folioMax: number;
  folioDigitos: number;
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
    /folio.{0,100}(ya existe|ya está registrado|already exists)/i.test(message) ||
    /folio ocupado/i.test(message) ||
    (/duplicate key value violates unique constraint/i.test(message) && /folio/i.test(message));
  if (!isUniqueFolioViolation) return error instanceof Error ? error : new Error(message || "No se pudo guardar el folio");
  return new Error(`FOLIO OCUPADO: ${serieCodigo}${folio} ya está registrado. El mismo número se permite al usar otro código de serie. Verifica el ticket o captura otro folio.`);
}

type FolioReciente = { folio: number; createdAt: Date | null; id: number };

async function getUltimoFolioCarga(origen: FolioOrigen, serieId: number, database: FolioDb): Promise<FolioReciente | null> {
  const [row] = await database.select({ folio: cargas.folio, createdAt: cargas.createdAt, id: cargas.id })
    .from(cargas)
    .where(and(eq(cargas.origen, origen), eq(cargas.folioSerieId, serieId), sql`${cargas.folio} IS NOT NULL`))
    .orderBy(sql`${cargas.createdAt} DESC NULLS LAST`, desc(cargas.id))
    .limit(1);
  return row?.folio == null ? null : { ...row, folio: row.folio };
}

async function getUltimoFolioTransferencia(serieId: number, database: FolioDb): Promise<FolioReciente | null> {
  const [row] = await database.select({ folio: transferenciasTanque.folio, createdAt: transferenciasTanque.createdAt, id: transferenciasTanque.id })
    .from(transferenciasTanque)
    .where(and(eq(transferenciasTanque.folioSerieId, serieId), sql`${transferenciasTanque.folio} IS NOT NULL`))
    .orderBy(sql`${transferenciasTanque.createdAt} DESC NULLS LAST`, desc(transferenciasTanque.id))
    .limit(1);
  return row?.folio == null ? null : { ...row, folio: row.folio };
}

function getMasReciente(a: FolioReciente | null, b: FolioReciente | null): FolioReciente | null {
  if (!a) return b;
  if (!b) return a;
  const aTime = a.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bTime = b.createdAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  if (aTime !== bTime) return aTime > bTime ? a : b;
  return a.id >= b.id ? a : b;
}

export async function getSiguienteFolioPatioCompartido(database: FolioDb = db, serieId?: number): Promise<number | null> {
  const id = serieId ?? await getDefaultFolioSerieId("patio", database);
  const serie = await getFolioSerieActiva("patio", id, database);
  const [ultimaCarga, ultimaTransferencia] = await Promise.all([
    getUltimoFolioCarga("patio", id, database),
    getUltimoFolioTransferencia(id, database),
  ]);
  const ultimo = getMasReciente(ultimaCarga, ultimaTransferencia);
  const siguiente = ultimo
    ? ultimo.folio + 1
    : Math.max(serie.folioBase, serie.folioMin || 1);
  if (siguiente > 99999 || (serie.folioMax > 0 && siguiente > serie.folioMax)) return null;
  return siguiente;
}

export async function assertFolioDisponible(
  folio: number,
  serieId: number,
  database: FolioDb = db,
  exclude?: { cargaId?: number },
) {
  const [serie] = await database.select({ codigo: folioSeries.codigo }).from(folioSeries)
    .where(eq(folioSeries.id, serieId)).limit(1);
  if (!serie) throw new Error("No se encontró la serie del folio");
  const cargaConds: SQL[] = [
    eq(cargas.folio, folio),
    inArray(cargas.origen, ["patio", "campo"]),
    eq(folioSeries.codigo, serie.codigo),
  ];
  if (exclude?.cargaId) cargaConds.push(sql`${cargas.id} <> ${exclude.cargaId}`);

  const [cargaDup] = await database.select({ id: cargas.id, origen: cargas.origen, serieCodigo: folioSeries.codigo })
    .from(cargas)
    .leftJoin(folioSeries, eq(cargas.folioSerieId, folioSeries.id))
    .where(and(...cargaConds)).limit(1);
  if (cargaDup) {
    const origenExistente = cargaDup.origen === "patio" ? "Patio" : "Campo";
    const serieExistente = cargaDup.serieCodigo ? ` (serie ${cargaDup.serieCodigo})` : "";
    throw new Error(`FOLIO OCUPADO: ${serie.codigo}${folio} ya está registrado en una carga de ${origenExistente}${serieExistente}. El número puede repetirse al cambiar de serie.`);
  }

  const [transferenciaDup] = await database.select({ id: transferenciasTanque.id, serieCodigo: folioSeries.codigo })
    .from(transferenciasTanque)
    .leftJoin(folioSeries, eq(transferenciasTanque.folioSerieId, folioSeries.id))
    .where(and(eq(transferenciasTanque.folio, folio), eq(folioSeries.codigo, serie.codigo))).limit(1);
  if (transferenciaDup) {
    const serieExistente = transferenciaDup.serieCodigo ? ` (serie ${transferenciaDup.serieCodigo})` : "";
    throw new Error(`FOLIO OCUPADO: ${serie.codigo}${folio} ya está registrado en una transferencia${serieExistente}. El número puede repetirse al cambiar de serie.`);
  }
}

export async function assertFolioTransferenciaDisponible(
  folio: number,
  serieId: number,
  database: FolioDb = db,
  excludeId?: number,
) {
  const [serie] = await database.select({ codigo: folioSeries.codigo }).from(folioSeries)
    .where(eq(folioSeries.id, serieId)).limit(1);
  if (!serie) throw new Error("No se encontró la serie del folio");
  const conditions: SQL[] = [
    eq(transferenciasTanque.folio, folio),
    eq(folioSeries.codigo, serie.codigo),
  ];
  if (excludeId) conditions.push(sql`${transferenciasTanque.id} <> ${excludeId}`);
  const [duplicate] = await database.select({ id: transferenciasTanque.id, serieCodigo: folioSeries.codigo })
    .from(transferenciasTanque)
    .leftJoin(folioSeries, eq(transferenciasTanque.folioSerieId, folioSeries.id))
    .where(and(...conditions)).limit(1);
  if (duplicate) {
    const serieExistente = duplicate.serieCodigo ? ` (serie ${duplicate.serieCodigo})` : "";
    throw new Error(`FOLIO OCUPADO: ${serie.codigo}${folio} ya está registrado en una transferencia${serieExistente}. El número puede repetirse al cambiar de serie.`);
  }

  const cargaConds: SQL[] = [
    eq(cargas.folio, folio),
    inArray(cargas.origen, ["patio", "campo"]),
    eq(folioSeries.codigo, serie.codigo),
  ];
  const [cargaDup] = await database.select({ id: cargas.id, origen: cargas.origen, serieCodigo: folioSeries.codigo })
    .from(cargas)
    .leftJoin(folioSeries, eq(cargas.folioSerieId, folioSeries.id))
    .where(and(...cargaConds)).limit(1);
  if (cargaDup) {
    const origenExistente = cargaDup.origen === "patio" ? "Patio" : "Campo";
    const serieExistente = cargaDup.serieCodigo ? ` (serie ${cargaDup.serieCodigo})` : "";
    throw new Error(`FOLIO OCUPADO: ${serie.codigo}${folio} ya está registrado en una carga de ${origenExistente}${serieExistente}. El número puede repetirse al cambiar de serie.`);
  }
}

export async function getSiguienteFolioEnSerie(origen: FolioOrigen, serieId: number, database: FolioDb = db): Promise<number | null> {
  if (origen === "patio") return getSiguienteFolioPatioCompartido(database, serieId);
  const serie = await getFolioSerieActiva(origen, serieId, database);
  const ultimo = await getUltimoFolioCarga("campo", serieId, database);
  const siguiente = ultimo
    ? ultimo.folio + 1
    : Math.max(serie.folioBase, serie.folioMin || 1);
  if (siguiente > 99999 || (serie.folioMax > 0 && siguiente > serie.folioMax)) return null;
  return siguiente;
}
