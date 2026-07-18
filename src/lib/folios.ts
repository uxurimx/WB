import { and, eq, lte, max, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { cargas, configuracion, transferenciasTanque } from "@/db/schema";

type FolioDb = Pick<typeof db, "select">;

const FOLIO_MAX_TICKET = 99999;

export async function getSiguienteFolioPatioCompartido(database: FolioDb = db): Promise<number> {
  const [maxCargaResult, maxTransfResult, baseResult] = await Promise.all([
    database
      .select({ maxFolio: max(cargas.folio) })
      .from(cargas)
      .where(and(eq(cargas.origen, "patio"), lte(cargas.folio, FOLIO_MAX_TICKET))),
    database
      .select({ maxFolio: max(transferenciasTanque.folio) })
      .from(transferenciasTanque)
      .where(lte(transferenciasTanque.folio, FOLIO_MAX_TICKET)),
    database
      .select({ valor: configuracion.valor })
      .from(configuracion)
      .where(eq(configuracion.clave, "folio_base"))
      .limit(1),
  ]);

  const base = baseResult[0]?.valor ? parseInt(baseResult[0].valor, 10) : 1;
  const maxCarga = maxCargaResult[0]?.maxFolio ?? null;
  const maxTransf = maxTransfResult[0]?.maxFolio ?? null;
  const maxGlobal =
    maxCarga !== null && maxTransf !== null
      ? Math.max(Number(maxCarga), Number(maxTransf))
      : maxCarga ?? maxTransf;

  return maxGlobal !== null ? Number(maxGlobal) + 1 : base;
}

export async function assertFolioPatioCompartidoDisponible(
  folio: number,
  database: FolioDb = db,
  exclude?: { cargaId?: number; transferenciaId?: number }
) {
  const cargaConds: SQL[] = [
    eq(cargas.folio, folio),
    eq(cargas.origen, "patio"),
  ];
  if (exclude?.cargaId) cargaConds.push(sql`${cargas.id} <> ${exclude.cargaId}`);

  const transferenciaConds: SQL[] = [eq(transferenciasTanque.folio, folio)];
  if (exclude?.transferenciaId) {
    transferenciaConds.push(sql`${transferenciasTanque.id} <> ${exclude.transferenciaId}`);
  }

  const [cargaDup, transferenciaDup] = await Promise.all([
    database
      .select({ id: cargas.id })
      .from(cargas)
      .where(and(...cargaConds))
      .limit(1),
    database
      .select({ id: transferenciasTanque.id })
      .from(transferenciasTanque)
      .where(and(...transferenciaConds))
      .limit(1),
  ]);

  if (cargaDup.length > 0) {
    throw new Error(`El folio ${folio} ya existe en cargas de patio`);
  }
  if (transferenciaDup.length > 0) {
    throw new Error(`El folio ${folio} ya existe en transferencias`);
  }
}
