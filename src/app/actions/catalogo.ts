"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { unidades, operadores, obras } from "@/db/schema";
import { eq } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// UNIDADES
// ─────────────────────────────────────────────────────────────
export async function getUnidades(soloActivas = true) {
  return db.query.unidades.findMany({
    where: soloActivas ? eq(unidades.activo, true) : undefined,
    orderBy: (u, { asc }) => [asc(u.tipo), asc(u.codigo)],
  });
}

export async function createUnidad(data: {
  codigo: string;
  nombre?: string;
  tipo: string;
  modelo?: string;
  capacidadTanque?: number;
  rendimientoReferencia?: number;
  notas?: string;
}) {
  const [nueva] = await db.insert(unidades).values(data).returning();
  revalidatePath("/catalogo/unidades");
  return nueva;
}

export async function updateUnidad(
  id: number,
  data: Partial<typeof unidades.$inferInsert>
) {
  const [updated] = await db
    .update(unidades)
    .set(data)
    .where(eq(unidades.id, id))
    .returning();
  revalidatePath("/catalogo/unidades");
  return updated;
}

export async function toggleUnidadActivo(id: number, activo: boolean) {
  await db.update(unidades).set({ activo }).where(eq(unidades.id, id));
  revalidatePath("/catalogo/unidades");
}

// ─────────────────────────────────────────────────────────────
// OPERADORES
// ─────────────────────────────────────────────────────────────
export async function getOperadores(soloActivos = true) {
  return db.query.operadores.findMany({
    where: soloActivos ? eq(operadores.activo, true) : undefined,
    orderBy: (o, { asc }) => [asc(o.nombre)],
  });
}

export async function createOperador(data: {
  nombre: string;
  tipo: string;
  telefono?: string;
}) {
  const [nuevo] = await db.insert(operadores).values(data).returning();
  revalidatePath("/catalogo/operadores");
  return nuevo;
}

export async function updateOperador(
  id: number,
  data: Partial<typeof operadores.$inferInsert>
) {
  const [updated] = await db
    .update(operadores)
    .set(data)
    .where(eq(operadores.id, id))
    .returning();
  revalidatePath("/catalogo/operadores");
  return updated;
}

export async function toggleOperadorActivo(id: number, activo: boolean) {
  await db.update(operadores).set({ activo }).where(eq(operadores.id, id));
  revalidatePath("/catalogo/operadores");
}

// ─────────────────────────────────────────────────────────────
// OBRAS
// ─────────────────────────────────────────────────────────────
export async function getObras(soloActivas = true) {
  return db.query.obras.findMany({
    where: soloActivas ? eq(obras.activo, true) : undefined,
    orderBy: (o, { asc }) => [asc(o.nombre)],
  });
}

export async function createObra(data: {
  nombre: string;
  cliente?: string;
  fechaInicio?: string;
  notas?: string;
}) {
  const [nueva] = await db.insert(obras).values(data).returning();
  revalidatePath("/catalogo/obras");
  return nueva;
}

export async function updateObra(
  id: number,
  data: Partial<typeof obras.$inferInsert>
) {
  const [updated] = await db
    .update(obras)
    .set(data)
    .where(eq(obras.id, id))
    .returning();
  revalidatePath("/catalogo/obras");
  return updated;
}

export async function toggleObraActiva(id: number, activo: boolean) {
  await db.update(obras).set({ activo }).where(eq(obras.id, id));
  revalidatePath("/catalogo/obras");
}
