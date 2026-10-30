"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { configuracion, folioSeries } from "@/db/schema";
import { requireActionPermission, requireManageRole } from "@/lib/authz";
import { getSiguienteFolioEnSerie, type FolioOrigen, type FolioSerieOrigen } from "@/lib/folios";

const DEFAULT_KEY = (origen: FolioSerieOrigen) => `folio_serie_default_${origen}`;

async function getDefaultId(origen: FolioSerieOrigen): Promise<number | null> {
  const row = await db.query.configuracion.findFirst({ where: eq(configuracion.clave, DEFAULT_KEY(origen)) });
  const id = row ? Number.parseInt(row.valor, 10) : NaN;
  return Number.isInteger(id) ? id : null;
}

export async function getFolioSeriesConfig() {
  await requireManageRole();
  const [rows, patioDefaultId, campoDefaultId, sharedDefaultId] = await Promise.all([
    db.select().from(folioSeries).orderBy(folioSeries.origen, desc(folioSeries.activa), folioSeries.nombre),
    getDefaultId("patio"),
    getDefaultId("campo"),
    getDefaultId("compartida"),
  ]);
  return rows.map((row) => ({
    id: row.id,
    origen: row.origen as FolioSerieOrigen,
    codigo: row.codigo,
    nombre: row.nombre,
    folioMin: row.folioMin,
    folioMax: row.folioMax,
    activa: row.activa,
    predeterminada: row.origen === "compartida"
      ? row.id === sharedDefaultId
      : row.id === (row.origen === "patio" ? patioDefaultId : campoDefaultId),
  }));
}

export async function getFolioSeriesForCapture(origen: FolioOrigen) {
  if (origen !== "patio" && origen !== "campo") throw new Error("Origen de folio inválido");
  await requireActionPermission(origen === "patio" ? "cargas.nueva_patio" : "cargas.nueva_campo");
  const sharedRows = await db.select().from(folioSeries)
    .where(and(eq(folioSeries.origen, "compartida"), eq(folioSeries.activa, true)))
    .orderBy(desc(folioSeries.id));
  const useShared = sharedRows.length > 0;
  const [rows, defaultId] = await Promise.all([
    useShared ? Promise.resolve(sharedRows) : db.select().from(folioSeries)
      .where(and(eq(folioSeries.origen, origen), eq(folioSeries.activa, true)))
      .orderBy(desc(folioSeries.id)),
    getDefaultId(useShared ? "compartida" : origen),
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
  const sharedRows = await db.select().from(folioSeries)
    .where(and(eq(folioSeries.origen, "compartida"), eq(folioSeries.activa, true)))
    .orderBy(desc(folioSeries.id));
  const useShared = sharedRows.length > 0;
  const [rows, defaultId] = await Promise.all([
    useShared ? Promise.resolve(sharedRows) : db.select().from(folioSeries)
      .where(and(eq(folioSeries.origen, "patio"), eq(folioSeries.activa, true)))
      .orderBy(desc(folioSeries.id)),
    getDefaultId(useShared ? "compartida" : "patio"),
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
  codigo: string;
  nombre: string;
  folioMin: number;
  folioMax: number;
}) {
  await requireManageRole();
  const codigo = input.codigo.trim();
  const nombre = input.nombre.trim();
  const { folioMin, folioMax } = input;
  if (!/^[A-Za-z0-9_-]{1,20}$/.test(codigo)) throw new Error("El código debe tener de 1 a 20 letras, números, guiones o guiones bajos");
  if (codigo.toUpperCase() === "BASE") throw new Error("BASE queda reservado para identificar el historial anterior");
  if (!nombre || nombre.length > 80) throw new Error("El nombre debe tener entre 1 y 80 caracteres");
  for (const [label, value] of [["mínimo", folioMin], ["máximo", folioMax]] as const) {
    if (!Number.isInteger(value) || value < 0 || value > 99999) throw new Error(`El ${label} debe ser un entero entre 0 y 99999`);
  }
  if (folioMin > 0 && folioMax > 0 && folioMin > folioMax) throw new Error("El folio mínimo no puede superar al máximo");
  const existing = await db.query.folioSeries.findFirst({
    where: and(eq(folioSeries.origen, "compartida"), eq(folioSeries.codigo, codigo)),
  });
  if (existing) throw new Error(`Ya existe una serie con el código ${codigo}`);

  const [serie] = await db.insert(folioSeries).values({
    origen: "compartida",
    codigo,
    nombre,
    folioMin,
    folioMax,
    folioBase: folioMin || 1,
    activa: true,
  }).returning({ id: folioSeries.id });
  await db.insert(configuracion).values({ clave: DEFAULT_KEY("compartida"), valor: String(serie.id) })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(serie.id), updatedAt: new Date() } });
  revalidatePath("/settings");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
  revalidatePath("/tanques");
  return { ok: true, id: serie.id };
}

export async function setFolioSeriePredeterminada(id: number) {
  await requireManageRole();
  if (!Number.isInteger(id) || id <= 0) throw new Error("Serie inválida");
  const serie = await db.query.folioSeries.findFirst({ where: eq(folioSeries.id, id) });
  if (!serie) throw new Error("La serie no existe");
  if (!serie.activa) throw new Error("Activa la serie antes de usarla como predeterminada");
  await db.insert(configuracion).values({ clave: DEFAULT_KEY(serie.origen as FolioSerieOrigen), valor: String(id) })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(id), updatedAt: new Date() } });
  revalidatePath("/settings");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
  revalidatePath("/tanques");
  return { ok: true };
}

export async function setFolioSerieActiva(id: number, activa: boolean) {
  await requireManageRole();
  if (!Number.isInteger(id) || id <= 0 || typeof activa !== "boolean") throw new Error("Serie inválida");
  const serie = await db.query.folioSeries.findFirst({ where: eq(folioSeries.id, id) });
  if (!serie) throw new Error("La serie no existe");
  if (!activa && (await getDefaultId(serie.origen as FolioSerieOrigen)) === id)
    throw new Error("Selecciona otra serie predeterminada antes de desactivar esta");
  await db.update(folioSeries).set({ activa }).where(eq(folioSeries.id, id));
  revalidatePath("/settings");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
  revalidatePath("/tanques");
  return { ok: true };
}

export async function getNextFolioForSeriesPublic(origen: FolioOrigen, serieId: number) {
  await requireActionPermission(origen === "patio" ? "cargas.nueva_patio" : "cargas.nueva_campo");
  return getNextFolioForSeries(origen, serieId);
}

async function getNextFolioForSeries(origen: FolioOrigen, serieId: number): Promise<number | null> {
  return getSiguienteFolioEnSerie(origen, serieId);
}
