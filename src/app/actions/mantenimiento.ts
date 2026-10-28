"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  configuracion,
  mantenimientosEventos,
  mantenimientosPlanes,
  odometroResets,
  unidades,
} from "@/db/schema";
import { requireMaintenanceManager } from "@/lib/authz";
import { and, eq, inArray } from "drizzle-orm";
import { trueOdometro, type OdometroReset } from "@/lib/odometro";
import {
  normalizeMantenimientoConfig,
  type TipoControlMantenimiento,
  type TipoUnidadMantenimiento,
} from "@/lib/mantenimiento-config";
export type { TipoControlMantenimiento } from "@/lib/mantenimiento-config";

export type EstadoMantenimiento = "sin_config" | "ok" | "proximo" | "vencido";

export type ResumenPlanMantenimiento = {
  planId: number | null;
  unidadId: number;
  tipoControl: TipoControlMantenimiento;
  activo: boolean;
  origen: "manual" | "global" | "sin_config";
  intervalo: number | null;
  umbralAlerta: number | null;
  lecturaActual: number | null;
  lecturaServicio: number | null;
  fechaServicio: string | null;
  proximoServicioEn: number | null;
  faltante: number | null;
  excedente: number | null;
  estado: EstadoMantenimiento;
  nivelAlerta: "proximo" | "cercano" | "inminente" | "vencido" | null;
  inconsistencia: string | null;
};

export type ResumenMantenimientoUnidad = {
  unidadId: number;
  unidadCodigo: string;
  estadoGlobal: EstadoMantenimiento;
  planes: ResumenPlanMantenimiento[];
};

export type AlertaMantenimiento = {
  unidadId: number;
  unidadCodigo: string;
  tipoControl: TipoControlMantenimiento;
  estado: "proximo" | "vencido";
  nivelAlerta: "proximo" | "cercano" | "inminente" | "vencido";
  lecturaActual: number;
  lecturaServicio: number;
  proximoServicioEn: number;
  faltante: number;
};

function assertTipoControl(value: string): asserts value is TipoControlMantenimiento {
  if (value !== "km" && value !== "hrs") {
    throw new Error("Tipo de control inválido");
  }
}

function computePlanSummary(args: {
  unidadId: number;
  tipoControl: TipoControlMantenimiento;
  lecturaActual: number | null;
  plan?: {
    id: number | null;
    intervalo: number;
    umbralAlerta: number;
    umbralCercano: number | null;
    umbralInminente: number | null;
    activo: boolean;
  } | null;
  evento?: {
    fechaServicio: string;
    lecturaServicio: number;
  } | null;
}): ResumenPlanMantenimiento {
  const { unidadId, tipoControl, lecturaActual, plan, evento } = args;

  if (!plan || !plan.activo) {
    return {
      planId: plan?.id ?? null,
      unidadId,
      tipoControl,
      activo: false,
      origen: plan ? "manual" : "sin_config",
      intervalo: plan?.intervalo ?? null,
      umbralAlerta: plan?.umbralAlerta ?? null,
      lecturaActual,
      lecturaServicio: evento?.lecturaServicio ?? null,
      fechaServicio: evento?.fechaServicio ?? null,
      proximoServicioEn: null,
      faltante: null,
      excedente: null,
      estado: "sin_config",
      nivelAlerta: null,
      inconsistencia: null,
    };
  }

  if (lecturaActual === null || lecturaActual < 0) {
    return {
      planId: plan.id,
      unidadId,
      tipoControl,
      activo: true,
      origen: plan.id ? "manual" : "global",
      intervalo: plan.intervalo,
      umbralAlerta: plan.umbralAlerta,
      lecturaActual,
      lecturaServicio: evento?.lecturaServicio ?? null,
      fechaServicio: evento?.fechaServicio ?? null,
      proximoServicioEn: null,
      faltante: null,
      excedente: null,
      estado: "sin_config",
      nivelAlerta: null,
      inconsistencia: "Sin lectura actual para calcular mantenimiento.",
    };
  }

  if (!evento) {
    return {
      planId: plan.id,
      unidadId,
      tipoControl,
      activo: true,
      origen: plan.id ? "manual" : "global",
      intervalo: plan.intervalo,
      umbralAlerta: plan.umbralAlerta,
      lecturaActual,
      lecturaServicio: null,
      fechaServicio: null,
      proximoServicioEn: null,
      faltante: null,
      excedente: null,
      estado: "sin_config",
      nivelAlerta: null,
      inconsistencia: "Falta registrar el último mantenimiento como base.",
    };
  }

  if (lecturaActual < evento.lecturaServicio) {
    return {
      planId: plan.id,
      unidadId,
      tipoControl,
      activo: true,
      origen: plan.id ? "manual" : "global",
      intervalo: plan.intervalo,
      umbralAlerta: plan.umbralAlerta,
      lecturaActual,
      lecturaServicio: evento.lecturaServicio,
      fechaServicio: evento.fechaServicio,
      proximoServicioEn: null,
      faltante: null,
      excedente: null,
      estado: "sin_config",
      nivelAlerta: null,
      inconsistencia: "La lectura actual es menor que la lectura del último servicio.",
    };
  }

  const proximoServicioEn = evento.lecturaServicio + plan.intervalo;
  const faltante = proximoServicioEn - lecturaActual;
  const excedente = faltante < 0 ? Math.abs(faltante) : 0;

  let estado: EstadoMantenimiento = "ok";
  let nivelAlerta: "proximo" | "cercano" | "inminente" | "vencido" | null = null;
  if (faltante < 0) {
    estado = "vencido";
    nivelAlerta = "vencido";
  } else if (faltante <= plan.umbralAlerta) {
    estado = "proximo";
    nivelAlerta = "proximo";
    if (plan.umbralInminente !== null && faltante <= plan.umbralInminente) nivelAlerta = "inminente";
    else if (plan.umbralCercano !== null && faltante <= plan.umbralCercano) nivelAlerta = "cercano";
  }

  return {
    planId: plan.id,
    unidadId,
    tipoControl,
    activo: true,
    origen: plan.id ? "manual" : "global",
    intervalo: plan.intervalo,
    umbralAlerta: plan.umbralAlerta,
    lecturaActual,
    lecturaServicio: evento.lecturaServicio,
    fechaServicio: evento.fechaServicio,
    proximoServicioEn,
    faltante,
    excedente,
    estado,
    nivelAlerta,
    inconsistencia: null,
  };
}

function computeGlobalState(planes: ResumenPlanMantenimiento[]): EstadoMantenimiento {
  if (planes.some((p) => p.estado === "vencido")) return "vencido";
  if (planes.some((p) => p.estado === "proximo")) return "proximo";
  if (planes.some((p) => p.estado === "ok")) return "ok";
  return "sin_config";
}

type EffectivePlan = {
  id: number | null;
  intervalo: number;
  umbralAlerta: number;
  umbralCercano: number | null;
  umbralInminente: number | null;
  activo: boolean;
};

async function getRawMantenimientoData(unidadIds: number[]) {
  const [units, planes, eventos, configRows, resets] = await Promise.all([
    db.query.unidades.findMany({
      where: inArray(unidades.id, unidadIds),
      columns: { id: true, codigo: true, odometroActual: true, odometroOffset: true, tipo: true },
    }),
    db.query.mantenimientosPlanes.findMany({
      where: inArray(mantenimientosPlanes.unidadId, unidadIds),
      orderBy: (p, { asc }) => [asc(p.unidadId), asc(p.tipoControl)],
    }),
    db.query.mantenimientosEventos.findMany({
      where: inArray(mantenimientosEventos.unidadId, unidadIds),
      orderBy: (e, { desc: d }) => [d(e.fechaServicio), d(e.createdAt)],
    }),
    db.query.configuracion.findMany({
      where: inArray(configuracion.clave, [
        "mantenimiento_defaults_tipo",
        "mantenimiento_alertas_umbral",
      ]),
    }),
    db.query.odometroResets.findMany({
      where: inArray(odometroResets.unidadId, unidadIds),
    }),
  ]);

  return { units, planes, eventos, configRows, resets };
}

function buildSummaries(data: Awaited<ReturnType<typeof getRawMantenimientoData>>): ResumenMantenimientoUnidad[] {
  const configMap = Object.fromEntries(data.configRows.map((row) => [row.clave, row.valor]));
  const globalConfig = normalizeMantenimientoConfig(
    configMap["mantenimiento_defaults_tipo"],
    configMap["mantenimiento_alertas_umbral"],
  );
  const planesByKey = new Map<string, (typeof data.planes)[number]>();
  for (const plan of data.planes) {
    planesByKey.set(`${plan.unidadId}:${plan.tipoControl}`, plan);
  }

  const eventosByKey = new Map<string, (typeof data.eventos)[number]>();
  for (const evento of data.eventos) {
    const key = `${evento.unidadId}:${evento.tipoControl}`;
    if (!eventosByKey.has(key)) eventosByKey.set(key, evento);
  }

  const resetsByUnidad = new Map<number, OdometroReset[]>();
  for (const r of data.resets) {
    const list = resetsByUnidad.get(r.unidadId) ?? [];
    list.push({
      fecha: r.fecha,
      createdAt: r.createdAt ?? null,
      lecturaAnterior: r.lecturaAnterior,
      lecturaNueva: r.lecturaNueva,
    });
    resetsByUnidad.set(r.unidadId, list);
  }

  return data.units.map((unidad) => {
    const planes = (["km", "hrs"] as TipoControlMantenimiento[]).map((tipoControl) => {
      const key = `${unidad.id}:${tipoControl}`;
      const plan = planesByKey.get(key) ?? null;
      const evento = eventosByKey.get(key) ?? null;
      const tipoUnidad = (unidad.tipo as TipoUnidadMantenimiento) ?? "otro";
      const defaultTipo = globalConfig.defaults[tipoUnidad] ?? globalConfig.defaults.otro;
      const defaultUmbrales = globalConfig.alertas[tipoControl];
      const effectivePlan: EffectivePlan | null = plan
        ? {
            id: plan.id,
            intervalo: plan.intervalo,
            umbralAlerta: plan.umbralAlerta,
            umbralCercano: null,
            umbralInminente: null,
            activo: plan.activo,
          }
        : defaultTipo.activo && defaultTipo.tipoControl === tipoControl
          ? {
              id: null,
              intervalo: defaultTipo.intervalo,
              umbralAlerta: defaultUmbrales.proximo,
              umbralCercano: defaultUmbrales.cercano,
              umbralInminente: defaultUmbrales.inminente,
              activo: true,
            }
          : null;

      const resets = resetsByUnidad.get(unidad.id) ?? [];
      const lecturaRaw = unidad.odometroActual ?? null;
      const lecturaActual =
        lecturaRaw == null
          ? null
          : lecturaRaw + (unidad.odometroOffset ?? 0);
      const eventoTrue = evento
        ? {
            fechaServicio: evento.fechaServicio,
            lecturaServicio: trueOdometro(
              evento.lecturaServicio,
              { fecha: evento.fechaServicio, createdAt: evento.createdAt ?? null },
              resets,
            ),
          }
        : null;

      return computePlanSummary({
        unidadId: unidad.id,
        tipoControl,
        lecturaActual,
        plan: effectivePlan
          ? {
              id: effectivePlan.id,
              intervalo: effectivePlan.intervalo,
              umbralAlerta: effectivePlan.umbralAlerta,
              umbralCercano: effectivePlan.umbralCercano ?? null,
              umbralInminente: effectivePlan.umbralInminente ?? null,
              activo: effectivePlan.activo,
            }
          : null,
        evento: eventoTrue,
      });
    });

    return {
      unidadId: unidad.id,
      unidadCodigo: unidad.codigo,
      estadoGlobal: computeGlobalState(planes),
      planes,
    };
  });
}

export async function getPlanesMantenimientoUnidad(unidadId: number) {
  return db.query.mantenimientosPlanes.findMany({
    where: eq(mantenimientosPlanes.unidadId, unidadId),
    orderBy: (p, { asc }) => [asc(p.tipoControl)],
  });
}

export async function getEventosMantenimientoUnidad(unidadId: number) {
  return db.query.mantenimientosEventos.findMany({
    where: eq(mantenimientosEventos.unidadId, unidadId),
    orderBy: (e, { desc: d }) => [d(e.fechaServicio), d(e.createdAt)],
  });
}

export async function getResumenMantenimientoUnidad(unidadId: number) {
  const data = await getRawMantenimientoData([unidadId]);
  return buildSummaries(data)[0] ?? null;
}

export async function getResumenMantenimientoUnidades(unidadIds?: number[]) {
  const resolvedIds =
    unidadIds && unidadIds.length > 0
      ? unidadIds
      : (
          await db.query.unidades.findMany({
            columns: { id: true },
            orderBy: (u, { asc }) => [asc(u.codigo)],
          })
        ).map((u) => u.id);

  if (resolvedIds.length === 0) return [];
  const data = await getRawMantenimientoData(resolvedIds);
  return buildSummaries(data);
}

export async function getAlertasMantenimientoOverview(): Promise<AlertaMantenimiento[]> {
  const summaries = await getResumenMantenimientoUnidades();
  const alertas: AlertaMantenimiento[] = [];

  for (const summary of summaries) {
    for (const plan of summary.planes) {
      if (
        (plan.estado === "proximo" || plan.estado === "vencido") &&
        plan.lecturaActual !== null &&
        plan.lecturaServicio !== null &&
        plan.proximoServicioEn !== null &&
        plan.faltante !== null
      ) {
        alertas.push({
          unidadId: summary.unidadId,
          unidadCodigo: summary.unidadCodigo,
          tipoControl: plan.tipoControl,
          estado: plan.estado,
          nivelAlerta: plan.nivelAlerta ?? (plan.estado === "vencido" ? "vencido" : "proximo"),
          lecturaActual: plan.lecturaActual,
          lecturaServicio: plan.lecturaServicio,
          proximoServicioEn: plan.proximoServicioEn,
          faltante: plan.faltante,
        });
      }
    }
  }

  return alertas.sort((a, b) => {
    if (a.estado !== b.estado) return a.estado === "vencido" ? -1 : 1;
    return a.faltante - b.faltante;
  });
}

export async function upsertPlanMantenimiento(input: {
  unidadId: number;
  tipoControl: string;
  intervalo: number;
  umbralAlerta: number;
  activo: boolean;
  notas?: string | null;
}) {
  await requireMaintenanceManager();
  assertTipoControl(input.tipoControl);

  if (input.intervalo <= 0) throw new Error("El intervalo debe ser mayor a 0");
  if (input.umbralAlerta < 0) throw new Error("El umbral no puede ser negativo");
  if (input.umbralAlerta >= input.intervalo) {
    throw new Error("El umbral debe ser menor que el intervalo");
  }

  const existing = await db.query.mantenimientosPlanes.findFirst({
    where: and(
      eq(mantenimientosPlanes.unidadId, input.unidadId),
      eq(mantenimientosPlanes.tipoControl, input.tipoControl),
    ),
  });

  if (existing) {
    await db
      .update(mantenimientosPlanes)
      .set({
        intervalo: input.intervalo,
        umbralAlerta: input.umbralAlerta,
        activo: input.activo,
        notas: input.notas ?? null,
        updatedAt: new Date(),
      })
      .where(eq(mantenimientosPlanes.id, existing.id));
  } else {
    await db.insert(mantenimientosPlanes).values({
      unidadId: input.unidadId,
      tipoControl: input.tipoControl,
      intervalo: input.intervalo,
      umbralAlerta: input.umbralAlerta,
      activo: input.activo,
      notas: input.notas ?? null,
    });
  }

  revalidatePath("/catalogo/unidades");
  revalidatePath(`/catalogo/unidades/${input.unidadId}`);
  revalidatePath("/overview");
}

export async function togglePlanMantenimiento(planId: number, activo: boolean) {
  await requireMaintenanceManager();

  const existing = await db.query.mantenimientosPlanes.findFirst({
    where: eq(mantenimientosPlanes.id, planId),
  });
  if (!existing) throw new Error("Plan no encontrado");

  await db
    .update(mantenimientosPlanes)
    .set({ activo, updatedAt: new Date() })
    .where(eq(mantenimientosPlanes.id, planId));

  revalidatePath("/catalogo/unidades");
  revalidatePath(`/catalogo/unidades/${existing.unidadId}`);
  revalidatePath("/overview");
}

export async function registrarMantenimientoUnidad(input: {
  unidadId: number;
  tipoControl: string;
  fechaServicio: string;
  lecturaServicio: number;
  descripcion?: string | null;
  notas?: string | null;
}) {
  const { userId } = await requireMaintenanceManager();
  assertTipoControl(input.tipoControl);

  if (!input.fechaServicio) throw new Error("La fecha de servicio es obligatoria");
  if (input.lecturaServicio < 0) throw new Error("La lectura no puede ser negativa");

  const plan = await db.query.mantenimientosPlanes.findFirst({
    where: and(
      eq(mantenimientosPlanes.unidadId, input.unidadId),
      eq(mantenimientosPlanes.tipoControl, input.tipoControl),
    ),
  });

  const [evento] = await db.insert(mantenimientosEventos).values({
    unidadId: input.unidadId,
    planId: plan?.id ?? null,
    tipoControl: input.tipoControl,
    fechaServicio: input.fechaServicio,
    lecturaServicio: input.lecturaServicio,
    descripcion: input.descripcion ?? null,
    notas: input.notas ?? null,
    registradoPorId: userId,
  }).returning({ id: mantenimientosEventos.id });

  revalidatePath("/catalogo/unidades");
  revalidatePath(`/catalogo/unidades/${input.unidadId}`);
  revalidatePath("/overview");
  return { id: evento.id };
}

export async function updateEventoMantenimiento(input: {
  id: number;
  fechaServicio?: string;
  lecturaServicio?: number;
  descripcion?: string | null;
  notas?: string | null;
}) {
  await requireMaintenanceManager();

  const existing = await db.query.mantenimientosEventos.findFirst({
    where: eq(mantenimientosEventos.id, input.id),
  });
  if (!existing) throw new Error("Evento de mantenimiento no encontrado");

  if (input.lecturaServicio != null && input.lecturaServicio < 0) {
    throw new Error("La lectura no puede ser negativa");
  }

  await db
    .update(mantenimientosEventos)
    .set({
      fechaServicio: input.fechaServicio ?? existing.fechaServicio,
      lecturaServicio: input.lecturaServicio ?? existing.lecturaServicio,
      descripcion: input.descripcion !== undefined ? input.descripcion : existing.descripcion,
      notas: input.notas !== undefined ? input.notas : existing.notas,
    })
    .where(eq(mantenimientosEventos.id, input.id));

  revalidatePath("/catalogo/unidades");
  revalidatePath(`/catalogo/unidades/${existing.unidadId}`);
  revalidatePath("/overview");
}
