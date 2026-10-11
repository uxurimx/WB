import { and, desc, eq, max, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cargas, configuracion, folioSeries, transferenciasTanque } from "@/db/schema";

export type FolioOrigen = "patio" | "campo";
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

export async function getDefaultFolioSerieId(origen: FolioOrigen, database: FolioDb = db): Promise<number> {
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
    .where(and(eq(folioSeries.id, serieId), eq(folioSeries.origen, origen), eq(folioSeries.activa, true))).limit(1);
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

export async function getSiguienteFolioPatioCompartido(database: FolioDb = db, serieId?: number): Promise<number | null> {
  const id = serieId ?? await getDefaultFolioSerieId("patio", database);
  const serie = await getFolioSerieActiva("patio", id, database);
  const [cargaResult, transferenciaResult] = await Promise.all([
    database.select({ maxFolio: max(cargas.folio) }).from(cargas)
      .where(and(
        eq(cargas.origen, "patio"),
        eq(cargas.folioSerieId, id),
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
  const cargaConds: SQL[] = [
    eq(cargas.folio, folio),
    eq(cargas.origen, origen),
    eq(cargas.folioSerieId, serieId),
  ];
  if (exclude?.cargaId) cargaConds.push(sql`${cargas.id} <> ${exclude.cargaId}`);

  const cargaDup = await database.select({ id: cargas.id }).from(cargas)
    .where(and(...cargaConds)).limit(1);
  if (cargaDup.length > 0)
    throw new Error(`El folio ${folio} ya existe en cargas de ${origen} para la serie seleccionada`);

}

export async function assertFolioTransferenciaDisponible(
  folio: number,
  serieId: number,
  database: FolioDb = db,
  excludeId?: number,
) {
  const conditions: SQL[] = [
    eq(transferenciasTanque.folio, folio),
    eq(transferenciasTanque.folioSerieId, serieId),
  ];
  if (excludeId) conditions.push(sql`${transferenciasTanque.id} <> ${excludeId}`);
  const duplicate = await database.select({ id: transferenciasTanque.id }).from(transferenciasTanque)
    .where(and(...conditions)).limit(1);
  if (duplicate.length) throw new Error(`El folio ${folio} ya existe en transferencias para la serie seleccionada`);
}

export async function getSiguienteFolioEnSerie(origen: FolioOrigen, serieId: number, database: FolioDb = db): Promise<number | null> {
  if (origen === "patio") return getSiguienteFolioPatioCompartido(database, serieId);
  const serie = await getFolioSerieActiva(origen, serieId, database);
  const [result] = await database.select({ maxFolio: max(cargas.folio) }).from(cargas)
    .where(and(
      eq(cargas.origen, origen),
      eq(cargas.folioSerieId, serieId),
      sql`${cargas.folio} BETWEEN 1 AND 99999`,
    ));
  const siguiente = result?.maxFolio != null
    ? Number(result.maxFolio) + 1
    : Math.max(serie.folioBase, serie.folioMin || 1);
  if (siguiente > 99999 || (serie.folioMax > 0 && siguiente > serie.folioMax)) return null;
  return siguiente;
}
