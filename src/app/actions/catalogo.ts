"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { unidades, operadores, obras, cargas, rendimientos, periodos } from "@/db/schema";
import { eq, count, inArray, and, sql } from "drizzle-orm";
import { requireManageRole } from "@/lib/authz";
import { getResumenMantenimientoUnidades } from "@/app/actions/mantenimiento";

// ─────────────────────────────────────────────────────────────
// UNIDADES
// ─────────────────────────────────────────────────────────────
export async function getUnidades(soloActivas = true) {
  return db.query.unidades.findMany({
    where: soloActivas ? eq(unidades.activo, true) : undefined,
    orderBy: (u, { asc }) => [asc(u.tipo), asc(u.codigo)],
  });
}

export async function getUnidadesConStats() {
  const all = await db.query.unidades.findMany({
    orderBy: (u, { asc }) => [asc(u.tipo), asc(u.codigo)],
  });

  if (all.length === 0) return [];
  const ids = all.map((u) => u.id);

  const [cargasStats, rendStats, mantenimientoStats] = await Promise.all([
    db
      .select({
        unidadId:   cargas.unidadId,
        totalLitros: sql<number>`coalesce(sum(${cargas.litros}), 0)::real`,
        totalCargas: sql<number>`count(*)::int`,
        ultimaFecha: sql<string>`max(${cargas.fecha})`,
      })
      .from(cargas)
      .where(inArray(cargas.unidadId, ids))
      .groupBy(cargas.unidadId),
    db
      .select({
        unidadId:             rendimientos.unidadId,
        periodoNombre:        periodos.nombre,
        rendimientoActual:    rendimientos.rendimientoActual,
        rendimientoReferencia: rendimientos.rendimientoReferencia,
        diferencia:           rendimientos.diferencia,
        dentroDeTolerancia:   rendimientos.dentroDeTolerancia,
        litrosConsumidos:     rendimientos.litrosConsumidos,
        fechaFin:             periodos.fechaFin,
      })
      .from(rendimientos)
      .innerJoin(periodos, eq(rendimientos.periodoId, periodos.id))
      .where(and(inArray(rendimientos.unidadId, ids), eq(periodos.cerrado, true))),
    getResumenMantenimientoUnidades(ids),
  ]);

  // Último período por unidad (mayor fechaFin)
  const rendMap = new Map<number, typeof rendStats[0]>();
  for (const r of rendStats) {
    const prev = rendMap.get(r.unidadId);
    if (!prev || (r.fechaFin && (!prev.fechaFin || r.fechaFin > prev.fechaFin))) {
      rendMap.set(r.unidadId, r);
    }
  }

  const cargasMap = new Map(cargasStats.map((s) => [s.unidadId, s]));
  const mantenimientoMap = new Map(mantenimientoStats.map((s) => [s.unidadId, s]));

  return all.map((u) => {
    const cs   = cargasMap.get(u.id);
    const rend = rendMap.get(u.id);
    const mantenimiento = mantenimientoMap.get(u.id) ?? null;
    return {
      ...u,
      totalLitros: cs?.totalLitros ?? 0,
      totalCargas: cs?.totalCargas ?? 0,
      ultimaFecha: cs?.ultimaFecha ?? null,
      ultimoPeriodo: rend
        ? {
            nombre:               rend.periodoNombre,
            rendimientoActual:    rend.rendimientoActual,
            rendimientoReferencia: rend.rendimientoReferencia,
            diferencia:           rend.diferencia,
            dentroDeTolerancia:   rend.dentroDeTolerancia,
          }
        : null,
      mantenimientoResumen: mantenimiento,
      mantenimientoEstadoGlobal: mantenimiento?.estadoGlobal ?? "sin_config",
    };
  });
}

// ─────────────────────────────────────────────────────────────
// CARGAS DE CATÁLOGO — todas las cargas (sin límite) para páginas de detalle
// ─────────────────────────────────────────────────────────────
export async function getCatalogoCargas(
  tipo: "unidad" | "operador" | "obra",
  id: number
) {
  const rows = await db.query.cargas.findMany({
    where:
      tipo === "unidad"    ? eq(cargas.unidadId, id)
      : tipo === "operador" ? eq(cargas.operadorId, id)
      : eq(cargas.obraId, id),
    orderBy: (c, { desc }) => [desc(c.fecha), desc(c.createdAt)],
    with: {
      unidad:   { columns: { codigo: true } },
      operador: { columns: { nombre: true } },
      obra:     { columns: { nombre: true } },
      periodo:  { columns: { id: true, nombre: true, cerrado: true } },
    },
    columns: {
      id: true, fecha: true, hora: true, folio: true, litros: true, origen: true,
      odometroHrs: true, periodoId: true, operadorId: true, obraId: true,
      cuentaLtInicio: true, cuentaLtFin: true, tipoDiesel: true, notas: true, kmEstimado: true,
    },
  });

  return rows.map((c) => ({
    id:             c.id,
    fecha:          c.fecha,
    hora:           c.hora ?? null,
    folio:          c.folio,
    litros:         c.litros,
    origen:         c.origen,
    tipoDiesel:     c.tipoDiesel ?? null,
    notas:          c.notas ?? null,
    odometroHrs:    c.odometroHrs ?? null,
    kmEstimado:     c.kmEstimado ?? false,
    periodoId:      c.periodoId ?? null,
    periodoNombre:  c.periodo?.nombre ?? null,
    periodoCerrado: c.periodo?.cerrado ?? false,
    operadorId:     c.operadorId ?? null,
    obraId:         c.obraId ?? null,
    cuentaLtInicio: c.cuentaLtInicio ?? null,
    cuentaLtFin:    c.cuentaLtFin ?? null,
    unidadCodigo:   c.unidad?.codigo    ?? null,
    operadorNombre: c.operador?.nombre  ?? null,
    obraNombre:     c.obra?.nombre      ?? null,
  }));
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

// Creación rápida desde el form de campo — sin requerir rol especial
// La obra queda activa y disponible de inmediato
export async function createObraRapida(nombre: string) {
  const { userId } = await (await import("@clerk/nextjs/server")).auth();
  if (!userId) throw new Error("No autenticado");
  const nombreTrimmed = nombre.trim();
  if (!nombreTrimmed) throw new Error("El nombre de la obra no puede estar vacío");
  const [nueva] = await db
    .insert(obras)
    .values({ nombre: nombreTrimmed, activo: true })
    .returning();
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
