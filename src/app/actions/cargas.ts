"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { cargas, tanques, unidades, fuentesDiesel, configuracion, transferenciasTanque, recargasTanque, rendimientos, periodos, auditLog, users } from "@/db/schema";
import { eq, max, desc, and, count, sum, gte, lte, like } from "drizzle-orm";
import { getTolerancia } from "@/app/actions/setup";

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

export async function createCargaPatio(input: CargaPatioInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const periodo = await getOrCreatePeriodoActual(new Date(input.fecha));
  const folio = input.folioManual ?? await getSiguienteFolio();

  // Validar rango configurable de folio patio
  const [minRow, maxRow] = await Promise.all([
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, "folio_min_patio") }),
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, "folio_max_patio") }),
  ]);
  const folioMin = minRow ? parseInt(minRow.valor, 10) : 0;
  const folioMax = maxRow ? parseInt(maxRow.valor, 10) : 0;
  if (folioMin > 0 && folio < folioMin)
    throw new Error(`Folio ${folio} es menor al mínimo configurado para patio (${folioMin})`);
  if (folioMax > 0 && folio > folioMax)
    throw new Error(`Folio ${folio} supera el máximo configurado para patio (${folioMax})`);

  // Evitar folio duplicado — la constraint de DB también lo captura, pero aquí damos mensaje claro
  const existe = await db.select({ id: cargas.id }).from(cargas)
    .where(and(eq(cargas.folio, folio), eq(cargas.origen, "patio"))).limit(1);
  if (existe.length > 0)
    throw new Error(`El folio ${folio} ya existe en el sistema para cargas de patio`);

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
  const nuevosLitros = Math.max(0, (tanqueTaller.litrosActuales ?? 0) - input.litros);
  const ajuste = tanqueTaller.ajustePorcentaje ?? 2;
  // Solo actualizar cuentalitros si el nuevo valor es mayor al actual.
  // Esto evita que una carga ingresada de forma retroactiva sobreescriba
  // la lectura más reciente (ej. de una transferencia registrada antes).
  const currentCuentalitros = tanqueTaller.cuentalitrosActual ?? 0;
  const nuevoCuentalitros =
    input.cuentaLtFin != null && input.cuentaLtFin > currentCuentalitros
      ? input.cuentaLtFin
      : currentCuentalitros;

  await db
    .update(tanques)
    .set({
      litrosActuales: nuevosLitros,
      cuentalitrosActual: nuevoCuentalitros,
      ultimaActualizacion: new Date(),
    })
    .where(eq(tanques.id, tanqueTaller.id));

  await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
    tanque: "Taller",
    litrosActuales: nuevosLitros,
    cuentalitros: nuevoCuentalitros,
    ajuste,
  }).catch(() => {});

  if (input.odometroHrs) {
    await db
      .update(unidades)
      .set({ odometroActual: input.odometroHrs })
      .where(eq(unidades.id, input.unidadId));
  }

  await pusherServer.trigger(CHANNELS.cargas, EVENTS.nuevaCarga, {
    cargaId: nueva.id,
    folio,
    unidadId: input.unidadId,
    litros: input.litros,
    origen: "patio",
  }).catch(() => {});

  revalidatePath("/cargas");
  revalidatePath("/overview");

  const nextFolio = await getSiguienteFolio();
  return { ok: true, folio, cargaId: nueva.id, nextFolio };
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
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const periodo = await getOrCreatePeriodoActual(new Date(input.fecha));

  // Validar rango configurable de folio campo
  const [minRow, maxRow] = await Promise.all([
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, "folio_min_campo") }),
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, "folio_max_campo") }),
  ]);
  const folioMin = minRow ? parseInt(minRow.valor, 10) : 0;
  const folioMax = maxRow ? parseInt(maxRow.valor, 10) : 0;
  if (folioMin > 0 && input.folioNissan < folioMin)
    throw new Error(`Folio ${input.folioNissan} es menor al mínimo configurado para campo (${folioMin})`);
  if (folioMax > 0 && input.folioNissan > folioMax)
    throw new Error(`Folio ${input.folioNissan} supera el máximo configurado para campo (${folioMax})`);

  // Evitar folio duplicado
  const existe = await db.select({ id: cargas.id }).from(cargas)
    .where(and(eq(cargas.folio, input.folioNissan), eq(cargas.origen, "campo"))).limit(1);
  if (existe.length > 0)
    throw new Error(`El folio ${input.folioNissan} ya existe en el sistema para cargas de campo`);

  const tanqueNissan = await getTanquePorNombre("NISSAN");
  if (!tanqueNissan) throw new Error("Tanque NISSAN no encontrado");
  if (input.litros > (tanqueNissan.litrosActuales ?? 0)) {
    throw new Error(
      `Stock insuficiente. NISSAN tiene ${(tanqueNissan.litrosActuales ?? 0).toFixed(0)} L disponibles`
    );
  }
  const fuenteNissan = await getFuentePorTipo("nissan");

  // Usa el valor físico ingresado por el despachador; si no viene, cae al valor del tanque en DB
  const cuentaLtInicioCampo = input.cuentaLtInicio ?? (tanqueNissan.cuentalitrosActual ?? 0);
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

  const nextFolio = await getSiguienteFolioCampo();
  return { ok: true, cargaId: nueva.id, nuevoCuentalitrosNissan, nextFolio };
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
  limit?: number;
  offset?: number;
}) {
  const buildWhere = () => {
    const conds = [];
    if (opts?.periodoId)  conds.push(eq(cargas.periodoId, opts.periodoId));
    if (opts?.unidadId)   conds.push(eq(cargas.unidadId, opts.unidadId));
    if (opts?.origen)     conds.push(eq(cargas.origen, opts.origen));
    if (opts?.fechaDesde) conds.push(gte(cargas.fecha, opts.fechaDesde));
    if (opts?.fechaHasta) conds.push(lte(cargas.fecha, opts.fechaHasta));
    return conds.length ? and(...conds) : undefined;
  };

  const lim = opts?.limit ?? 50;
  const off = opts?.offset ?? 0;

  const [rows, countRows] = await Promise.all([
    db.query.cargas.findMany({
      where: (c, { eq: _eq, and: _and, gte: _gte, lte: _lte }) => {
        const conds = [];
        if (opts?.periodoId)  conds.push(_eq(c.periodoId, opts.periodoId!));
        if (opts?.unidadId)   conds.push(_eq(c.unidadId, opts.unidadId!));
        if (opts?.origen)     conds.push(_eq(c.origen, opts.origen!));
        if (opts?.fechaDesde) conds.push(_gte(c.fecha, opts.fechaDesde!));
        if (opts?.fechaHasta) conds.push(_lte(c.fecha, opts.fechaHasta!));
        return conds.length ? _and(...conds) : undefined;
      },
      with: { unidad: true, operador: true, obra: true, archivos: { columns: { url: true }, limit: 1 }, periodo: { columns: { cerrado: true } } },
      orderBy: (c, { desc: _desc }) => [_desc(c.fecha), _desc(c.createdAt)],
      limit: lim,
      offset: off,
    }),
    db.select({ total: count() }).from(cargas).where(buildWhere()),
  ]);

  return { rows, total: countRows[0]?.total ?? 0 };
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
// RECALCULAR RENDIMIENTO DE PERÍODO CERRADO (helper interno)
// ─────────────────────────────────────────────────────────────
async function recalcularRendimientosForUnit(periodoId: number, unidadId: number) {
  const [cargasDelPeriodo, unidad, TOLERANCIA] = await Promise.all([
    db
      .select({ litros: cargas.litros, odometroHrs: cargas.odometroHrs })
      .from(cargas)
      .where(and(eq(cargas.periodoId, periodoId), eq(cargas.unidadId, unidadId))),
    db.query.unidades.findFirst({ where: eq(unidades.id, unidadId) }),
    getTolerancia(),
  ]);

  // Eliminar snapshot existente para esta unidad+período
  await db.delete(rendimientos)
    .where(and(eq(rendimientos.periodoId, periodoId), eq(rendimientos.unidadId, unidadId)));

  if (!unidad || unidad.tipo === "nissan" || cargasDelPeriodo.length === 0) return;

  const litrosConsumidos = cargasDelPeriodo.reduce((s, c) => s + (c.litros ?? 0), 0);
  const odometros = cargasDelPeriodo
    .filter((c) => c.odometroHrs != null && c.odometroHrs > 0)
    .map((c) => c.odometroHrs as number);
  const odometroInicial = odometros.length > 0 ? Math.min(...odometros) : null;
  const odometroFinal   = odometros.length > 0 ? Math.max(...odometros) : null;
  const kmHrsRecorridos =
    odometroInicial !== null && odometroFinal !== null && odometroFinal > odometroInicial
      ? odometroFinal - odometroInicial
      : null;

  let rendimientoActual: number | null = null;
  if (kmHrsRecorridos && kmHrsRecorridos > 0 && litrosConsumidos > 0) {
    rendimientoActual =
      unidad.tipo === "camion"
        ? kmHrsRecorridos / litrosConsumidos
        : litrosConsumidos / kmHrsRecorridos;
  }

  const rRef = unidad.rendimientoReferencia ?? null;
  let diferencia: number | null = null;
  let dentroDeTolerancia: boolean | null = null;
  if (rendimientoActual !== null && rRef) {
    diferencia = rendimientoActual - rRef;
    dentroDeTolerancia = Math.abs(diferencia / rRef) <= TOLERANCIA;
  }

  await db.insert(rendimientos).values({
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
  const { userId } = await auth();
  await requireManageRole();

  const carga = await db.query.cargas.findFirst({ where: eq(cargas.id, id) });
  if (!carga) throw new Error("Carga no encontrada");

  // Si cambia litros, ajustar stock y cuentalitros del tanque
  if (data.litros !== undefined && data.litros !== carga.litros && carga.tanqueId) {
    const tanque = await db.query.tanques.findFirst({ where: eq(tanques.id, carga.tanqueId) });
    if (tanque) {
      const diff = data.litros - carga.litros;
      const nuevosLitros = Math.max(0, (tanque.litrosActuales ?? 0) - diff);
      const nuevoCuentalitros = (tanque.cuentalitrosActual ?? 0) + diff;
      await db.update(tanques)
        .set({ litrosActuales: nuevosLitros, cuentalitrosActual: nuevoCuentalitros, ultimaActualizacion: new Date() })
        .where(eq(tanques.id, tanque.id));
      await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
        tanque: tanque.nombre,
        litrosActuales: nuevosLitros,
        cuentalitros: nuevoCuentalitros,
      }).catch(() => {});
    }
  }

  const [updated] = await db.update(cargas).set(data).where(eq(cargas.id, id)).returning();

  // Si el período está cerrado y cambiaron campos que afectan rendimiento, recalcular snapshot
  const afectaRendimiento = data.litros !== undefined || data.odometroHrs !== undefined;
  if (afectaRendimiento && carga.periodoId) {
    const periodo = await db.query.periodos.findFirst({ where: eq(periodos.id, carga.periodoId) });
    if (periodo?.cerrado) {
      await recalcularRendimientosForUnit(carga.periodoId, carga.unidadId);
      await db.insert(auditLog).values({
        usuarioId: userId,
        accion: "recalc_rendimiento",
        entidad: "rendimiento",
        entidadId: `${carga.periodoId}:${carga.unidadId}`,
        datosJson: JSON.stringify({ motivo: "update_carga", cargaId: id, cambios: data }),
      });
      revalidatePath("/periodos");
    }
  }

  revalidatePath("/cargas");
  revalidatePath("/overview");
  return updated;
}

// ─────────────────────────────────────────────────────────────
// ELIMINAR CARGA (revierte stock del tanque)
// ─────────────────────────────────────────────────────────────
export async function deleteCarga(id: number, notaModificacion?: string) {
  const { userId } = await auth();
  await requireManageRole();

  const carga = await db.query.cargas.findFirst({ where: eq(cargas.id, id) });
  if (!carga) throw new Error("Carga no encontrada");

  // Revertir stock y cuentalitros del tanque
  if (carga.tanqueId) {
    const tanque = await db.query.tanques.findFirst({ where: eq(tanques.id, carga.tanqueId) });
    if (tanque) {
      const restoredLitros = (tanque.litrosActuales ?? 0) + carga.litros;
      const restoredCuentalitros = Math.max(0, (tanque.cuentalitrosActual ?? 0) - carga.litros);
      await db.update(tanques)
        .set({ litrosActuales: restoredLitros, cuentalitrosActual: restoredCuentalitros, ultimaActualizacion: new Date() })
        .where(eq(tanques.id, tanque.id));
      await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
        tanque: tanque.nombre,
        litrosActuales: restoredLitros,
        cuentalitros: restoredCuentalitros,
      }).catch(() => {});
    }
  }

  const { periodoId, unidadId } = carga;
  await db.delete(cargas).where(eq(cargas.id, id));

  // Si el período está cerrado, recalcular el snapshot de rendimiento para esta unidad
  if (periodoId) {
    const periodo = await db.query.periodos.findFirst({ where: eq(periodos.id, periodoId) });
    if (periodo?.cerrado) {
      await recalcularRendimientosForUnit(periodoId, unidadId);
      await db.insert(auditLog).values({
        usuarioId: userId,
        accion: "recalc_rendimiento",
        entidad: "rendimiento",
        entidadId: `${periodoId}:${unidadId}`,
        datosJson: JSON.stringify({ motivo: "delete_carga", cargaId: id, periodoId, unidadId, nota: notaModificacion ?? null }),
      });
      revalidatePath("/periodos");
    }
  }

  revalidatePath("/cargas");
  revalidatePath("/overview");
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
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  await requireManageRole();

  if (input.litros <= 0) throw new Error("Los litros deben ser mayores a 0");

  const periodo = await getOrCreatePeriodoActual(new Date(input.fecha));

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
