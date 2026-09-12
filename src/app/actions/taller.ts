"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  ordenesTaller,
  ordenChecklist,
  ordenRefacciones,
  unidades,
  operadores,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireActionPermission, requireAnyActionPermission, requireManageRole } from "@/lib/authz";
import { CHECKLIST_PUNTOS, type EstadoOrden } from "@/lib/taller-checklist";
import { registrarMantenimientoUnidad } from "@/app/actions/mantenimiento";
import { getNowLocal } from "@/lib/date-utils";

export type RefaccionInput = {
  descripcion: string;
  cantidad?: number | null;
  cajas?: number | null;
  precio?: number | null;
  iva?: boolean;
  proveedor?: string | null;
  folioFactura?: string | null;
};

export type ChecklistInput = {
  clave: string;
  ok: boolean | null;
  nota?: string | null;
};

export async function getOrdenesTaller(opts?: { unidadId?: number; estado?: EstadoOrden }) {
  await requireActionPermission("taller");
  const where = [];
  if (opts?.unidadId) where.push(eq(ordenesTaller.unidadId, opts.unidadId));
  if (opts?.estado) where.push(eq(ordenesTaller.estado, opts.estado));

  return db.query.ordenesTaller.findMany({
    where: where.length ? and(...where) : undefined,
    orderBy: (t, { desc: d }) => [d(t.fecha), d(t.createdAt)],
    with: {
      unidad: { columns: { id: true, codigo: true, tipo: true } },
      operador: { columns: { id: true, nombre: true } },
      refacciones: true,
    },
  });
}

export async function getOrdenTaller(id: number) {
  await requireActionPermission("taller");
  const orden = await db.query.ordenesTaller.findFirst({
    where: eq(ordenesTaller.id, id),
    with: {
      unidad: true,
      operador: true,
      checklist: true,
      refacciones: true,
    },
  });
  return orden ?? null;
}

export async function getOrdenesUnidad(unidadId: number) {
  await requireAnyActionPermission(["taller", "catalogo"]);
  return db.query.ordenesTaller.findMany({
    where: eq(ordenesTaller.unidadId, unidadId),
    orderBy: (t, { desc: d }) => [d(t.fecha), d(t.createdAt)],
    with: { refacciones: true, operador: { columns: { nombre: true } } },
  });
}

export async function crearOrdenTaller(input: {
  unidadId: number;
  operadorId?: number | null;
  fecha?: string;
  kmHrs?: number | null;
  motivo?: string | null;
  quienRecibio?: string | null;
  comentarios?: string | null;
  checklist?: ChecklistInput[];
}) {
  const { userId } = await requireActionPermission("taller");
  const unidad = await db.query.unidades.findFirst({ where: eq(unidades.id, input.unidadId) });
  if (!unidad) throw new Error("Unidad no encontrada");

  const fecha = input.fecha || getNowLocal().fecha;
  const kmHrs =
    input.kmHrs ??
    (unidad.odometroActual != null
      ? (unidad.odometroActual ?? 0) + (unidad.odometroOffset ?? 0)
      : null);

  const [orden] = await db
    .insert(ordenesTaller)
    .values({
      unidadId: input.unidadId,
      operadorId: input.operadorId ?? unidad.operadorDefaultId ?? null,
      fecha,
      kmHrs,
      motivo: input.motivo?.trim() || null,
      estado: "abierta",
      quienRecibio: input.quienRecibio?.trim() || null,
      comentarios: input.comentarios?.trim() || null,
      abiertoPorId: userId,
    })
    .returning();

  const checks = CHECKLIST_PUNTOS.map((p) => {
    const given = input.checklist?.find((c) => c.clave === p.clave);
    return {
      ordenId: orden.id,
      clave: p.clave,
      ok: given?.ok ?? null,
      nota: given?.nota ?? null,
    };
  });
  await db.insert(ordenChecklist).values(checks);

  revalidatePath("/taller");
  revalidatePath(`/catalogo/unidades/${input.unidadId}`);
  return { ok: true, id: orden.id };
}

export async function guardarOrdenTaller(id: number, input: {
  operadorId?: number | null;
  fecha?: string;
  kmHrs?: number | null;
  motivo?: string | null;
  quienRecibio?: string | null;
  quienAtendio?: string | null;
  comentarios?: string | null;
  proximoMto?: string | null;
  esPreventivo?: boolean;
  tipoControlPreventivo?: string | null;
  checklist?: ChecklistInput[];
  refacciones?: RefaccionInput[];
  estado?: "abierta" | "en_proceso";
}) {
  await requireActionPermission("taller");
  const orden = await db.query.ordenesTaller.findFirst({ where: eq(ordenesTaller.id, id) });
  if (!orden) throw new Error("Orden no encontrada");
  if (orden.estado === "cerrada" || orden.estado === "cancelada") {
    throw new Error("Esta orden ya está cerrada o cancelada");
  }

  await db
    .update(ordenesTaller)
    .set({
      operadorId: input.operadorId !== undefined ? input.operadorId : orden.operadorId,
      fecha: input.fecha ?? orden.fecha,
      kmHrs: input.kmHrs !== undefined ? input.kmHrs : orden.kmHrs,
      motivo: input.motivo !== undefined ? (input.motivo?.trim() || null) : orden.motivo,
      quienRecibio: input.quienRecibio !== undefined ? (input.quienRecibio?.trim() || null) : orden.quienRecibio,
      quienAtendio: input.quienAtendio !== undefined ? (input.quienAtendio?.trim() || null) : orden.quienAtendio,
      comentarios: input.comentarios !== undefined ? (input.comentarios?.trim() || null) : orden.comentarios,
      proximoMto: input.proximoMto !== undefined ? (input.proximoMto?.trim() || null) : orden.proximoMto,
      esPreventivo: input.esPreventivo ?? orden.esPreventivo,
      tipoControlPreventivo:
        input.tipoControlPreventivo !== undefined
          ? input.tipoControlPreventivo
          : orden.tipoControlPreventivo,
      estado: input.estado ?? orden.estado,
      updatedAt: new Date(),
    })
    .where(eq(ordenesTaller.id, id));

  if (input.checklist) {
    for (const c of input.checklist) {
      const row = await db.query.ordenChecklist.findFirst({
        where: and(eq(ordenChecklist.ordenId, id), eq(ordenChecklist.clave, c.clave)),
      });
      if (row) {
        await db
          .update(ordenChecklist)
          .set({ ok: c.ok, nota: c.nota ?? null })
          .where(eq(ordenChecklist.id, row.id));
      }
    }
  }

  if (input.refacciones) {
    await db.delete(ordenRefacciones).where(eq(ordenRefacciones.ordenId, id));
    const rows = input.refacciones
      .filter((r) => r.descripcion.trim())
      .map((r) => ({
        ordenId: id,
        descripcion: r.descripcion.trim(),
        cantidad: r.cantidad ?? 1,
        cajas: r.cajas ?? null,
        precio: r.precio ?? null,
        iva: r.iva ?? true,
        proveedor: r.proveedor?.trim() || null,
        folioFactura: r.folioFactura?.trim() || null,
      }));
    if (rows.length) await db.insert(ordenRefacciones).values(rows);
  }

  revalidatePath("/taller");
  revalidatePath(`/taller/${id}`);
  revalidatePath(`/catalogo/unidades/${orden.unidadId}`);
  return { ok: true };
}

export async function cerrarOrdenTaller(id: number, input?: {
  quienAtendio?: string | null;
  esPreventivo?: boolean;
  tipoControlPreventivo?: "km" | "hrs";
}) {
  const { userId } = await requireManageRole();
  const orden = await db.query.ordenesTaller.findFirst({
    where: eq(ordenesTaller.id, id),
  });
  if (!orden) throw new Error("Orden no encontrada");
  if (orden.estado === "cerrada") throw new Error("Ya está cerrada");
  if (orden.estado === "cancelada") throw new Error("Está cancelada");

  const esPreventivo = input?.esPreventivo ?? orden.esPreventivo;
  const tipoControl = input?.tipoControlPreventivo ?? (orden.tipoControlPreventivo as "km" | "hrs" | null) ?? "km";

  let eventoId = orden.eventoMantenimientoId;
  if (esPreventivo && orden.kmHrs != null && !eventoId) {
    const ev = await registrarMantenimientoUnidad({
      unidadId: orden.unidadId,
      tipoControl,
      fechaServicio: orden.fecha,
      lecturaServicio: orden.kmHrs,
      descripcion: orden.motivo ?? "Servicio de taller (preventivo)",
      notas: `Orden #${orden.id}`,
    });
    eventoId = ev.id;
  }

  await db
    .update(ordenesTaller)
    .set({
      estado: "cerrada",
      esPreventivo,
      tipoControlPreventivo: esPreventivo ? tipoControl : orden.tipoControlPreventivo,
      quienAtendio: input?.quienAtendio !== undefined ? input.quienAtendio : orden.quienAtendio,
      eventoMantenimientoId: eventoId,
      cerradoPorId: userId,
      cerradoAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(ordenesTaller.id, id));

  revalidatePath("/taller");
  revalidatePath(`/taller/${id}`);
  revalidatePath(`/catalogo/unidades/${orden.unidadId}`);
  revalidatePath("/overview");
  return { ok: true };
}

export async function cancelarOrdenTaller(id: number) {
  await requireManageRole();
  const orden = await db.query.ordenesTaller.findFirst({ where: eq(ordenesTaller.id, id) });
  if (!orden) throw new Error("Orden no encontrada");
  if (orden.estado === "cerrada") throw new Error("No se puede cancelar una orden cerrada");

  await db
    .update(ordenesTaller)
    .set({ estado: "cancelada", updatedAt: new Date() })
    .where(eq(ordenesTaller.id, id));

  revalidatePath("/taller");
  revalidatePath(`/taller/${id}`);
  revalidatePath(`/catalogo/unidades/${orden.unidadId}`);
  return { ok: true };
}

export async function getUnidadesYOperadoresTaller() {
  await requireActionPermission("taller");
  const [unis, ops] = await Promise.all([
    db.query.unidades.findMany({
      where: eq(unidades.activo, true),
      columns: { id: true, codigo: true, tipo: true, odometroActual: true, odometroOffset: true, operadorDefaultId: true },
      orderBy: (u, { asc }) => [asc(u.codigo)],
    }),
    db.query.operadores.findMany({
      where: eq(operadores.activo, true),
      columns: { id: true, nombre: true },
      orderBy: (o, { asc }) => [asc(o.nombre)],
    }),
  ]);
  return { unidades: unis, operadores: ops };
}
