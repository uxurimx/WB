"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  mantenimientosEventos,
  mantenimientosPlanes,
  unidades,
} from "@/db/schema";
import { requireMaintenanceManager } from "@/lib/authz";
import { and, desc, eq, inArray } from "drizzle-orm";

export type TipoControlMantenimiento = "km" | "hrs";
export type EstadoMantenimiento = "sin_config" | "ok" | "proximo" | "vencido";

export type ResumenPlanMantenimiento = {
  planId: number | null;
  unidadId: number;
  tipoControl: TipoControlMantenimiento;
  activo: boolean;
  intervalo: number | null;
  umbralAlerta: number | null;
  lecturaActual: number | null;
  lecturaServicio: number | null;
  fechaServicio: string | null;
  proximoServicioEn: number | null;
  faltante: number | null;
  excedente: number | null;
  estado: EstadoMantenimiento;
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
    id: number;
    intervalo: number;
    umbralAlerta: number;
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
      intervalo: plan?.intervalo ?? null,
      umbralAlerta: plan?.umbralAlerta ?? null,
      lecturaActual,
      lecturaServicio: evento?.lecturaServicio ?? null,
      fechaServicio: evento?.fechaServicio ?? null,
      proximoServicioEn: null,
      faltante: null,
      excedente: null,
      estado: "sin_config",
      inconsistencia: null,
    };
  }

  if (lecturaActual === null || lecturaActual < 0) {
    return {
      planId: plan.id,
      unidadId,
      tipoControl,
      activo: true,
      intervalo: plan.intervalo,
      umbralAlerta: plan.umbralAlerta,
      lecturaActual,
      lecturaServicio: evento?.lecturaServicio ?? null,
      fechaServicio: evento?.fechaServicio ?? null,
      proximoServicioEn: null,
      faltante: null,
      excedente: null,
      estado: "sin_config",
      inconsistencia: "Sin lectura actual para calcular mantenimiento.",
    };
  }

  if (!evento) {
    return {
      planId: plan.id,
      unidadId,
      tipoControl,
      activo: true,
      intervalo: plan.intervalo,
      umbralAlerta: plan.umbralAlerta,
      lecturaActual,
      lecturaServicio: null,
      fechaServicio: null,
      proximoServicioEn: null,
      faltante: null,
      excedente: null,
      estado: "sin_config",
      inconsistencia: "Falta registrar el último mantenimiento como base.",
    };
  }

  if (lecturaActual < evento.lecturaServicio) {
    return {
      planId: plan.id,
      unidadId,
      tipoControl,
      activo: true,
      intervalo: plan.intervalo,
      umbralAlerta: plan.umbralAlerta,
      lecturaActual,
      lecturaServicio: evento.lecturaServicio,
      fechaServicio: evento.fechaServicio,
      proximoServicioEn: null,
      faltante: null,
      excedente: null,
      estado: "sin_config",
      inconsistencia: "La lectura actual es menor que la lectura del último servicio.",
    };
  }

  const proximoServicioEn = evento.lecturaServicio + plan.intervalo;
  const faltante = proximoServicioEn - lecturaActual;
  const excedente = faltante < 0 ? Math.abs(faltante) : 0;

  let estado: EstadoMantenimiento = "ok";
  if (faltante < 0) estado = "vencido";
  else if (faltante <= plan.umbralAlerta) estado = "proximo";

  return {
    planId: plan.id,
    unidadId,
    tipoControl,
    activo: true,
    intervalo: plan.intervalo,
    umbralAlerta: plan.umbralAlerta,
    lecturaActual,
    lecturaServicio: evento.lecturaServicio,
    fechaServicio: evento.fechaServicio,
    proximoServicioEn,
    faltante,
    excedente,
    estado,
    inconsistencia: null,
  };
}

function computeGlobalState(planes: ResumenPlanMantenimiento[]): EstadoMantenimiento {
  if (planes.some((p) => p.estado === "vencido")) return "vencido";
  if (planes.some((p) => p.estado === "proximo")) return "proximo";
  if (planes.some((p) => p.estado === "ok")) return "ok";
  return "sin_config";
}

async function getRawMantenimientoData(unidadIds: number[]) {
  const [units, planes, eventos] = await Promise.all([
    db.query.unidades.findMany({
      where: inArray(unidades.id, unidadIds),
      columns: { id: true, codigo: true, odometroActual: true },
    }),
    db.query.mantenimientosPlanes.findMany({
      where: inArray(mantenimientosPlanes.unidadId, unidadIds),
      orderBy: (p, { asc }) => [asc(p.unidadId), asc(p.tipoControl)],
    }),
    db.query.mantenimientosEventos.findMany({
      where: inArray(mantenimientosEventos.unidadId, unidadIds),
      orderBy: (e, { desc: d }) => [d(e.fechaServicio), d(e.createdAt)],
    }),
  ]);

  return { units, planes, eventos };
}

function buildSummaries(data: Awaited<ReturnType<typeof getRawMantenimientoData>>): ResumenMantenimientoUnidad[] {
  const planesByKey = new Map<string, (typeof data.planes)[number]>();
  for (const plan of data.planes) {
    planesByKey.set(`${plan.unidadId}:${plan.tipoControl}`, plan);
  }

  const eventosByKey = new Map<string, (typeof data.eventos)[number]>();
  for (const evento of data.eventos) {
    const key = `${evento.unidadId}:${evento.tipoControl}`;
    if (!eventosByKey.has(key)) eventosByKey.set(key, evento);
  }

  return data.units.map((unidad) => {
    const planes = (["km", "hrs"] as TipoControlMantenimiento[]).map((tipoControl) => {
      const key = `${unidad.id}:${tipoControl}`;
      const plan = planesByKey.get(key) ?? null;
      const evento = eventosByKey.get(key) ?? null;
      return computePlanSummary({
        unidadId: unidad.id,
        tipoControl,
        lecturaActual: unidad.odometroActual ?? null,
        plan: plan
          ? {
              id: plan.id,
              intervalo: plan.intervalo,
              umbralAlerta: plan.umbralAlerta,
              activo: plan.activo,
            }
          : null,
        evento: evento
          ? {
              fechaServicio: evento.fechaServicio,
              lecturaServicio: evento.lecturaServicio,
            }
          : null,
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

  await db.insert(mantenimientosEventos).values({
    unidadId: input.unidadId,
    planId: plan?.id ?? null,
    tipoControl: input.tipoControl,
    fechaServicio: input.fechaServicio,
    lecturaServicio: input.lecturaServicio,
    descripcion: input.descripcion ?? null,
    notas: input.notas ?? null,
    registradoPorId: userId,
  });

  revalidatePath("/catalogo/unidades");
  revalidatePath(`/catalogo/unidades/${input.unidadId}`);
  revalidatePath("/overview");
}
