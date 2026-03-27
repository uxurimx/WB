"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { unidades, operadores, obras, cargas } from "@/db/schema";
import { eq, count } from "drizzle-orm";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

async function requireManageRole() {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  if (!MANAGE_ROLES.includes(role)) throw new Error("Sin permisos para realizar esta acción");
}

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
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
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
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
  return updated;
}

export async function toggleUnidadActivo(id: number, activo: boolean) {
  await db.update(unidades).set({ activo }).where(eq(unidades.id, id));
  revalidatePath("/catalogo/unidades");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
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
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
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
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
  return updated;
}

export async function toggleOperadorActivo(id: number, activo: boolean) {
  await db.update(operadores).set({ activo }).where(eq(operadores.id, id));
  revalidatePath("/catalogo/operadores");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
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
  revalidatePath("/cargas/campo");
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
  revalidatePath("/cargas/campo");
  return updated;
}

export async function toggleObraActiva(id: number, activo: boolean) {
  await db.update(obras).set({ activo }).where(eq(obras.id, id));
  revalidatePath("/catalogo/obras");
  revalidatePath("/cargas/campo");
}

// ─────────────────────────────────────────────────────────────
// DELETE — requieren rol admin/gerente/encargado_obra
// ─────────────────────────────────────────────────────────────
export async function deleteUnidad(id: number) {
  await requireManageRole();
  const [result] = await db.select({ total: count() }).from(cargas).where(eq(cargas.unidadId, id));
  if (result.total > 0)
    throw new Error(`No se puede eliminar: tiene ${result.total} cargas. Desactívala en su lugar.`);
  await db.delete(unidades).where(eq(unidades.id, id));
  revalidatePath("/catalogo/unidades");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
}

export async function deleteOperador(id: number) {
  await requireManageRole();
  const [result] = await db.select({ total: count() }).from(cargas).where(eq(cargas.operadorId, id));
  if (result.total > 0)
    throw new Error(`No se puede eliminar: tiene ${result.total} cargas. Desactívalo en su lugar.`);
  await db.delete(operadores).where(eq(operadores.id, id));
  revalidatePath("/catalogo/operadores");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
}

export async function deleteObra(id: number) {
  await requireManageRole();
  const [result] = await db.select({ total: count() }).from(cargas).where(eq(cargas.obraId, id));
  if (result.total > 0)
    throw new Error(`No se puede eliminar: tiene ${result.total} cargas. Desactívala en su lugar.`);
  await db.delete(obras).where(eq(obras.id, id));
  revalidatePath("/catalogo/obras");
  revalidatePath("/cargas/campo");
}
