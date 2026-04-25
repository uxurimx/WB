"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cargas, tanques, unidades, fuentesDiesel, configuracion, transferenciasTanque } from "@/db/schema";
import { eq, max, desc, and, count } from "drizzle-orm";

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
  // El folio es compartido entre cargas patio y transferencias de tanque
  const [maxCargaResult, maxTransfResult, baseRow] = await Promise.all([
    db.select({ maxFolio: max(cargas.folio) }).from(cargas).where(eq(cargas.origen, "patio")),
    db.select({ maxFolio: max(transferenciasTanque.folio) }).from(transferenciasTanque),
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, "folio_base") }),
  ]);
  const base = baseRow ? parseInt(baseRow.valor, 10) : 1;
  const maxCarga = maxCargaResult[0]?.maxFolio ?? null;
  const maxTransf = maxTransfResult[0]?.maxFolio ?? null;
  const maxGlobal =
    maxCarga !== null && maxTransf !== null ? Math.max(maxCarga, maxTransf)
    : maxCarga ?? maxTransf;
  return maxGlobal !== null ? maxGlobal + 1 : base;
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
  kmEstimado?: boolean;   // A5: true si se usó el último km conocido
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
  if (!tanqueTaller) throw new Error("Tanque Taller no encontrado");
  if (input.litros > (tanqueTaller.litrosActuales ?? 0)) {
    throw new Error(
      `Stock insuficiente. Taller tiene ${(tanqueTaller.litrosActuales ?? 0).toFixed(0)} L disponibles`
    );
  }
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
      kmEstimado: input.kmEstimado ?? false,
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
  kmEstimado?: boolean;       // A5: true si se usó el último km conocido
  obraId?: number;
  operadorId?: number;
  quienSuministraId?: number; // A3: quién despacha desde la NISSAN
  quienRecibeId?: number;     // A3: quién recibe el diesel
  tipoDiesel?: string;        // normal | amigo | oxxogas
  notas?: string;
};

export async function createCargaCampo(input: CargaCampoInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const periodo = await getOrCreatePeriodoActual(new Date(input.fecha));
  const tanqueNissan = await getTanquePorNombre("NISSAN");
  if (!tanqueNissan) throw new Error("Tanque NISSAN no encontrado");
  if (input.litros > (tanqueNissan.litrosActuales ?? 0)) {
    throw new Error(
      `Stock insuficiente. NISSAN tiene ${(tanqueNissan.litrosActuales ?? 0).toFixed(0)} L disponibles`
    );
  }
  const fuenteNissan = await getFuentePorTipo("nissan");

  // Cuentalitros antes de la carga (para registrarlo en el historial)
  const cuentaLtInicioCampo = tanqueNissan.cuentalitrosActual ?? 0;
  const nuevosLitrosNissan = Math.max(0, (tanqueNissan.litrosActuales ?? 0) - input.litros);
  const nuevoCuentalitrosNissan = cuentaLtInicioCampo + input.litros;

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
      kmEstimado: input.kmEstimado ?? false,
      cuentaLtInicio: cuentaLtInicioCampo,
      cuentaLtFin: nuevoCuentalitrosNissan,
      quienSuministraId: input.quienSuministraId ?? null,
      quienRecibeId: input.quienRecibeId ?? null,
      origen: "campo",
      tipoDiesel: input.tipoDiesel ?? "normal",
      notas: input.notas ?? null,
      registradoPorId: userId,
    })
    .returning();
  await db
    .update(tanques)
    .set({ litrosActuales: nuevosLitrosNissan, cuentalitrosActual: nuevoCuentalitrosNissan, ultimaActualizacion: new Date() })
    .where(eq(tanques.id, tanqueNissan.id));

  await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
    tanque: "NISSAN",
    litrosActuales: nuevosLitrosNissan,
    cuentalitros: nuevoCuentalitrosNissan,
  }).catch(() => {});

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

  return { ok: true, cargaId: nueva.id, nuevoCuentalitrosNissan };
}

// ─────────────────────────────────────────────────────────────
// OBTENER CARGAS (para historial)
// ─────────────────────────────────────────────────────────────
export async function getCargas(opts?: {
  periodoId?: number;
  unidadId?: number;
  origen?: "patio" | "campo";
  limit?: number;
  offset?: number;
}) {
  const buildWhere = () => {
    const conds = [];
    if (opts?.periodoId) conds.push(eq(cargas.periodoId, opts.periodoId));
    if (opts?.unidadId)  conds.push(eq(cargas.unidadId, opts.unidadId));
    if (opts?.origen)    conds.push(eq(cargas.origen, opts.origen));
    return conds.length ? and(...conds) : undefined;
  };

  const lim = opts?.limit ?? 50;
  const off = opts?.offset ?? 0;

  const [rows, countRows] = await Promise.all([
    db.query.cargas.findMany({
      where: (c, { eq: _eq, and: _and }) => {
        const conds = [];
        if (opts?.periodoId) conds.push(_eq(c.periodoId, opts.periodoId!));
        if (opts?.unidadId)  conds.push(_eq(c.unidadId, opts.unidadId!));
        if (opts?.origen)    conds.push(_eq(c.origen, opts.origen!));
        return conds.length ? _and(...conds) : undefined;
      },
      with: { unidad: true, operador: true, obra: true },
      orderBy: (c, { desc: _desc }) => [_desc(c.fecha), _desc(c.createdAt)],
      limit: lim,
      offset: off,
    }),
    db.select({ total: count() }).from(cargas).where(buildWhere()),
  ]);

  return { rows, total: countRows[0]?.total ?? 0 };
}

export async function getSiguienteFolioPublic() {
  return getSiguienteFolio();
}

// ─────────────────────────────────────────────────────────────
// RESUMEN DE CATÁLOGO — historial y totales por unidad/operador/obra
// ─────────────────────────────────────────────────────────────
export async function getCatalogoResumen(
  tipo: "unidad" | "operador" | "obra",
  id: number
) {
  const where =
    tipo === "unidad"   ? eq(cargas.unidadId, id)
    : tipo === "operador" ? eq(cargas.operadorId, id)
    : eq(cargas.obraId, id);

  const rows = await db.query.cargas.findMany({
    where,
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    limit: 20,
    with: {
      unidad:   { columns: { codigo: true } },
      operador: { columns: { nombre: true } },
      obra:     { columns: { nombre: true } },
    },
    columns: { id: true, fecha: true, folio: true, litros: true, origen: true, odometroHrs: true },
  });

  const totalLitros  = rows.reduce((s, c) => s + c.litros, 0);
  const cargasPatio  = rows.filter((c) => c.origen === "patio").length;
  const cargasCampo  = rows.filter((c) => c.origen === "campo").length;

  return {
    totalCargas: rows.length,
    totalLitros,
    cargasPatio,
    cargasCampo,
    ultimaFecha: rows[0]?.fecha ?? null,
    recientes: rows.map((c) => ({
      id: c.id,
      fecha: c.fecha,
      folio: c.folio,
      litros: c.litros,
      origen: c.origen,
      odometroHrs: c.odometroHrs ?? null,
      unidadCodigo:    c.unidad?.codigo    ?? null,
      operadorNombre:  c.operador?.nombre  ?? null,
      obraNombre:      c.obra?.nombre      ?? null,
    })),
  };
}

export async function getUltimaCuentaLtPatio(): Promise<number | null> {
  // Fuente de verdad: cuentalitrosActual del tanque Taller (se actualiza en cargas y transferencias)
  const tanque = await db.query.tanques.findFirst({
    where: eq(tanques.nombre, "Taller"),
    columns: { cuentalitrosActual: true },
  });
  return tanque?.cuentalitrosActual ?? null;
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
// ÚLTIMO ODÓMETRO — para validación kilométrica (A5)
// ─────────────────────────────────────────────────────────────
export async function getUltimoOdometro(unidadId: number): Promise<number | null> {
  const ultima = await db.query.cargas.findFirst({
    where: (c, { eq, and, isNotNull }) =>
      and(eq(c.unidadId, unidadId), isNotNull(c.odometroHrs)),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    columns: { odometroHrs: true },
  });
  return ultima?.odometroHrs ?? null;
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
  cuentaLtInicio?: number | null;
  cuentaLtFin?: number | null;
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
