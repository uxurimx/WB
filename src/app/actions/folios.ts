"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { cargas, configuracion, folioSeries, transferenciasTanque } from "@/db/schema";
import { requireActionPermission, requireManageRole } from "@/lib/authz";
import type { FolioOrigen } from "@/lib/folios";

const DEFAULT_KEY = (origen: FolioOrigen) => `folio_serie_default_${origen}`;

async function getDefaultId(origen: FolioOrigen): Promise<number | null> {
  const row = await db.query.configuracion.findFirst({ where: eq(configuracion.clave, DEFAULT_KEY(origen)) });
  const id = row ? Number.parseInt(row.valor, 10) : NaN;
  return Number.isInteger(id) ? id : null;
}

export async function getFolioSeriesConfig() {
  await requireManageRole();
  const [rows, patioDefaultId, campoDefaultId] = await Promise.all([
    db.select().from(folioSeries).orderBy(folioSeries.origen, desc(folioSeries.activa), folioSeries.nombre),
    getDefaultId("patio"),
    getDefaultId("campo"),
  ]);
  return rows.map((row) => ({
    id: row.id,
    origen: row.origen as FolioOrigen,
    codigo: row.codigo,
    nombre: row.nombre,
    folioMin: row.folioMin,
    folioMax: row.folioMax,
    activa: row.activa,
    predeterminada: row.id === (row.origen === "patio" ? patioDefaultId : campoDefaultId),
  }));
}

export async function getFolioSeriesForCapture(origen: FolioOrigen) {
  if (origen !== "patio" && origen !== "campo") throw new Error("Origen de folio inválido");
  await requireActionPermission(origen === "patio" ? "cargas.nueva_patio" : "cargas.nueva_campo");
  const [rows, defaultId] = await Promise.all([
    db.select().from(folioSeries).where(and(eq(folioSeries.origen, origen), eq(folioSeries.activa, true)))
      .orderBy(desc(folioSeries.id)),
    getDefaultId(origen),
  ]);
  return Promise.all(rows.map(async (row) => ({
    id: row.id,
    origen,
    codigo: row.codigo,
    nombre: row.nombre,
    folioMin: row.folioMin,
    folioMax: row.folioMax,
    predeterminada: row.id === defaultId,
    siguienteFolio: await getNextFolioForSeries(origen, row.id),
  })));
}

export async function getFolioSeriesForTransfer() {
  await requireManageRole();
  const [rows, defaultId] = await Promise.all([
    db.select().from(folioSeries).where(and(eq(folioSeries.origen, "patio"), eq(folioSeries.activa, true)))
      .orderBy(desc(folioSeries.id)),
    getDefaultId("patio"),
  ]);
  return Promise.all(rows.map(async (row) => ({
    id: row.id,
    origen: "patio" as const,
    codigo: row.codigo,
    nombre: row.nombre,
    folioMin: row.folioMin,
    folioMax: row.folioMax,
    predeterminada: row.id === defaultId,
    siguienteFolio: await getNextFolioForSeries("patio", row.id),
  })));
}

export async function createFolioSerie(input: {
  origen: FolioOrigen;
  codigo: string;
  nombre: string;
  folioMin: number;
  folioMax: number;
}) {
  await requireManageRole();
  if (input.origen !== "patio" && input.origen !== "campo") throw new Error("Origen de folio inválido");
  const codigo = input.codigo.trim().toUpperCase();
  const nombre = input.nombre.trim();
  const { folioMin, folioMax } = input;
  if (!/^[A-Z0-9_-]{1,20}$/.test(codigo)) throw new Error("Usa un código de 1 a 20 letras, números, guiones o guiones bajos");
  if (!nombre || nombre.length > 80) throw new Error("El nombre debe tener entre 1 y 80 caracteres");
  for (const [label, value] of [["mínimo", folioMin], ["máximo", folioMax]] as const) {
    if (!Number.isInteger(value) || value < 0 || value > 99999) throw new Error(`El ${label} debe ser un entero entre 0 y 99999`);
  }
  if (folioMin > 0 && folioMax > 0 && folioMin > folioMax) throw new Error("El folio mínimo no puede superar al máximo");
  const existing = await db.query.folioSeries.findFirst({
    where: and(eq(folioSeries.origen, input.origen), eq(folioSeries.codigo, codigo)),
  });
  if (existing) throw new Error(`Ya existe una serie con el código ${codigo} para ${input.origen}`);

  const [serie] = await db.insert(folioSeries).values({
    origen: input.origen,
    codigo,
    nombre,
    folioMin,
    folioMax,
    folioBase: folioMin || 1,
    activa: true,
  }).returning({ id: folioSeries.id });
  await db.insert(configuracion).values({ clave: DEFAULT_KEY(input.origen), valor: String(serie.id) })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(serie.id), updatedAt: new Date() } });
  revalidatePath("/settings");
  revalidatePath(input.origen === "patio" ? "/cargas/nueva" : "/cargas/campo");
  revalidatePath("/tanques");
  return { ok: true, id: serie.id };
}

export async function setFolioSeriePredeterminada(id: number) {
  await requireManageRole();
  if (!Number.isInteger(id) || id <= 0) throw new Error("Serie inválida");
  const serie = await db.query.folioSeries.findFirst({ where: eq(folioSeries.id, id) });
  if (!serie) throw new Error("La serie no existe");
  if (!serie.activa) throw new Error("Activa la serie antes de usarla como predeterminada");
  await db.insert(configuracion).values({ clave: DEFAULT_KEY(serie.origen as FolioOrigen), valor: String(id) })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(id), updatedAt: new Date() } });
  revalidatePath("/settings");
  revalidatePath(serie.origen === "patio" ? "/cargas/nueva" : "/cargas/campo");
  revalidatePath("/tanques");
  return { ok: true };
}

export async function setFolioSerieActiva(id: number, activa: boolean) {
  await requireManageRole();
  if (!Number.isInteger(id) || id <= 0 || typeof activa !== "boolean") throw new Error("Serie inválida");
  const serie = await db.query.folioSeries.findFirst({ where: eq(folioSeries.id, id) });
  if (!serie) throw new Error("La serie no existe");
  if (!activa && (await getDefaultId(serie.origen as FolioOrigen)) === id)
    throw new Error("Selecciona otra serie predeterminada antes de desactivar esta");
  await db.update(folioSeries).set({ activa }).where(eq(folioSeries.id, id));
  revalidatePath("/settings");
  revalidatePath(serie.origen === "patio" ? "/cargas/nueva" : "/cargas/campo");
  revalidatePath("/tanques");
  return { ok: true };
}

export async function getNextFolioForSeriesPublic(origen: FolioOrigen, serieId: number) {
  await requireActionPermission(origen === "patio" ? "cargas.nueva_patio" : "cargas.nueva_campo");
  return getNextFolioForSeries(origen, serieId);
}

async function getNextFolioForSeries(origen: FolioOrigen, serieId: number): Promise<number | null> {
  const serie = await db.query.folioSeries.findFirst({
    where: and(eq(folioSeries.id, serieId), eq(folioSeries.origen, origen), eq(folioSeries.activa, true)),
  });
  if (!serie) throw new Error("La serie seleccionada no está activa");
  const cargaResult = await db.select({ maxFolio: max(cargas.folio) }).from(cargas)
    .where(and(
      eq(cargas.folioSerieId, serieId),
      eq(cargas.origen, origen),
      sql`${cargas.folio} BETWEEN 1 AND 99999`,
    ));
  const transferenciaResult = origen === "patio"
    ? await db.select({ maxFolio: max(transferenciasTanque.folio) }).from(transferenciasTanque)
      .where(and(
        eq(transferenciasTanque.folioSerieId, serieId),
        sql`${transferenciasTanque.folio} BETWEEN 1 AND 99999`,
      ))
    : [];
  const maxCarga = cargaResult[0]?.maxFolio ?? null;
  const maxTransferencia = transferenciaResult[0]?.maxFolio ?? null;
  const maxFolio = maxCarga !== null && maxTransferencia !== null
    ? Math.max(Number(maxCarga), Number(maxTransferencia))
    : maxCarga ?? maxTransferencia;
  const siguiente = maxFolio !== null
    ? Number(maxFolio) + 1
    : Math.max(serie.folioBase, serie.folioMin || 1);
  if (siguiente > 99999 || (serie.folioMax > 0 && siguiente > serie.folioMax)) return null;
  return siguiente;
}
