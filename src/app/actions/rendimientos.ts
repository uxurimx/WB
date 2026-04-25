"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  periodos,
  cargas,
  unidades,
  rendimientos,
} from "@/db/schema";
import { eq, inArray, sql, desc } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────
// CERRAR PERÍODO Y CALCULAR RENDIMIENTOS
// ─────────────────────────────────────────────────────────────
export async function cerrarPeriodo(periodoId: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const periodo = await db.query.periodos.findFirst({
    where: eq(periodos.id, periodoId),
  });
  if (!periodo) throw new Error("Período no encontrado");
  if (periodo.cerrado) throw new Error("El período ya está cerrado");

  // 1 — Cargas del período
  const cargasDelPeriodo = await db
    .select({
      unidadId: cargas.unidadId,
      litros: cargas.litros,
      odometroHrs: cargas.odometroHrs,
    })
    .from(cargas)
    .where(eq(cargas.periodoId, periodoId));

  if (cargasDelPeriodo.length === 0) {
    // Cerrar sin cargas — válido, no hay rendimientos que calcular
    await db
      .update(periodos)
      .set({ cerrado: true, cerradoPorId: userId, cerradoAt: new Date() })
      .where(eq(periodos.id, periodoId));

    revalidatePath("/periodos");
    revalidatePath("/overview");
    return { ok: true, rendimientosCreados: 0 };
  }

  // 2 — Agrupar por unidad
  const porUnidad = new Map<
    number,
    { litros: number[]; odometros: number[] }
  >();
  for (const c of cargasDelPeriodo) {
    if (!porUnidad.has(c.unidadId)) {
      porUnidad.set(c.unidadId, { litros: [], odometros: [] });
    }
    const entry = porUnidad.get(c.unidadId)!;
    entry.litros.push(c.litros ?? 0);
    if (c.odometroHrs && c.odometroHrs > 0) {
      entry.odometros.push(c.odometroHrs);
    }
  }

  // 3 — Cargar datos de unidades
  const unidadIds = [...porUnidad.keys()];
  const unidadesData = await db
    .select()
    .from(unidades)
    .where(inArray(unidades.id, unidadIds));
  const unidadesMap = new Map(unidadesData.map((u) => [u.id, u]));

  // 4 — Calcular rendimientos
  const TOLERANCIA = 0.20; // 20%

  const vals: typeof rendimientos.$inferInsert[] = [];
  for (const [unidadId, data] of porUnidad) {
    const unidad = unidadesMap.get(unidadId);
    if (!unidad || unidad.tipo === "nissan") continue;

    const litrosConsumidos = data.litros.reduce((s, l) => s + l, 0);
    const odometroInicial =
      data.odometros.length > 0 ? Math.min(...data.odometros) : null;
    const odometroFinal =
      data.odometros.length > 0 ? Math.max(...data.odometros) : null;

    const kmHrsRecorridos =
      odometroInicial !== null &&
      odometroFinal !== null &&
      odometroFinal > odometroInicial
        ? odometroFinal - odometroInicial
        : null;

    let rendimientoActual: number | null = null;
    if (kmHrsRecorridos && kmHrsRecorridos > 0 && litrosConsumidos > 0) {
      rendimientoActual =
        unidad.tipo === "camion"
          ? kmHrsRecorridos / litrosConsumidos   // km/L
          : litrosConsumidos / kmHrsRecorridos;  // L/Hr
    }

    const rRef = unidad.rendimientoReferencia ?? null;
    let diferencia: number | null = null;
    let dentroDeTolerancia: boolean | null = null;

    if (rendimientoActual !== null && rRef) {
      diferencia = rendimientoActual - rRef;
      dentroDeTolerancia =
        Math.abs(diferencia / rRef) <= TOLERANCIA;
    }

    vals.push({
      periodoId,
      unidadId,
      odometroInicial,
      odometroFinal,
      kmHrsRecorridos,
      litrosConsumidos,
      rendimientoActual,
      rendimientoReferencia: rRef,
      diferencia,
      dentroDeTolerancia,
    });
  }

  // 5 — Guardar rendimientos y cerrar período
  if (vals.length > 0) {
    await db.insert(rendimientos).values(vals);
  }

  await db
    .update(periodos)
    .set({ cerrado: true, cerradoPorId: userId, cerradoAt: new Date() })
    .where(eq(periodos.id, periodoId));

  revalidatePath("/periodos");
  revalidatePath("/overview");
  return { ok: true, rendimientosCreados: vals.length };
}

// ─────────────────────────────────────────────────────────────
// RENDIMIENTOS DE UN PERÍODO
// ─────────────────────────────────────────────────────────────
export async function getRendimientosPeriodo(periodoId: number) {
  return db.query.rendimientos.findMany({
    where: eq(rendimientos.periodoId, periodoId),
    with: { unidad: true },
    orderBy: (r, { asc }) => [asc(r.unidadId)],
  });
}

// ─────────────────────────────────────────────────────────────
// HISTORIAL DE RENDIMIENTOS POR UNIDAD
// ─────────────────────────────────────────────────────────────
export async function getRendimientosUnidad(unidadId: number) {
  return db.query.rendimientos.findMany({
    where: eq(rendimientos.unidadId, unidadId),
    with: { periodo: true, unidad: { columns: { tipo: true } } },
    orderBy: (r, { desc }) => [desc(r.createdAt)],
  });
}

// ─────────────────────────────────────────────────────────────
// PERÍODOS CON ESTADÍSTICAS
// ─────────────────────────────────────────────────────────────
export async function getPeriodosConStats() {
  const lista = await db
    .select()
    .from(periodos)
    .orderBy(desc(periodos.fechaInicio));

  if (lista.length === 0) return [];

  const ids = lista.map((p) => p.id);

  const stats = await db
    .select({
      periodoId: cargas.periodoId,
      totalCargas: sql<number>`count(*)::int`,
      litrosTotales: sql<number>`coalesce(sum(${cargas.litros}), 0)::real`,
    })
    .from(cargas)
    .where(inArray(cargas.periodoId, ids))
    .groupBy(cargas.periodoId);

  const statsMap = new Map(stats.map((s) => [s.periodoId, s]));

  const rendStats = await db
    .select({
      periodoId: rendimientos.periodoId,
      total: sql<number>`count(*)::int`,
      fueraTolerancia: sql<number>`count(*) filter (where ${rendimientos.dentroDeTolerancia} = false)::int`,
    })
    .from(rendimientos)
    .where(inArray(rendimientos.periodoId, ids))
    .groupBy(rendimientos.periodoId);

  const rendMap = new Map(rendStats.map((r) => [r.periodoId, r]));

  return lista.map((p) => ({
    ...p,
    totalCargas: statsMap.get(p.id)?.totalCargas ?? 0,
    litrosTotales: statsMap.get(p.id)?.litrosTotales ?? 0,
    totalRendimientos: rendMap.get(p.id)?.total ?? 0,
    fueraTolerancia: rendMap.get(p.id)?.fueraTolerancia ?? 0,
  }));
}
