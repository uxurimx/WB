"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  periodos,
  cargas,
  unidades,
  rendimientos,
  odometroResets,
} from "@/db/schema";
import { eq, inArray, sql, desc, lt, isNotNull, and } from "drizzle-orm";
import { getTolerancia } from "@/app/actions/setup";
import { requireManageRole } from "@/lib/authz";
import { kmHrsRecorridos, type OdometroReset } from "@/lib/odometro";

// ─────────────────────────────────────────────────────────────
// LÓGICA COMPARTIDA DE CÁLCULO
// ─────────────────────────────────────────────────────────────
async function calcularValsRendimiento(
  periodoId: number,
  periodo: { fechaInicio: string },
  onlyUnidadIds?: number[],
): Promise<(typeof rendimientos.$inferInsert)[]> {
  const cargasDelPeriodo = await db
    .select({
      unidadId: cargas.unidadId,
      litros: cargas.litros,
      odometroHrs: cargas.odometroHrs,
      fecha: cargas.fecha,
      createdAt: cargas.createdAt,
    })
    .from(cargas)
    .where(
      onlyUnidadIds && onlyUnidadIds.length > 0
        ? and(eq(cargas.periodoId, periodoId), inArray(cargas.unidadId, onlyUnidadIds))
        : eq(cargas.periodoId, periodoId),
    );

  if (cargasDelPeriodo.length === 0) return [];

  const porUnidad = new Map<number, {
    litros: number[];
    lecturas: { raw: number; fecha: string; createdAt: Date | null }[];
  }>();
  for (const c of cargasDelPeriodo) {
    if (!porUnidad.has(c.unidadId)) {
      porUnidad.set(c.unidadId, { litros: [], lecturas: [] });
    }
    const entry = porUnidad.get(c.unidadId)!;
    entry.litros.push(c.litros ?? 0);
    if (c.odometroHrs && c.odometroHrs > 0) {
      entry.lecturas.push({ raw: c.odometroHrs, fecha: c.fecha, createdAt: c.createdAt ?? null });
    }
  }

  const unidadIds = [...porUnidad.keys()];
  const [unidadesData, resetsRows] = await Promise.all([
    db.select().from(unidades).where(inArray(unidades.id, unidadIds)),
    db.select().from(odometroResets).where(inArray(odometroResets.unidadId, unidadIds)),
  ]);
  const unidadesMap = new Map(unidadesData.map((u) => [u.id, u]));
  const resetsByUnidad = new Map<number, OdometroReset[]>();
  for (const r of resetsRows) {
    const list = resetsByUnidad.get(r.unidadId) ?? [];
    list.push({
      fecha: r.fecha,
      createdAt: r.createdAt ?? null,
      lecturaAnterior: r.lecturaAnterior,
      lecturaNueva: r.lecturaNueva,
    });
    resetsByUnidad.set(r.unidadId, list);
  }

  const rendAnts = await db
    .select({
      unidadId: rendimientos.unidadId,
      odometroFinal: rendimientos.odometroFinal,
    })
    .from(rendimientos)
    .innerJoin(periodos, eq(rendimientos.periodoId, periodos.id))
    .where(
      and(
        inArray(rendimientos.unidadId, unidadIds),
        lt(periodos.fechaFin, periodo.fechaInicio),
        isNotNull(rendimientos.odometroFinal),
      )
    )
    .orderBy(desc(periodos.fechaFin));

  const odometroRefMap = new Map<number, number>();
  for (const row of rendAnts) {
    if (!odometroRefMap.has(row.unidadId) && row.odometroFinal !== null) {
      odometroRefMap.set(row.unidadId, row.odometroFinal);
    }
  }

  const sinRef = unidadIds.filter((id) => !odometroRefMap.has(id));
  if (sinRef.length > 0) {
    const cargasAnts = await db
      .select({
        unidadId: cargas.unidadId,
        odometroHrs: cargas.odometroHrs,
        fecha: cargas.fecha,
        createdAt: cargas.createdAt,
      })
      .from(cargas)
      .where(
        and(
          inArray(cargas.unidadId, sinRef),
          lt(cargas.fecha, periodo.fechaInicio),
          isNotNull(cargas.odometroHrs),
        )
      )
      .orderBy(desc(cargas.fecha), desc(cargas.createdAt));

    const seen = new Set<number>();
    for (const row of cargasAnts) {
      if (seen.has(row.unidadId) || row.odometroHrs === null) continue;
      seen.add(row.unidadId);
      const resets = resetsByUnidad.get(row.unidadId) ?? [];
      const { final } = kmHrsRecorridos({
        lecturas: [{ raw: row.odometroHrs, fecha: row.fecha, createdAt: row.createdAt ?? null }],
        resets,
        referenciaRaw: null,
      });
      if (final != null) odometroRefMap.set(row.unidadId, final);
    }
  }

  const TOLERANCIA = await getTolerancia();

  const vals: (typeof rendimientos.$inferInsert)[] = [];
  for (const [unidadId, data] of porUnidad) {
    const unidad = unidadesMap.get(unidadId);
    if (!unidad || unidad.tipo === "nissan") continue;

    const litrosConsumidos = data.litros.reduce((s, l) => s + l, 0);
    const resets = resetsByUnidad.get(unidadId) ?? [];
    const refRaw = odometroRefMap.get(unidadId) ?? null;
    const calc = kmHrsRecorridos({
      lecturas: data.lecturas,
      resets,
      referenciaRaw: refRaw,
      referenciaAt: refRaw != null ? { fecha: "0000-01-01", createdAt: null } : null,
    });

    let rendimientoActual: number | null = null;
    if (calc.recorrido && calc.recorrido > 0 && litrosConsumidos > 0) {
      rendimientoActual =
        unidad.tipo === "camion"
          ? calc.recorrido / litrosConsumidos
          : litrosConsumidos / calc.recorrido;
    }

    const rRef = unidad.rendimientoReferencia ?? null;
    let diferencia: number | null = null;
    let dentroDeTolerancia: boolean | null = null;
    if (rendimientoActual !== null && rRef) {
      diferencia = rendimientoActual - rRef;
      dentroDeTolerancia = Math.abs(diferencia / rRef) <= TOLERANCIA;
    }

    vals.push({
      periodoId,
      unidadId,
      odometroInicial: calc.inicial,
      odometroFinal: calc.final,
      kmHrsRecorridos: calc.recorrido,
      litrosConsumidos,
      rendimientoActual,
      rendimientoReferencia: rRef,
      diferencia,
      dentroDeTolerancia,
    });
  }

  return vals;
}

export async function recalcularRendimientosForUnit(periodoId: number, unidadId: number) {
  const periodo = await db.query.periodos.findFirst({ where: eq(periodos.id, periodoId) });
  if (!periodo) return;

  await db.delete(rendimientos)
    .where(and(eq(rendimientos.periodoId, periodoId), eq(rendimientos.unidadId, unidadId)));

  const vals = await calcularValsRendimiento(periodoId, periodo, [unidadId]);
  if (vals.length > 0) await db.insert(rendimientos).values(vals);
}

// ─────────────────────────────────────────────────────────────
// CERRAR PERÍODO Y CALCULAR RENDIMIENTOS
// ─────────────────────────────────────────────────────────────
export async function cerrarPeriodo(periodoId: number) {
  const { userId } = await requireManageRole();

  const periodo = await db.query.periodos.findFirst({
    where: eq(periodos.id, periodoId),
  });
  if (!periodo) throw new Error("Período no encontrado");
  if (periodo.cerrado) throw new Error("El período ya está cerrado");

  const vals = await calcularValsRendimiento(periodoId, periodo);

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
// RECALCULAR RENDIMIENTOS DE UN PERÍODO YA CERRADO
// ─────────────────────────────────────────────────────────────
export async function recalcularRendimientos(periodoId: number) {
  await requireManageRole();

  const periodo = await db.query.periodos.findFirst({
    where: eq(periodos.id, periodoId),
  });
  if (!periodo) throw new Error("Período no encontrado");
  if (!periodo.cerrado) throw new Error("Solo se pueden recalcular períodos cerrados");

  await db.delete(rendimientos).where(eq(rendimientos.periodoId, periodoId));

  const vals = await calcularValsRendimiento(periodoId, periodo);
  if (vals.length > 0) {
    await db.insert(rendimientos).values(vals);
  }

  revalidatePath("/periodos");
  revalidatePath(`/periodos/${periodoId}`);
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

  // fueraTolerancia solo cuenta desviaciones que empeoran: camión rinde menos (Δ<0),
  // maquinaria consume más (Δ>0). Las mejoras fuera de tolerancia no suman al indicador.
  const rendStats = await db
    .select({
      periodoId: rendimientos.periodoId,
      total: sql<number>`count(*)::int`,
      fueraTolerancia: sql<number>`count(*) filter (where ${rendimientos.dentroDeTolerancia} = false and ((${unidades.tipo} = 'camion' and ${rendimientos.diferencia} < 0) or (${unidades.tipo} <> 'camion' and ${rendimientos.diferencia} > 0)))::int`,
    })
    .from(rendimientos)
    .innerJoin(unidades, eq(rendimientos.unidadId, unidades.id))
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
