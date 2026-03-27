"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cargas, tanques, unidades, fuentesDiesel, configuracion } from "@/db/schema";
import { eq, max, desc } from "drizzle-orm";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

async function requireManageRole() {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  if (!MANAGE_ROLES.includes(role)) throw new Error("Sin permisos para realizar esta acción");
}
import { getOrCreatePeriodoActual } from "./periodos";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";

// ─── Helpers ─────────────────────────────────────────────────
async function getSiguienteFolio(): Promise<number> {
  const [maxResult, baseRow] = await Promise.all([
    db.select({ maxFolio: max(cargas.folio) }).from(cargas).where(eq(cargas.origen, "patio")),
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, "folio_base") }),
  ]);
  const base = baseRow ? parseInt(baseRow.valor, 10) : 1;
  const maxFolio = maxResult[0]?.maxFolio ?? null;
  // Si hay cargas, continúa desde el máximo. Si no, usa el folio_base configurado.
  return maxFolio !== null ? maxFolio + 1 : base;
}

async function getTanquePorNombre(nombre: string) {
  return db.query.tanques.findFirst({ where: eq(tanques.nombre, nombre) });
}

async function getFuentePorTipo(tipo: string) {
  return db.query.fuentesDiesel.findFirst({
    where: eq(fuentesDiesel.tipo, tipo),
  });
}

// ─────────────────────────────────────────────────────────────
// CREAR CARGA PATIO
// ─────────────────────────────────────────────────────────────
export type CargaPatioInput = {
  fecha: string;          // "YYYY-MM-DD"
  hora: string;           // "HH:MM"
  unidadId: number;
  litros: number;
  odometroHrs?: number;
  cuentaLtInicio?: number;
  cuentaLtFin?: number;
  operadorId?: number;
  tipoDiesel?: string;    // normal | amigo | oxxogas
  notas?: string;
};

export async function createCargaPatio(input: CargaPatioInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const periodo = await getOrCreatePeriodoActual(new Date(input.fecha));
  const folio = await getSiguienteFolio();
  const tanqueTaller = await getTanquePorNombre("Taller");
  const fuenteTaller = await getFuentePorTipo("taller");

  const [nueva] = await db
    .insert(cargas)
    .values({
      fecha: input.fecha,
      hora: input.hora,
      folio,
      periodoId: periodo.id,
      unidadId: input.unidadId,
      operadorId: input.operadorId ?? null,
      fuenteId: fuenteTaller?.id ?? null,
      tanqueId: tanqueTaller?.id ?? null,
      litros: input.litros,
      odometroHrs: input.odometroHrs ?? null,
      cuentaLtInicio: input.cuentaLtInicio ?? null,
      cuentaLtFin: input.cuentaLtFin ?? null,
      origen: "patio",
      tipoDiesel: input.tipoDiesel ?? "normal",
      notas: input.notas ?? null,
      registradoPorId: userId,
    })
    .returning();

  // Actualizar stock del tanque taller
  if (tanqueTaller) {
    const nuevosLitros = Math.max(0, (tanqueTaller.litrosActuales ?? 0) - input.litros);
    const ajuste = tanqueTaller.ajustePorcentaje ?? 2;
    await db
      .update(tanques)
      .set({
        litrosActuales: nuevosLitros,
        cuentalitrosActual: input.cuentaLtFin ?? tanqueTaller.cuentalitrosActual,
        ultimaActualizacion: new Date(),
      })
      .where(eq(tanques.id, tanqueTaller.id));

    // Emitir evento real-time
    await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: "Taller",
      litrosActuales: nuevosLitros,
      ajuste,
    }).catch(() => {}); // No bloquear si Pusher falla
  }

  // Actualizar odómetro de la unidad
  if (input.odometroHrs) {
    await db
      .update(unidades)
      .set({ odometroActual: input.odometroHrs })
      .where(eq(unidades.id, input.unidadId));
  }

  // Emitir evento nueva carga
  await pusherServer.trigger(CHANNELS.cargas, EVENTS.nuevaCarga, {
    cargaId: nueva.id,
    folio,
    unidadId: input.unidadId,
    litros: input.litros,
    origen: "patio",
  }).catch(() => {});

  revalidatePath("/cargas");
  revalidatePath("/overview");

  return { ok: true, folio, cargaId: nueva.id };
}

// ─────────────────────────────────────────────────────────────
// CREAR CARGA CAMPO (NISSAN)
// ─────────────────────────────────────────────────────────────
export type CargaCampoInput = {
  fecha: string;
  hora: string;
  folioNissan: number;
  unidadId: number;
  litros: number;
  odometroHrs?: number;
  obraId?: number;
  operadorId?: number;
  tipoDiesel?: string;  // normal | amigo | oxxogas
  notas?: string;
};

export async function createCargaCampo(input: CargaCampoInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const periodo = await getOrCreatePeriodoActual(new Date(input.fecha));
  const tanqueNissan = await getTanquePorNombre("NISSAN");
  const fuenteNissan = await getFuentePorTipo("nissan");

  const [nueva] = await db
    .insert(cargas)
    .values({
      fecha: input.fecha,
      hora: input.hora,
      folio: input.folioNissan,
      periodoId: periodo.id,
      unidadId: input.unidadId,
      operadorId: input.operadorId ?? null,
      obraId: input.obraId ?? null,
      fuenteId: fuenteNissan?.id ?? null,
      tanqueId: tanqueNissan?.id ?? null,
      litros: input.litros,
      odometroHrs: input.odometroHrs ?? null,
      origen: "campo",
      tipoDiesel: input.tipoDiesel ?? "normal",
      notas: input.notas ?? null,
      registradoPorId: userId,
    })
    .returning();

  // Descontar del saldo de la NISSAN
  if (tanqueNissan) {
    const nuevosLitros = Math.max(0, (tanqueNissan.litrosActuales ?? 0) - input.litros);
    await db
      .update(tanques)
      .set({ litrosActuales: nuevosLitros, ultimaActualizacion: new Date() })
      .where(eq(tanques.id, tanqueNissan.id));

    await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: "NISSAN",
      litrosActuales: nuevosLitros,
    }).catch(() => {});
  }

  // Actualizar odómetro/hrs de la unidad
  if (input.odometroHrs) {
    await db
      .update(unidades)
      .set({ odometroActual: input.odometroHrs })
      .where(eq(unidades.id, input.unidadId));
  }

  await pusherServer.trigger(CHANNELS.cargas, EVENTS.nuevaCarga, {
    cargaId: nueva.id,
    folio: input.folioNissan,
    unidadId: input.unidadId,
    litros: input.litros,
    origen: "campo",
  }).catch(() => {});

  revalidatePath("/cargas");
  revalidatePath("/overview");

  return { ok: true, cargaId: nueva.id };
}

// ─────────────────────────────────────────────────────────────
// OBTENER CARGAS (para historial)
// ─────────────────────────────────────────────────────────────
export async function getCargas(opts?: {
  periodoId?: number;
  unidadId?: number;
  origen?: "patio" | "campo";
  limit?: number;
}) {
  return db.query.cargas.findMany({
    where: (c, { eq, and }) => {
      const conditions = [];
      if (opts?.periodoId) conditions.push(eq(c.periodoId, opts.periodoId));
      if (opts?.unidadId)  conditions.push(eq(c.unidadId, opts.unidadId));
      if (opts?.origen)    conditions.push(eq(c.origen, opts.origen));
      return conditions.length ? and(...conditions) : undefined;
    },
    with: {
      unidad: true,
      operador: true,
      obra: true,
    },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    limit: opts?.limit ?? 100,
  });
}

export async function getSiguienteFolioPublic() {
  return getSiguienteFolio();
}

async function getSiguienteFolioCampo(): Promise<number> {
  const [maxResult, baseRow] = await Promise.all([
    db.select({ maxFolio: max(cargas.folio) }).from(cargas).where(eq(cargas.origen, "campo")),
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, "folio_base_campo") }),
  ]);
  const base = baseRow ? parseInt(baseRow.valor, 10) : 1;
  const maxFolio = maxResult[0]?.maxFolio ?? null;
  return maxFolio !== null ? maxFolio + 1 : base;
}

export async function getSiguienteFolioCampoPublic() {
  return getSiguienteFolioCampo();
}

// ─────────────────────────────────────────────────────────────
// EDITAR CARGA
// ─────────────────────────────────────────────────────────────
export type UpdateCargaInput = {
  fecha?: string;
  hora?: string;
  folio?: number;
  litros?: number;
  odometroHrs?: number | null;
  operadorId?: number | null;
  obraId?: number | null;
  tipoDiesel?: string;
  notas?: string | null;
};

export async function updateCarga(id: number, data: UpdateCargaInput) {
  await requireManageRole();

  // Si cambia litros, ajustar stock del tanque
  if (data.litros !== undefined) {
    const carga = await db.query.cargas.findFirst({ where: eq(cargas.id, id) });
    if (carga?.tanqueId) {
      const tanque = await db.query.tanques.findFirst({ where: eq(tanques.id, carga.tanqueId) });
      if (tanque) {
        const diff = data.litros - carga.litros; // positivo = más consumo
        const nuevosLitros = Math.max(0, (tanque.litrosActuales ?? 0) - diff);
        await db.update(tanques)
          .set({ litrosActuales: nuevosLitros, ultimaActualizacion: new Date() })
          .where(eq(tanques.id, tanque.id));
      }
    }
  }

  const [updated] = await db.update(cargas).set(data).where(eq(cargas.id, id)).returning();
  revalidatePath("/cargas");
  revalidatePath("/overview");
  return updated;
}

// ─────────────────────────────────────────────────────────────
// ELIMINAR CARGA (revierte stock del tanque)
// ─────────────────────────────────────────────────────────────
export async function deleteCarga(id: number) {
  await requireManageRole();

  const carga = await db.query.cargas.findFirst({ where: eq(cargas.id, id) });
  if (!carga) throw new Error("Carga no encontrada");

  // Revertir stock del tanque
  if (carga.tanqueId) {
    const tanque = await db.query.tanques.findFirst({ where: eq(tanques.id, carga.tanqueId) });
    if (tanque) {
      const restoredLitros = (tanque.litrosActuales ?? 0) + carga.litros;
      await db.update(tanques)
        .set({ litrosActuales: restoredLitros, ultimaActualizacion: new Date() })
        .where(eq(tanques.id, tanque.id));
    }
  }

  await db.delete(cargas).where(eq(cargas.id, id));
  revalidatePath("/cargas");
  revalidatePath("/overview");
}
