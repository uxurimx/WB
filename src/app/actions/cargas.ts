"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cargas, tanques, unidades, fuentesDiesel, configuracion, transferenciasTanque, recargasTanque, periodos, auditLog, users, odometroResets } from "@/db/schema";
import { eq, max, desc, and, or, count, countDistinct, sum, gte, lte, like, ilike, inArray, sql } from "drizzle-orm";
import { obras, operadores } from "@/db/schema";

import { requireActionPermission, requireManageRole } from "@/lib/authz";
import {
  assertFolioPatioCompartidoDisponible,
  getSiguienteFolioPatioCompartido,
} from "@/lib/folios";
import { getOrCreatePeriodoActual } from "./periodos";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";
import { cargaPatioSchema, cargaCampoSchema, odometroResetSchema, assertKmCaptura, folioSchema, litrosSchema, fechaSchema, parseOrThrow } from "@/lib/validators";
import { insertCargaAtomic, deleteCargaAtomic, applyTankLitrosDelta, type TankAfterMutation } from "@/lib/stock";
import { calcSobrecarga, type SobrecargaTanque } from "@/lib/tanque-sobrecarga";
import { recalcularRendimientosForUnit } from "@/app/actions/rendimientos";

// ─── Helpers ─────────────────────────────────────────────────
async function getSiguienteFolio(): Promise<number> {
  return getSiguienteFolioPatioCompartido();
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
  folioManual?: number;   // Si se proporciona, se usa en lugar del auto-generado
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

async function getFolioRango(origen: "patio" | "campo") {
  const [minRow, maxRow] = await Promise.all([
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, `folio_min_${origen}`) }),
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, `folio_max_${origen}`) }),
  ]);
  return {
    min: minRow ? parseInt(minRow.valor, 10) : 0,
    max: maxRow ? parseInt(maxRow.valor, 10) : 0,
  };
}

function assertFolioEnRango(folio: number, rango: { min: number; max: number }, origen: string) {
  if (rango.min > 0 && folio < rango.min)
    throw new Error(`Folio ${folio} es menor al mínimo configurado para ${origen} (${rango.min})`);
  if (rango.max > 0 && folio > rango.max)
    throw new Error(`Folio ${folio} supera el máximo configurado para ${origen} (${rango.max})`);
}

export async function createCargaPatio(input: CargaPatioInput) {
  const { userId } = await requireActionPermission("cargas.nueva_patio");
  const parsed = parseOrThrow(cargaPatioSchema, input);

  const periodo = await getOrCreatePeriodoActual(parsed.fecha);
  const rango = await getFolioRango("patio");
  let folio = parsed.folioManual ?? await getSiguienteFolio();
  assertFolioEnRango(folio, rango, "patio");

  const tanqueTaller = await getTanquePorNombre("Taller");
  if (!tanqueTaller) throw new Error("Tanque Taller no encontrado");
  if (parsed.litros > (tanqueTaller.litrosActuales ?? 0)) {
    throw new Error(
      `Stock insuficiente. Taller tiene ${(tanqueTaller.litrosActuales ?? 0).toFixed(0)} L disponibles`
    );
  }
  const fuenteTaller = await getFuentePorTipo("taller");

  const ultimoKm = await getUltimoOdometro(parsed.unidadId);
  assertKmCaptura({
    kmNuevo: parsed.odometroHrs,
    ultimoKm,
    kmEstimado: parsed.kmEstimado,
  });

  folio = parsed.folioManual ?? await getSiguienteFolioPatioCompartido();
  assertFolioEnRango(folio, rango, "patio");
  await assertFolioPatioCompartidoDisponible(folio);

  const currentCuentalitros = tanqueTaller.cuentalitrosActual ?? 0;
  const nuevoCuentalitros =
    parsed.cuentaLtFin != null && parsed.cuentaLtFin > currentCuentalitros
      ? parsed.cuentaLtFin
      : currentCuentalitros;

  const inserted = await insertCargaAtomic({
    tanqueId: tanqueTaller.id,
    litros: parsed.litros,
    cuentalitrosActual: nuevoCuentalitros,
    fecha: parsed.fecha,
    hora: parsed.hora,
    folio,
    periodoId: periodo.id,
    unidadId: parsed.unidadId,
    operadorId: parsed.operadorId ?? null,
    obraId: null,
    fuenteId: fuenteTaller?.id ?? null,
    odometroHrs: parsed.odometroHrs ?? null,
    kmEstimado: parsed.kmEstimado ?? false,
    cuentaLtInicio: parsed.cuentaLtInicio ?? null,
    cuentaLtFin: parsed.cuentaLtFin ?? null,
    origen: "patio",
    tipoDiesel: parsed.tipoDiesel ?? "normal",
    quienSuministraId: null,
    quienRecibeId: null,
    notas: parsed.notas ?? null,
    registradoPorId: userId,
  });

  await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
    tanque: inserted.tank.nombre,
    litrosActuales: inserted.tank.litrosActuales,
    cuentalitros: inserted.tank.cuentalitrosActual,
    ajuste: inserted.tank.ajustePorcentaje ?? 2,
  }).catch(() => {});

  await pusherServer.trigger(CHANNELS.cargas, EVENTS.nuevaCarga, {
    cargaId: inserted.cargaId,
    folio: inserted.folio,
    unidadId: parsed.unidadId,
    litros: parsed.litros,
    origen: "patio",
  }).catch(() => {});

  revalidatePath("/cargas");
  revalidatePath("/overview");

  const nextFolio = await getSiguienteFolio();
  return { ok: true, folio: inserted.folio ?? folio, cargaId: inserted.cargaId, nextFolio };
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
  cuentaLtInicio?: number;   // Lectura física del cuentalitros NISSAN antes de cargar
  obraId?: number;
  operadorId?: number;
  quienSuministraId?: number; // A3: quién despacha desde la NISSAN
  quienRecibeId?: number;     // A3: quién recibe el diesel
  tipoDiesel?: string;        // normal | amigo | oxxogas
  notas?: string;
};

export async function createCargaCampo(input: CargaCampoInput) {
  const { userId } = await requireActionPermission("cargas.nueva_campo");
  const parsed = parseOrThrow(cargaCampoSchema, input);

  const periodo = await getOrCreatePeriodoActual(parsed.fecha);
  const rango = await getFolioRango("campo");
  assertFolioEnRango(parsed.folioNissan, rango, "campo");

  const existe = await db.select({ id: cargas.id }).from(cargas)
    .where(and(eq(cargas.folio, parsed.folioNissan), eq(cargas.origen, "campo"))).limit(1);
  if (existe.length > 0)
    throw new Error(`El folio ${parsed.folioNissan} ya existe en el sistema para cargas de campo`);

  const tanqueNissan = await getTanquePorNombre("NISSAN");
  if (!tanqueNissan) throw new Error("Tanque NISSAN no encontrado");
  if (parsed.litros > (tanqueNissan.litrosActuales ?? 0)) {
    throw new Error(
      `Stock insuficiente. NISSAN tiene ${(tanqueNissan.litrosActuales ?? 0).toFixed(0)} L disponibles`
    );
  }
  const fuenteNissan = await getFuentePorTipo("nissan");

  const ultimoKm = await getUltimoOdometro(parsed.unidadId);
  assertKmCaptura({
    kmNuevo: parsed.odometroHrs,
    ultimoKm,
    kmEstimado: parsed.kmEstimado,
  });

  const cuentaLtInicioCampo = parsed.cuentaLtInicio ?? (tanqueNissan.cuentalitrosActual ?? 0);
  const nuevoCuentalitrosNissan = cuentaLtInicioCampo + parsed.litros;

  const inserted = await insertCargaAtomic({
    tanqueId: tanqueNissan.id,
    litros: parsed.litros,
    cuentalitrosActual: nuevoCuentalitrosNissan,
    fecha: parsed.fecha,
    hora: parsed.hora,
    folio: parsed.folioNissan,
    periodoId: periodo.id,
    unidadId: parsed.unidadId,
    operadorId: parsed.operadorId ?? null,
    obraId: parsed.obraId ?? null,
    fuenteId: fuenteNissan?.id ?? null,
    odometroHrs: parsed.odometroHrs ?? null,
    kmEstimado: parsed.kmEstimado ?? false,
    cuentaLtInicio: cuentaLtInicioCampo,
    cuentaLtFin: nuevoCuentalitrosNissan,
    origen: "campo",
    tipoDiesel: parsed.tipoDiesel ?? "normal",
    quienSuministraId: parsed.quienSuministraId ?? null,
    quienRecibeId: parsed.quienRecibeId ?? null,
    notas: parsed.notas ?? null,
    registradoPorId: userId,
  });

  await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
    tanque: "NISSAN",
    litrosActuales: inserted.tank.litrosActuales,
    cuentalitros: inserted.tank.cuentalitrosActual,
  }).catch(() => {});

  await pusherServer.trigger(CHANNELS.cargas, EVENTS.nuevaCarga, {
    cargaId: inserted.cargaId,
    folio: parsed.folioNissan,
    unidadId: parsed.unidadId,
    litros: parsed.litros,
    origen: "campo",
  }).catch(() => {});

  revalidatePath("/cargas");
  revalidatePath("/overview");

  const nextFolio = await getSiguienteFolioCampo();
  return {
    ok: true,
    cargaId: inserted.cargaId,
    nuevoCuentalitrosNissan: inserted.tank.cuentalitrosActual ?? nuevoCuentalitrosNissan,
    nextFolio,
  };
}

// ─────────────────────────────────────────────────────────────
// OBTENER CARGAS (para historial)
// ─────────────────────────────────────────────────────────────
export async function getCargas(opts?: {
  periodoId?: number;
  unidadId?: number;
  origen?: "patio" | "campo";
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const conds = [];
  if (opts?.periodoId)  conds.push(eq(cargas.periodoId, opts.periodoId));
  if (opts?.unidadId)   conds.push(eq(cargas.unidadId, opts.unidadId));
  if (opts?.origen)     conds.push(eq(cargas.origen, opts.origen));
  if (opts?.fechaDesde) conds.push(gte(cargas.fecha, opts.fechaDesde));
  if (opts?.fechaHasta) conds.push(lte(cargas.fecha, opts.fechaHasta));
  const q = opts?.search?.trim();
  if (q) {
    const like = `%${q}%`;
    conds.push(
      or(
        sql`${cargas.folio}::text ilike ${like}`,
        inArray(cargas.unidadId, db.select({ id: unidades.id }).from(unidades).where(ilike(unidades.codigo, like))),
        inArray(cargas.operadorId, db.select({ id: operadores.id }).from(operadores).where(ilike(operadores.nombre, like))),
        inArray(cargas.obraId, db.select({ id: obras.id }).from(obras).where(ilike(obras.nombre, like))),
      )!,
    );
  }
  const whereCond = conds.length ? and(...conds) : undefined;

  const lim = opts?.limit ?? 50;
  const off = opts?.offset ?? 0;

  const [rows, aggRows] = await Promise.all([
    db.query.cargas.findMany({
      where: whereCond,
      with: { unidad: true, operador: true, obra: true, archivos: { columns: { url: true }, limit: 1 }, periodo: { columns: { cerrado: true } } },
      orderBy: (c, { desc: _desc }) => [_desc(c.fecha), _desc(c.createdAt)],
      limit: lim,
      offset: off,
    }),
    db.select({ total: count(), litros: sum(cargas.litros), unidades: countDistinct(cargas.unidadId) }).from(cargas).where(whereCond),
  ]);

  return {
    rows,
    total:    aggRows[0]?.total ?? 0,
    litros:   Number(aggRows[0]?.litros ?? 0),
    unidades: aggRows[0]?.unidades ?? 0,
  };
}

// Versión para el cliente: devuelve las cargas ya mapeadas al shape de la tabla + totales.
export async function getCargasPage(opts: {
  origen?: "patio" | "campo";
  unidadId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  search?: string;
  limit: number;
  offset: number;
}) {
  const { rows, total, litros, unidades } = await getCargas(opts);
  const items = rows.map((c) => ({
    _tipo: "carga" as const,
    id: c.id,
    fecha: c.fecha,
    hora: c.hora,
    folio: c.folio,
    litros: c.litros,
    origen: c.origen,
    tipoDiesel: c.tipoDiesel,
    notas: c.notas,
    operadorId: c.operadorId,
    obraId: c.obraId,
    odometroHrs: c.odometroHrs ?? null,
    cuentaLtInicio: c.cuentaLtInicio ?? null,
    cuentaLtFin: c.cuentaLtFin ?? null,
    kmEstimado: c.kmEstimado ?? false,
    periodoId: c.periodoId ?? null,
    periodoCerrado: c.periodo?.cerrado ?? false,
    createdAt: c.createdAt?.toISOString() ?? null,
    unidad: c.unidad ? { codigo: c.unidad.codigo } : null,
    operador: c.operador ? { nombre: c.operador.nombre } : null,
    obra: c.obra ? { nombre: c.obra.nombre } : null,
    fotoUrl: c.archivos?.[0]?.url ?? null,
  }));
  return { items, total, litros, unidades };
}

export async function getHistorialGlobalStats() {
  const [cRes, rRes, tRes] = await Promise.all([
    db.select({ total: count(), litros: sum(cargas.litros) }).from(cargas),
    db.select({ total: count(), litros: sum(recargasTanque.litros) }).from(recargasTanque),
    db.select({ total: count(), litros: sum(transferenciasTanque.litros) }).from(transferenciasTanque),
  ]);
  return {
    cargas:         { total: Number(cRes[0]?.total ?? 0), litros: Number(cRes[0]?.litros ?? 0) },
    recargas:       { total: Number(rRes[0]?.total ?? 0), litros: Number(rRes[0]?.litros ?? 0) },
    transferencias: { total: Number(tRes[0]?.total ?? 0), litros: Number(tRes[0]?.litros ?? 0) },
  };
}

export async function getSiguienteFolioPublic() {
  return getSiguienteFolio();
}

async function getSiguienteFolioPatio(): Promise<number> {
  return getSiguienteFolioPatioCompartido();
}

export async function getSiguienteFolioPatioPublic() {
  return getSiguienteFolioPatio();
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
      periodo:  { columns: { cerrado: true } },
    },
    columns: {
      id: true, fecha: true, hora: true, folio: true, litros: true, origen: true,
      odometroHrs: true, periodoId: true, operadorId: true, obraId: true,
      cuentaLtInicio: true, cuentaLtFin: true, tipoDiesel: true, notas: true, kmEstimado: true,
    },
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
      periodoCerrado: c.periodo?.cerrado ?? false,
      operadorId:     c.operadorId ?? null,
      obraId:         c.obraId ?? null,
      cuentaLtInicio: c.cuentaLtInicio ?? null,
      cuentaLtFin:    c.cuentaLtFin ?? null,
      unidadCodigo:   c.unidad?.codigo    ?? null,
      operadorNombre: c.operador?.nombre  ?? null,
      obraNombre:     c.obra?.nombre      ?? null,
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
// ÚLTIMA CARGA DE UNIDAD — para alertas anti-fraude en campo
// ─────────────────────────────────────────────────────────────
export async function getUltimaCargaUnidad(unidadId: number) {
  const ultima = await db.query.cargas.findFirst({
    where: (c, { eq }) => eq(c.unidadId, unidadId),
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    columns: {
      id: true, fecha: true, hora: true, litros: true,
      odometroHrs: true, folio: true, origen: true, notas: true,
      createdAt: true,
    },
    with: {
      obra:     { columns: { nombre: true } },
      operador: { columns: { nombre: true } },
    },
  });
  if (!ultima) return null;
  return {
    id:             ultima.id,
    fecha:          ultima.fecha,
    hora:           ultima.hora,
    litros:         ultima.litros,
    odometroHrs:    ultima.odometroHrs,
    folio:          ultima.folio,
    origen:         ultima.origen,
    notas:          ultima.notas,
    createdAt:      ultima.createdAt?.toISOString() ?? null,
    obraNombre:     ultima.obra?.nombre     ?? null,
    operadorNombre: ultima.operador?.nombre ?? null,
  };
}

// ─────────────────────────────────────────────────────────────
// ÚLTIMO ODÓMETRO — para validación kilométrica (A5)
// ─────────────────────────────────────────────────────────────
export async function getOdometroResetsUnidad(unidadId: number) {
  return db.query.odometroResets.findMany({
    where: eq(odometroResets.unidadId, unidadId),
    orderBy: (r, { desc: d }) => [d(r.fecha), d(r.createdAt)],
  });
}

export async function getUltimoOdometro(unidadId: number): Promise<number | null> {
  const [ultimaCarga, ultimoReset] = await Promise.all([
    db.query.cargas.findFirst({
      where: (c, { eq: _eq, and: _and, isNotNull }) =>
        _and(_eq(c.unidadId, unidadId), isNotNull(c.odometroHrs)),
      orderBy: (c, { desc: d }) => [d(c.createdAt)],
      columns: { odometroHrs: true, createdAt: true },
    }),
    db.query.odometroResets.findFirst({
      where: eq(odometroResets.unidadId, unidadId),
      orderBy: (r, { desc: d }) => [d(r.createdAt)],
    }),
  ]);

  const cargaTs = ultimaCarga?.createdAt?.getTime() ?? 0;
  const resetTs = ultimoReset?.createdAt?.getTime() ?? 0;
  if (ultimoReset && resetTs >= cargaTs) return ultimoReset.lecturaNueva;
  return ultimaCarga?.odometroHrs ?? null;
}

export async function registrarResetOdometro(input: {
  unidadId: number;
  fecha: string;
  lecturaAnterior: number;
  lecturaNueva: number;
  notas?: string;
}) {
  const { userId } = await requireManageRole();
  const parsed = parseOrThrow(odometroResetSchema, input);

  const unidad = await db.query.unidades.findFirst({ where: eq(unidades.id, parsed.unidadId) });
  if (!unidad) throw new Error("Unidad no encontrada");

  const delta = parsed.lecturaAnterior - parsed.lecturaNueva;
  const nuevoOffset = (unidad.odometroOffset ?? 0) + delta;

  await db.insert(odometroResets).values({
    unidadId: parsed.unidadId,
    fecha: parsed.fecha,
    lecturaAnterior: parsed.lecturaAnterior,
    lecturaNueva: parsed.lecturaNueva,
    notas: parsed.notas ?? null,
    registradoPorId: userId,
  });

  await db
    .update(unidades)
    .set({
      odometroActual: parsed.lecturaNueva,
      odometroOffset: nuevoOffset,
    })
    .where(eq(unidades.id, parsed.unidadId));

  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "reset_odometro",
    entidad: "unidades",
    entidadId: String(parsed.unidadId),
    datosJson: JSON.stringify({
      lecturaAnterior: parsed.lecturaAnterior,
      lecturaNueva: parsed.lecturaNueva,
      offset: nuevoOffset,
      fecha: parsed.fecha,
    }),
  });

  revalidatePath(`/catalogo/unidades/${parsed.unidadId}`);
  revalidatePath("/catalogo/unidades");
  revalidatePath("/overview");
  return { ok: true, offset: nuevoOffset };
}

async function logSobrecargaIfNeeded(
  userId: string,
  tank: TankAfterMutation,
  motivo: "delete_carga" | "update_carga",
  extra?: Record<string, unknown>,
): Promise<SobrecargaTanque | null> {
  const s = calcSobrecarga({
    tanqueId: tank.id,
    tanqueNombre: tank.nombre,
    litros: tank.litrosActuales,
    capacidadMax: tank.capacidadMax,
    motivo,
    detalle: motivo === "delete_carga"
      ? `Se devolvieron litros al borrar una carga y ${tank.nombre} ya estaba lleno. Capacidad ${tank.capacidadMax.toLocaleString("es-MX")} L · ahora ${tank.litrosActuales.toLocaleString("es-MX")} L.`
      : `Se devolvieron litros al corregir una carga y ${tank.nombre} ya estaba lleno. Capacidad ${tank.capacidadMax.toLocaleString("es-MX")} L · ahora ${tank.litrosActuales.toLocaleString("es-MX")} L.`,
  });
  if (!s) return null;
  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "sobrecarga_tanque",
    entidad: "tanques",
    entidadId: String(tank.id),
    datosJson: JSON.stringify({ ...s, ...extra }),
  });
  return s;
}

async function maybeRecalcPeriodo(periodoId: number | null, unidadId: number, userId: string, motivo: string, extra?: Record<string, unknown>) {
  if (!periodoId) return;
  const periodo = await db.query.periodos.findFirst({ where: eq(periodos.id, periodoId) });
  if (!periodo?.cerrado) return;
  await recalcularRendimientosForUnit(periodoId, unidadId);
  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "recalc_rendimiento",
    entidad: "rendimiento",
    entidadId: `${periodoId}:${unidadId}`,
    datosJson: JSON.stringify({ motivo, ...extra }),
  });
  revalidatePath("/periodos");
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
  const { userId } = await requireManageRole();

  const carga = await db.query.cargas.findFirst({ where: eq(cargas.id, id) });
  if (!carga) throw new Error("Carga no encontrada");

  if (data.fecha !== undefined) fechaSchema.parse(data.fecha);
  if (data.litros !== undefined) litrosSchema.parse(data.litros);

  if (data.folio !== undefined && data.folio !== carga.folio) {
    folioSchema.parse(data.folio);
    if (carga.origen === "patio") {
      await assertFolioPatioCompartidoDisponible(data.folio, db, { cargaId: id });
    } else {
      const dup = await db.select({ id: cargas.id }).from(cargas)
        .where(and(eq(cargas.folio, data.folio), eq(cargas.origen, carga.origen), sql`${cargas.id} <> ${id}`))
        .limit(1);
      if (dup.length > 0)
        throw new Error(`El folio ${data.folio} ya existe en cargas de ${carga.origen}`);
    }
  }

  if (data.odometroHrs != null && data.odometroHrs !== carga.odometroHrs) {
    const ultimoKm = await getUltimoOdometro(carga.unidadId);
    const comparar = ultimoKm === carga.odometroHrs ? null : ultimoKm;
    assertKmCaptura({ kmNuevo: data.odometroHrs, ultimoKm: comparar });
  }

  let tankAfter: TankAfterMutation | null = null;
  let sobrecarga: SobrecargaTanque | null = null;
  if (data.litros !== undefined && data.litros !== carga.litros && carga.tanqueId) {
    const diff = data.litros - carga.litros;
    const tank = await applyTankLitrosDelta({ tanqueId: carga.tanqueId, delta: diff });
    tankAfter = tank;
    if (diff < 0) {
      sobrecarga = await logSobrecargaIfNeeded(userId, tank, "update_carga", { cargaId: id, litrosDevueltos: -diff });
    }
    await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: tank.nombre,
      litrosActuales: tank.litrosActuales,
      cuentalitros: tank.cuentalitrosActual,
    }).catch(() => {});
  }

  let nuevoPeriodoId = carga.periodoId;
  if (data.fecha && data.fecha !== carga.fecha) {
    const periodo = await getOrCreatePeriodoActual(data.fecha);
    nuevoPeriodoId = periodo.id;
  }

  const [updated] = await db.update(cargas).set({
    ...data,
    periodoId: nuevoPeriodoId,
  }).where(eq(cargas.id, id)).returning();

  const periodoCambio = nuevoPeriodoId !== carga.periodoId;
  const afectaRendimiento = data.litros !== undefined || data.odometroHrs !== undefined || periodoCambio;

  if (afectaRendimiento) {
    if (periodoCambio && carga.periodoId) {
      await maybeRecalcPeriodo(carga.periodoId, carga.unidadId, userId, "update_carga_periodo_origen", { cargaId: id, cambios: data });
    }
    await maybeRecalcPeriodo(nuevoPeriodoId, carga.unidadId, userId, "update_carga", { cargaId: id, cambios: data });
  }

  if (data.odometroHrs != null) {
    await db.update(unidades).set({ odometroActual: data.odometroHrs }).where(eq(unidades.id, carga.unidadId));
  }

  revalidatePath("/cargas");
  revalidatePath("/overview");
  revalidatePath(`/catalogo/unidades/${carga.unidadId}`);
  return { ...updated, tankAfter, sobrecarga };
}

// ─────────────────────────────────────────────────────────────
// ELIMINAR CARGA (revierte stock del tanque)
// ─────────────────────────────────────────────────────────────
export async function deleteCarga(id: number, notaModificacion?: string) {
  const { userId } = await requireManageRole();

  const carga = await db.query.cargas.findFirst({ where: eq(cargas.id, id) });
  if (!carga) throw new Error("Carga no encontrada");

  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "delete",
    entidad: "carga",
    entidadId: String(id),
    datosJson: JSON.stringify({ ...carga, nota: notaModificacion ?? null }),
  });

  const { carga: deleted, tank } = await deleteCargaAtomic(id);
  const periodoId = (deleted.periodo_id as number | null) ?? carga.periodoId;
  const unidadId = (deleted.unidad_id as number | null) ?? carga.unidadId;

  let sobrecarga: SobrecargaTanque | null = null;
  if (tank) {
    sobrecarga = await logSobrecargaIfNeeded(userId, tank, "delete_carga", {
      cargaId: id,
      folio: carga.folio,
      litrosDevueltos: carga.litros,
    });
    await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: tank.nombre,
      litrosActuales: tank.litrosActuales,
      cuentalitros: tank.cuentalitrosActual,
    }).catch(() => {});
  }

  await maybeRecalcPeriodo(periodoId, unidadId, userId, "delete_carga", {
    cargaId: id,
    periodoId,
    unidadId,
    nota: notaModificacion ?? null,
  });

  revalidatePath("/cargas");
  revalidatePath("/overview");
  revalidatePath("/tanques");
  revalidatePath(`/catalogo/unidades/${unidadId}`);
  return { ok: true, sobrecarga };
}

// ─────────────────────────────────────────────────────────────
// CREAR CARGA EXTERNA (gasolinera / socio / amigo)
// ─────────────────────────────────────────────────────────────
export type CargaExternaInput = {
  fecha: string;
  unidadId: number;
  litros: number;
  odometroHrs?: number;
  fuente?: string;      // texto libre: "Gasolinera", "Amigo Juan", etc.
  obraId?: number;
  notas?: string;
};

export async function createCargaExterna(input: CargaExternaInput) {
  const { userId } = await requireManageRole();
  litrosSchema.parse(input.litros);
  fechaSchema.parse(input.fecha);

  const periodo = await getOrCreatePeriodoActual(input.fecha);

  const fuenteExterno = await db.query.fuentesDiesel.findFirst({
    where: eq(fuentesDiesel.tipo, "externo"),
  });

  const notaFinal = [
    input.fuente ? `[${input.fuente}]` : "[Externo]",
    input.notas?.trim() ?? "",
  ].filter(Boolean).join(" ") || null;

  const [nueva] = await db
    .insert(cargas)
    .values({
      fecha:           input.fecha,
      periodoId:       periodo.id,
      unidadId:        input.unidadId,
      obraId:          input.obraId ?? null,
      fuenteId:        fuenteExterno?.id ?? null,
      litros:          input.litros,
      odometroHrs:     input.odometroHrs ?? null,
      origen:          "externo",
      notas:           notaFinal,
      registradoPorId: userId,
    })
    .returning();

  if (input.odometroHrs) {
    await db.update(unidades)
      .set({ odometroActual: input.odometroHrs })
      .where(eq(unidades.id, input.unidadId));
  }

  revalidatePath("/cargas");
  revalidatePath(`/catalogo/unidades/${input.unidadId}`);
  return { ok: true, cargaId: nueva.id };
}

// ─────────────────────────────────────────────────────────────
// HISTORIAL DE CAMBIOS EN RENDIMIENTOS (para auditoría)
// ─────────────────────────────────────────────────────────────
export async function getAuditLogCargasUnidad(unidadId: number) {
  // entidadId format: "periodoId:unidadId"
  const rows = await db
    .select({
      id:             auditLog.id,
      accion:         auditLog.accion,
      entidadId:      auditLog.entidadId,
      datosJson:      auditLog.datosJson,
      createdAt:      auditLog.createdAt,
      usuarioNombre:  users.name,
    })
    .from(auditLog)
    .leftJoin(users, eq(auditLog.usuarioId, users.id))
    .where(and(
      eq(auditLog.entidad, "rendimiento"),
      like(auditLog.entidadId, `%:${unidadId}`),
    ))
    .orderBy(desc(auditLog.createdAt))
    .limit(100);

  return rows.map((r) => {
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(r.datosJson ?? "{}"); } catch {}
    const periodoIdStr = (r.entidadId ?? "").split(":")[0];
    return {
      id:             r.id,
      createdAt:      r.createdAt,
      usuarioNombre:  r.usuarioNombre ?? "Sistema",
      periodoId:      periodoIdStr ? parseInt(periodoIdStr, 10) : null,
      motivo:         (parsed.motivo as string) ?? null,
      nota:           (parsed.nota as string) ?? null,
      cargaId:        (parsed.cargaId as number) ?? null,
      folioCarga:     (parsed.folioCarga as number) ?? null,
    };
  });
}
