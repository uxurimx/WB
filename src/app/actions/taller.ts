"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  ordenesTaller,
  ordenChecklist,
  ordenRefacciones,
  unidades,
  operadores,
  users,
  ordenTallerLog,
  incidenciasTaller,
  tallerEventos,
  tallerUrea,
} from "@/db/schema";
import { eq, and, inArray, gte, lte, desc } from "drizzle-orm";
import { requireActionPermission, requireAnyActionPermission, requireManageRole } from "@/lib/authz";
import { CHECKLIST_PUNTOS, type EstadoOrden } from "@/lib/taller-checklist";
import { registrarMantenimientoUnidad } from "@/app/actions/mantenimiento";
import { getNowLocal, parseLocalDate } from "@/lib/date-utils";
import { CATEGORIAS_SIN_TALLER, formatoFolioTaller, TALLER_FALLAS, type CategoriaTaller } from "@/lib/taller-incidencias";

export type RefaccionInput = {
  descripcion: string;
  cantidad?: number | null;
  cajas?: number | null;
  unidadMedida?: string | null;
  precio?: number | null;
  iva?: boolean;
  origen?: string | null;
  proveedor?: string | null;
  folioFactura?: string | null;
};

export type ChecklistInput = {
  clave: string;
  respuesta?: "si" | "no" | "na" | null;
  ok: boolean | null;
  nota?: string | null;
  fotos?: { url: string; key: string }[] | null;
};

export type OrdenTallerUpdateInput = {
  operadorId?: number | null;
  fecha?: string;
  kmHrs?: number | null;
  motivo?: string | null;
  categoria?: CategoriaTaller;
  quienRecibio?: string | null;
  quienAtendio?: string | null;
  mecanicos?: string[];
  mecanicoOtro?: string | null;
  proveedorExterno?: string | null;
  comentarios?: string | null;
  diagnosticoFinal?: string | null;
  trabajoRealizado?: string | null;
  observacionesSalida?: string | null;
  quienEntrega?: string | null;
  fechaSalida?: string | null;
  proximoMto?: string | null;
  fotosIngreso?: { url: string; key: string; tipo: "imagen" | "video" }[];
  fotosSalida?: { url: string; key: string; tipo: "imagen" | "video" }[];
  esPreventivo?: boolean;
  tipoControlPreventivo?: string | null;
  checklist?: ChecklistInput[];
  refacciones?: RefaccionInput[];
  estado?: "abierta" | "en_proceso";
};

async function logOrden(ordenId: number, usuarioId: string, accion: string) {
  try {
    await db.insert(ordenTallerLog).values({ ordenId, usuarioId, accion });
  } catch (error) {
    if (!isMissingTallerExtension(error)) throw error;
  }
}

async function logTallerEvento(input: {
  unidadId: number;
  incidenciaId?: number | null;
  ordenId?: number | null;
  tipo: string;
  detalle?: string | null;
  usuarioId: string;
}) {
  try {
    await db.insert(tallerEventos).values(input);
  } catch (error) {
    if (!isMissingTallerExtension(error)) throw error;
  }
}

function isMissingTallerExtension(error: unknown) {
  const e = error as { code?: string; message?: string };
  return e?.code === "42P01" || e?.code === "42703" ||
    /(?:incidencias_taller|taller_eventos|taller_urea|incidencia_id|diagnostico_final|trabajo_realizado|proveedor_externo|observaciones_salida|quien_entrega|fecha_salida|folio|fallas|ubicacion|observaciones).*(?:does not exist|no existe)/i.test(e?.message ?? "");
}

export async function getUreaTaller(unidadId?: number) {
  await requireActionPermission("taller");
  return db.select({
    id: tallerUrea.id,
    unidadId: tallerUrea.unidadId,
    operadorId: tallerUrea.operadorId,
    fecha: tallerUrea.fecha,
    litros: tallerUrea.litros,
    observaciones: tallerUrea.observaciones,
    createdAt: tallerUrea.createdAt,
    unidadCodigo: unidades.codigo,
    operadorNombre: operadores.nombre,
  }).from(tallerUrea)
    .innerJoin(unidades, eq(tallerUrea.unidadId, unidades.id))
    .leftJoin(operadores, eq(tallerUrea.operadorId, operadores.id))
    .where(unidadId ? eq(tallerUrea.unidadId, unidadId) : undefined)
    .orderBy(desc(tallerUrea.fecha), desc(tallerUrea.createdAt));
}

export async function crearRegistroUreaTaller(input: {
  unidadId: number;
  operadorId?: number | null;
  fecha: string;
  litros: number;
  observaciones?: string | null;
}) {
  const { userId } = await requireActionPermission("taller");
  if (!Number.isFinite(input.litros) || input.litros <= 0 || input.litros > 10000) {
    throw new Error("La cantidad de litros debe ser mayor a cero y menor a 10,000.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha)) throw new Error("La fecha no es válida.");
  const observaciones = input.observaciones?.trim() || null;
  if ((observaciones?.length ?? 0) > 2000) throw new Error("Las observaciones no pueden exceder 2,000 caracteres.");
  const unidad = await db.query.unidades.findFirst({ where: and(eq(unidades.id, input.unidadId), eq(unidades.activo, true)) });
  if (!unidad) throw new Error("La unidad no existe o está inactiva.");
  let operadorNombre: string | null = null;
  if (input.operadorId != null) {
    const operador = await db.query.operadores.findFirst({ where: eq(operadores.id, input.operadorId) });
    if (!operador) throw new Error("El operador seleccionado no existe.");
    operadorNombre = operador.nombre;
  }
  const [registro] = await db.insert(tallerUrea).values({
    unidadId: input.unidadId,
    operadorId: input.operadorId ?? null,
    fecha: input.fecha,
    litros: input.litros,
    observaciones,
    registradoPorId: userId,
  }).returning({ id: tallerUrea.id });
  await logTallerEvento({
    unidadId: input.unidadId,
    tipo: "urea_registrada",
    detalle: `Urea · ${input.litros} L · Fecha ${input.fecha} · Chofer ${operadorNombre ?? "Sin asignar"}${observaciones ? ` · Observaciones: ${observaciones}` : ""}`,
    usuarioId: userId,
  });
  revalidatePath("/taller");
  revalidatePath("/taller/bitacora");
  revalidatePath(`/catalogo/unidades/${input.unidadId}`);
  return { ok: true, id: registro.id };
}

function parseFallasGuardadas(value: string | null | undefined) {
  try {
    const fallas: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(fallas) ? fallas.filter((falla): falla is string => typeof falla === "string") : [];
  } catch {
    return [];
  }
}

async function leerExtensionOrden(id: number) {
  try {
    const base = (await db.select({
      incidenciaId: ordenesTaller.incidenciaId,
      diagnosticoFinal: ordenesTaller.diagnosticoFinal,
      trabajoRealizado: ordenesTaller.trabajoRealizado,
      observacionesSalida: ordenesTaller.observacionesSalida,
      quienEntrega: ordenesTaller.quienEntrega,
      fechaSalida: ordenesTaller.fechaSalida,
      comentarios: ordenesTaller.comentarios,
      mecanicos: ordenesTaller.mecanicos,
      mecanicoOtro: ordenesTaller.mecanicoOtro,
      fotosIngreso: ordenesTaller.fotosIngreso,
      fotosSalida: ordenesTaller.fotosSalida,
    }).from(ordenesTaller).where(eq(ordenesTaller.id, id)).limit(1))[0] ?? null;
    if (!base) return null;
    let proveedorExterno: string | null = null;
    let proveedorExternoReady = true;
    try {
      proveedorExterno = (await db.select({ proveedorExterno: ordenesTaller.proveedorExterno })
        .from(ordenesTaller).where(eq(ordenesTaller.id, id)).limit(1))[0]?.proveedorExterno ?? null;
    } catch (error) {
      if (!isMissingTallerExtension(error)) throw error;
      proveedorExternoReady = false;
    }
    return { ...base, proveedorExterno, proveedorExternoReady };
  } catch (error) {
    if (!isMissingTallerExtension(error)) throw error;
    return null;
  }
}

async function leerFotosChecklistForOrders(ids: number[]) {
  if (!ids.length) return new Map<number, string | null>();
  try {
    const rows = await db.select({ id: ordenChecklist.id, fotos: ordenChecklist.fotos })
      .from(ordenChecklist)
      .where(inArray(ordenChecklist.id, ids));
    const fotos = new Map<number, string | null>();
    for (const row of rows) fotos.set(row.id, row.fotos);
    return fotos;
  } catch (error) {
    if (!isMissingTallerExtension(error)) throw error;
    return new Map<number, string | null>();
  }
}

async function leerFoliosOrdenes(ids: number[]) {
  if (!ids.length) return new Map<number, number>();
  try {
    const rows = await db.select({ id: ordenesTaller.id, folio: ordenesTaller.folio })
      .from(ordenesTaller).where(inArray(ordenesTaller.id, ids));
    const folios = new Map<number, number>();
    for (const row of rows) folios.set(row.id, row.folio);
    return folios;
  } catch (error) {
    if (!isMissingTallerExtension(error)) throw error;
    return new Map<number, number>();
  }
}

async function nombresDe(ids: (string | null | undefined)[]) {
  const uniq = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (uniq.length === 0) return {} as Record<string, string>;
  const rows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, uniq));
  return Object.fromEntries(rows.map((r) => [r.id, r.name || r.email]));
}

export async function getOrdenesTaller(opts?: { unidadId?: number; estado?: EstadoOrden }) {
  await requireActionPermission("taller");
  const where = [];
  if (opts?.unidadId) where.push(eq(ordenesTaller.unidadId, opts.unidadId));
  if (opts?.estado) where.push(eq(ordenesTaller.estado, opts.estado));

  const rows = await db.query.ordenesTaller.findMany({
    where: where.length ? and(...where) : undefined,
    orderBy: (t, { desc: d }) => [d(t.fecha), d(t.createdAt)],
    columns: {
      id: true,
      unidadId: true,
      incidenciaId: true,
      operadorId: true,
      fecha: true,
      kmHrs: true,
      motivo: true,
      categoria: true,
      estado: true,
      abiertoPorId: true,
      cerradoPorId: true,
      quienAtendio: true,
      mecanicos: true,
      mecanicoOtro: true,
      comentarios: true,
      createdAt: true,
    },
    with: {
      unidad: { columns: { id: true, codigo: true, tipo: true } },
      operador: { columns: { id: true, nombre: true } },
      refacciones: true,
    },
  });
  const folios = await leerFoliosOrdenes(rows.map((row) => row.id));
  const names = await nombresDe(rows.flatMap((r) => [r.abiertoPorId, r.cerradoPorId]));
  const extensionById = new Map<number, { incidenciaId: number | null; diagnosticoFinal: string | null; trabajoRealizado: string | null; observacionesSalida: string | null; quienEntrega: string | null; fechaSalida: Date | null }>();
  const proveedorById = new Map<number, string | null>();
  if (rows.length) {
    try {
      const extensions = await db.select({
        id: ordenesTaller.id,
        incidenciaId: ordenesTaller.incidenciaId,
        diagnosticoFinal: ordenesTaller.diagnosticoFinal,
        trabajoRealizado: ordenesTaller.trabajoRealizado,
        observacionesSalida: ordenesTaller.observacionesSalida,
        quienEntrega: ordenesTaller.quienEntrega,
        fechaSalida: ordenesTaller.fechaSalida,
      }).from(ordenesTaller).where(inArray(ordenesTaller.id, rows.map((row) => row.id)));
      for (const extension of extensions) extensionById.set(extension.id, extension);
    } catch (error) {
      if (!isMissingTallerExtension(error)) throw error;
    }
    try {
      const providers = await db.select({ id: ordenesTaller.id, proveedorExterno: ordenesTaller.proveedorExterno })
        .from(ordenesTaller).where(inArray(ordenesTaller.id, rows.map((row) => row.id)));
      for (const row of providers) proveedorById.set(row.id, row.proveedorExterno);
    } catch (error) {
      if (!isMissingTallerExtension(error)) throw error;
    }
  }
  return rows.map((r) => ({
    ...r,
    ...(extensionById.get(r.id) ?? {}),
    proveedorExterno: proveedorById.get(r.id) ?? null,
    folio: folios.get(r.id) ?? null,
    abiertoPorNombre: r.abiertoPorId ? names[r.abiertoPorId] ?? null : null,
    actualizadoPorNombre: null,
    cerradoPorNombre: r.cerradoPorId ? names[r.cerradoPorId] ?? null : null,
  }));
}

export async function getOrdenTaller(id: number) {
  await requireActionPermission("taller");
  const orden = await db.query.ordenesTaller.findFirst({
    where: eq(ordenesTaller.id, id),
    columns: {
      id: true,
      unidadId: true,
      operadorId: true,
      fecha: true,
      kmHrs: true,
      motivo: true,
      categoria: true,
      estado: true,
      esPreventivo: true,
      tipoControlPreventivo: true,
      eventoMantenimientoId: true,
      quienRecibio: true,
      quienAtendio: true,
      mecanicos: true,
      mecanicoOtro: true,
      comentarios: true,
      proximoMto: true,
      abiertoPorId: true,
      cerradoPorId: true,
      cerradoAt: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      unidad: true,
      operador: true,
      checklist: { columns: { id: true, clave: true, ok: true, respuesta: true, nota: true } },
      refacciones: true,
    },
  });
  if (!orden) return null;
  const folio = (await leerFoliosOrdenes([id])).get(id) ?? null;
  const extension = await leerExtensionOrden(id);
  const extensionReady = Boolean(extension);
  const logs = await db.query.ordenTallerLog.findMany({
    where: eq(ordenTallerLog.ordenId, id),
    orderBy: (l, { desc: d }) => [d(l.createdAt)],
    limit: 20,
  }).catch((error) => {
    if (!isMissingTallerExtension(error)) throw error;
    return [];
  });
  const names = await nombresDe([
    orden.abiertoPorId,
    orden.cerradoPorId,
    ...logs.map((l) => l.usuarioId),
  ]);
  const fotos = await leerFotosChecklistForOrders(orden.checklist.map((item) => item.id));
  return {
    ...orden,
    folio,
    checklist: orden.checklist.map((item) => ({ ...item, fotos: fotos.get(item.id) ?? null })),
    incidenciaId: extension?.incidenciaId ?? null,
    diagnosticoFinal: extension?.diagnosticoFinal ?? null,
    trabajoRealizado: extension?.trabajoRealizado ?? null,
    proveedorExterno: extension?.proveedorExterno ?? null,
    mecanicos: extension?.mecanicos ?? null,
    mecanicoOtro: extension?.mecanicoOtro ?? null,
    fotosIngreso: extension?.fotosIngreso ?? null,
    fotosSalida: extension?.fotosSalida ?? null,
    proveedorExternoReady: extension?.proveedorExternoReady ?? false,
    observacionesSalida: extension?.observacionesSalida ?? null,
    quienEntrega: extension?.quienEntrega ?? null,
    fechaSalida: extension?.fechaSalida ?? null,
    extensionReady,
    abiertoPorNombre: orden.abiertoPorId ? names[orden.abiertoPorId] ?? null : null,
    actualizadoPorNombre: null,
    cerradoPorNombre: orden.cerradoPorId ? names[orden.cerradoPorId] ?? null : null,
    log: logs.map((l) => ({
      accion: l.accion,
      at: l.createdAt?.toISOString() ?? null,
      nombre: names[l.usuarioId] ?? l.usuarioId,
    })),
  };
}

export async function getOrdenesUnidad(unidadId: number) {
  await requireAnyActionPermission(["taller", "catalogo"]);
  const ordenes = await db.query.ordenesTaller.findMany({
    where: eq(ordenesTaller.unidadId, unidadId),
    orderBy: (t, { desc: d }) => [d(t.fecha), d(t.createdAt)],
    columns: {
      id: true,
      unidadId: true,
      fecha: true,
      createdAt: true,
      kmHrs: true,
      motivo: true,
      categoria: true,
      estado: true,
      quienAtendio: true,
      mecanicos: true,
      mecanicoOtro: true,
    },
    with: {
      refacciones: true,
      checklist: { columns: { id: true, clave: true } },
      operador: { columns: { nombre: true } },
    },
  });
  const folios = await leerFoliosOrdenes(ordenes.map((orden) => orden.id));
  const detalles = new Map<number, { trabajoRealizado: string | null; comentarios: string | null; proveedorExterno: string | null }>();
  if (ordenes.length) {
    try {
      const rows = await db.select({
        id: ordenesTaller.id,
        trabajoRealizado: ordenesTaller.trabajoRealizado,
        comentarios: ordenesTaller.comentarios,
        proveedorExterno: ordenesTaller.proveedorExterno,
      }).from(ordenesTaller).where(inArray(ordenesTaller.id, ordenes.map((orden) => orden.id)));
      for (const row of rows) detalles.set(row.id, row);
    } catch (error) {
      if (!isMissingTallerExtension(error)) throw error;
    }
  }
  const ids = ordenes.flatMap((orden) => orden.checklist.map((item) => item.id));
  const fotos = await leerFotosChecklistForOrders(ids);
  return ordenes.map((orden) => ({
    ...orden,
    folio: folios.get(orden.id) ?? null,
    trabajoRealizado: detalles.get(orden.id)?.trabajoRealizado ?? null,
    comentarios: detalles.get(orden.id)?.comentarios ?? null,
    proveedorExterno: detalles.get(orden.id)?.proveedorExterno ?? null,
    checklist: orden.checklist.map((item) => ({ ...item, fotos: fotos.get(item.id) ?? null })),
  }));
}

export async function getIncidenciasTaller(filtro: string | { desde: string; hasta: string; unidadId?: number } = getNowLocal().fecha.slice(0, 7)) {
  await requireActionPermission("taller");
  let desde: string;
  let hasta: string;
  if (typeof filtro === "string") {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(filtro)) throw new Error("Mes de incidencias no válido.");
    const [year, month] = filtro.split("-").map(Number);
    desde = `${filtro}-01`;
    hasta = `${filtro}-${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
  } else {
    desde = filtro.desde;
    hasta = filtro.hasta;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta) || desde > hasta) {
      throw new Error("El rango de fechas de incidencias no es válido.");
    }
  }
  const conditions = [gte(incidenciasTaller.fecha, desde), lte(incidenciasTaller.fecha, hasta)];
  if (typeof filtro !== "string" && filtro.unidadId) conditions.push(eq(incidenciasTaller.unidadId, filtro.unidadId));
  const rows = await db.query.incidenciasTaller.findMany({
    where: and(...conditions),
    orderBy: (t, { desc: d }) => [d(t.createdAt)],
    with: {
      unidad: { columns: { id: true, codigo: true, tipo: true } },
      operador: { columns: { id: true, nombre: true } },
    },
  });
  if (!rows.length) return [];
  const [eventos, ordenes] = await Promise.all([
    db.select({
      id: tallerEventos.id,
      incidenciaId: tallerEventos.incidenciaId,
      tipo: tallerEventos.tipo,
      detalle: tallerEventos.detalle,
      usuarioId: tallerEventos.usuarioId,
      createdAt: tallerEventos.createdAt,
    }).from(tallerEventos).where(inArray(tallerEventos.incidenciaId, rows.map((r) => r.id)))
      .orderBy(tallerEventos.createdAt),
    db.select({ id: ordenesTaller.id, folio: ordenesTaller.folio, incidenciaId: ordenesTaller.incidenciaId, estado: ordenesTaller.estado, quienAtendio: ordenesTaller.quienAtendio })
      .from(ordenesTaller).where(inArray(ordenesTaller.incidenciaId, rows.map((r) => r.id))),
  ]);
  const names = await nombresDe([...eventos.map((e) => e.usuarioId), ...rows.map((row) => row.reportadaPorId)]);
  const porIncidencia = new Map<number, typeof eventos>();
  for (const evento of eventos) {
    if (evento.incidenciaId == null) continue;
    const historial = porIncidencia.get(evento.incidenciaId) ?? [];
    historial.push(evento);
    porIncidencia.set(evento.incidenciaId, historial);
  }
  const ordenPorIncidencia = new Map<number, (typeof ordenes)[number]>();
  for (const orden of ordenes) {
    if (orden.incidenciaId != null) ordenPorIncidencia.set(orden.incidenciaId, orden);
  }
  return rows.map((row) => ({
    ...row,
    atendio: ordenPorIncidencia.get(row.id)?.quienAtendio || (row.reportadaPorId ? names[row.reportadaPorId] ?? null : null),
    orden: ordenPorIncidencia.get(row.id) ?? null,
    historial: (porIncidencia.get(row.id) ?? []).map((evento) => ({
      ...evento,
      usuarioNombre: evento.usuarioId ? names[evento.usuarioId] ?? null : null,
    })),
  }));
}

export async function getIncidenciasActivasTaller() {
  await requireActionPermission("taller");
  return db.query.incidenciasTaller.findMany({
    where: inArray(incidenciasTaller.estado, ["abierta", "en_revision"]),
    columns: { id: true, unidadId: true, estado: true },
  });
}

export async function getBitacoraGeneralTaller(unidadId?: number) {
  if (unidadId) await requireAnyActionPermission(["taller", "catalogo"]);
  else await requireActionPermission("taller");
  type TallerEventoConRelaciones = {
    id: number;
    unidadId: number;
    incidenciaId: number | null;
    ordenId: number | null;
    tipo: string;
    detalle: string | null;
    usuarioId: string | null;
    createdAt: Date | null;
    unidad: { codigo: string } | null;
    incidencia: { descripcion: string; categoria: string } | null;
    orden: { id: number; motivo: string | null; estado: string } | null;
  };
  let rows: TallerEventoConRelaciones[] = [];
  try {
    rows = await db.query.tallerEventos.findMany({
      where: unidadId ? eq(tallerEventos.unidadId, unidadId) : undefined,
      orderBy: (t, { desc: d }) => [d(t.createdAt)],
      limit: 150,
      with: {
        unidad: { columns: { codigo: true } },
        incidencia: { columns: { descripcion: true, categoria: true } },
        orden: { columns: { id: true, motivo: true, estado: true } },
      },
    });
  } catch (error) {
    if (!isMissingTallerExtension(error)) throw error;
  }
  const ordenes = await db.query.ordenesTaller.findMany({
    where: unidadId ? eq(ordenesTaller.unidadId, unidadId) : undefined,
    orderBy: (t, { desc: d }) => [d(t.createdAt)],
    limit: 150,
    columns: {
      id: true,
      unidadId: true,
      fecha: true,
      motivo: true,
      estado: true,
      comentarios: true,
      cerradoPorId: true,
      abiertoPorId: true,
      cerradoAt: true,
      createdAt: true,
    },
    with: { unidad: { columns: { codigo: true } } },
  });
  let logs: typeof ordenTallerLog.$inferSelect[] = [];
  if (ordenes.length) {
    try {
      logs = await db.query.ordenTallerLog.findMany({
        where: inArray(ordenTallerLog.ordenId, ordenes.map((orden) => orden.id)),
        orderBy: (t, { desc: d }) => [d(t.createdAt)],
        limit: 500,
      });
    } catch (error) {
      if (!isMissingTallerExtension(error)) throw error;
    }
  }
  const ordenesConEvento = new Set(rows.map((r) => r.ordenId).filter((id): id is number => id != null));
  const historialPrevio = ordenes.filter((o) => !ordenesConEvento.has(o.id)).map((o) => ({
    id: -o.id,
    unidadId: o.unidadId,
    incidenciaId: null,
    ordenId: o.id,
    tipo: o.estado === "cerrada" ? "orden_cerrada" : "orden_historial",
    detalle: [
      `Orden #${o.id} · ${o.estado}`,
      o.motivo,
      o.comentarios,
    ].filter(Boolean).join(" · "),
    usuarioId: o.cerradoPorId ?? o.abiertoPorId,
    createdAt: o.cerradoAt ?? o.createdAt,
    unidad: o.unidad,
    incidencia: null,
    orden: { id: o.id, motivo: o.motivo, estado: o.estado },
  }));
  const ordenPorId = new Map(ordenes.map((orden) => [orden.id, orden]));
  const eventosEdicion = logs.flatMap((log) => {
    const orden = ordenPorId.get(log.ordenId);
    if (!orden) return [];
    return [{
      id: -(log.id + 1_000_000),
      unidadId: orden.unidadId,
      incidenciaId: null,
      ordenId: orden.id,
      tipo: `orden_${log.accion}`,
      detalle: log.accion === "editar" ? "Se actualizaron los datos de la orden." : `Orden: ${log.accion}`,
      usuarioId: log.usuarioId,
      createdAt: log.createdAt,
      unidad: orden.unidad,
      incidencia: null,
      orden: { id: orden.id, motivo: orden.motivo, estado: orden.estado },
    }];
  });
  const combined = [...rows, ...historialPrevio, ...eventosEdicion].sort((a, b) =>
    (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
  ).slice(0, 150);
  const names = await nombresDe(combined.map((r) => r.usuarioId));
  return combined.map((r) => ({
    ...r,
    usuarioNombre: r.usuarioId ? names[r.usuarioId] ?? null : null,
  }));
}

export async function crearIncidenciaTaller(input: {
  unidadId: number;
  operadorId?: number | null;
  fecha?: string;
  prioridad?: string;
  fallas: string[];
  descripcion?: string;
  ubicacion?: string;
  observaciones?: string;
  categoria?: CategoriaTaller;
}) {
  const { userId } = await requireActionPermission("taller");
  const fallas = [...new Set(input.fallas ?? [])];
  if (fallas.some((falla) => !TALLER_FALLAS.includes(falla as typeof TALLER_FALLAS[number]))) {
    throw new Error("Selecciona fallas válidas.");
  }
  const descripcion = input.descripcion?.trim() ?? "";
  const ubicacion = input.ubicacion?.trim() ?? "";
  const observaciones = input.observaciones?.trim() ?? "";
  if (!fallas.length && !descripcion) throw new Error("Selecciona al menos una falla o agrega una descripción.");
  if (descripcion.length > 2000) throw new Error("El reporte no puede exceder 2,000 caracteres.");
  if (ubicacion.length > 200) throw new Error("La ubicación no puede exceder 200 caracteres.");
  if (observaciones.length > 2000) throw new Error("Las observaciones no pueden exceder 2,000 caracteres.");
  const prioridades = ["alta", "media", "baja"];
  if (input.prioridad && !prioridades.includes(input.prioridad)) throw new Error("Prioridad de incidencia no válida.");
  const categorias: CategoriaTaller[] = ["preventivo", "correctivo", "otro", "urea", "llanta_danada"];
  if (input.categoria && !categorias.includes(input.categoria)) throw new Error("Categoría de incidencia no válida.");
  const categoria = input.categoria ?? "otro";
  const esRegistroCerrado = CATEGORIAS_SIN_TALLER.includes(categoria as typeof CATEGORIAS_SIN_TALLER[number]);
  const unidad = await db.query.unidades.findFirst({
    where: and(eq(unidades.id, input.unidadId), eq(unidades.activo, true)),
  });
  if (!unidad) throw new Error("La unidad no existe o está inactiva.");

  const [incidencia] = await db.insert(incidenciasTaller).values({
    unidadId: input.unidadId,
    operadorId: input.operadorId ?? null,
    reportadaPorId: userId,
    fecha: input.fecha || getNowLocal().fecha,
    categoria,
    prioridad: input.prioridad || "media",
    fallas: JSON.stringify(fallas),
    descripcion: descripcion || fallas.join(", "),
    ubicacion: ubicacion || null,
    observaciones: observaciones || null,
    estado: esRegistroCerrado ? "resuelta" : "abierta",
    resolucion: esRegistroCerrado ? (observaciones || descripcion || null) : null,
    creadoPorId: userId,
  }).returning();
  await logTallerEvento({
    unidadId: input.unidadId,
    incidenciaId: incidencia.id,
    tipo: "incidencia_creada",
    detalle: `${fallas.length ? fallas.join(", ") : descripcion}${descripcion && descripcion !== fallas.join(", ") ? ` · ${descripcion}` : ""}${ubicacion ? ` · Ubicación: ${ubicacion}` : ""}`,
    usuarioId: userId,
  });
  revalidatePath("/taller");
  revalidatePath("/taller/bitacora");
  revalidatePath(`/catalogo/unidades/${input.unidadId}`);
  return { ok: true, id: incidencia.id };
}

export async function actualizarEstadoIncidenciaTaller(
  id: number,
  estado: "en_revision" | "cancelada",
) {
  const { userId } = await requireActionPermission("taller");
  const incidencia = await db.query.incidenciasTaller.findFirst({
    where: eq(incidenciasTaller.id, id),
  });
  if (!incidencia) throw new Error("Incidencia no encontrada.");
  if (incidencia.ordenId || incidencia.estado === "resuelta") {
    throw new Error("Esta incidencia ya está vinculada a una orden o resuelta.");
  }
  await db.update(incidenciasTaller).set({ estado, updatedAt: new Date() })
    .where(eq(incidenciasTaller.id, id));
  await logTallerEvento({
    unidadId: incidencia.unidadId,
    incidenciaId: id,
    tipo: estado === "en_revision" ? "incidencia_en_revision" : "incidencia_cancelada",
    detalle: incidencia.descripcion,
    usuarioId: userId,
  });
  revalidatePath("/taller");
  revalidatePath("/taller/bitacora");
  revalidatePath(`/catalogo/unidades/${incidencia.unidadId}`);
  return { ok: true };
}

export async function recibirIncidenciaTaller(id: number, input: {
  fecha?: string;
  kmHrs?: number | null;
  quienRecibio?: string | null;
}) {
  const { userId } = await requireActionPermission("taller");
  const existing = await db.query.incidenciasTaller.findFirst({
    where: eq(incidenciasTaller.id, id),
    with: { unidad: true },
  });
  if (!existing) throw new Error("Incidencia no encontrada.");
  if (existing.estado === "cancelada" || existing.estado === "resuelta") {
    throw new Error("La incidencia ya no se puede recibir.");
  }
  if (CATEGORIAS_SIN_TALLER.includes(existing.categoria as typeof CATEGORIAS_SIN_TALLER[number])) {
    throw new Error("Las incidencias de Urea o Llanta dañada se quedan en Bitácora y no abren orden de taller.");
  }
  const kmHrs = input.kmHrs ?? (
    existing.unidad.odometroActual != null
      ? (existing.unidad.odometroActual ?? 0) + (existing.unidad.odometroOffset ?? 0)
      : null
  );
  let orden = existing.ordenId ? { id: existing.ordenId } : undefined;
  if (!orden) {
    const [insertada] = await db.insert(ordenesTaller).values({
      unidadId: existing.unidadId,
      incidenciaId: id,
      categoria: existing.categoria === "preventivo" ? "preventivo" : existing.categoria === "correctivo" ? "correctivo" : "otro",
      esPreventivo: existing.categoria === "preventivo",
      tipoControlPreventivo: existing.categoria === "preventivo" ? (existing.unidad.tipo === "maquina" ? "hrs" : "km") : null,
      operadorId: existing.operadorId ?? null,
      fecha: input.fecha || getNowLocal().fecha,
      kmHrs,
      motivo: [
        parseFallasGuardadas(existing.fallas).length ? `Fallas: ${parseFallasGuardadas(existing.fallas).join(", ")}` : null,
        existing.descripcion && existing.descripcion !== parseFallasGuardadas(existing.fallas).join(", ") ? existing.descripcion : null,
      ].filter(Boolean).join(" · ") || existing.descripcion,
      estado: "abierta",
      quienRecibio: input.quienRecibio?.trim() || null,
      abiertoPorId: userId,
    }).onConflictDoNothing().returning({ id: ordenesTaller.id });
    orden = insertada ?? await db.query.ordenesTaller.findFirst({
      where: eq(ordenesTaller.incidenciaId, id),
      columns: { id: true },
    });
  }
  if (!orden) throw new Error("No se pudo abrir la orden para esta incidencia.");
  const ordenId = orden.id;
  const folioOrden = (await leerFoliosOrdenes([ordenId])).get(ordenId) ?? null;

  const checklistExistente = await db.query.ordenChecklist.findMany({
    where: eq(ordenChecklist.ordenId, ordenId),
    columns: { clave: true },
  });
  const clavesExistentes = new Set(checklistExistente.map((c) => c.clave));
  const faltantes = CHECKLIST_PUNTOS.filter((p) => !clavesExistentes.has(p.clave));
  if (faltantes.length) {
    await db.insert(ordenChecklist).values(faltantes.map((p) => ({
      ordenId,
      clave: p.clave,
      respuesta: null,
      ok: null,
      nota: null,
    })));
  }
  await db.update(incidenciasTaller).set({
    estado: "recibida",
    ordenId,
    folio: folioOrden,
    updatedAt: new Date(),
  }).where(eq(incidenciasTaller.id, id));
  const eventoPrevio = await db.query.tallerEventos.findFirst({
    where: and(eq(tallerEventos.ordenId, ordenId), eq(tallerEventos.tipo, "unidad_recibida")),
    columns: { id: true },
  });
  if (!eventoPrevio) {
    await db.insert(ordenTallerLog).values({ ordenId, usuarioId: userId, accion: "recibir_incidencia" });
    await db.insert(tallerEventos).values({
      unidadId: existing.unidadId,
      incidenciaId: id,
      ordenId,
      tipo: "unidad_recibida",
      detalle: `${folioOrden != null ? `Folio ${formatoFolioTaller(folioOrden)} · ` : ""}Orden #${ordenId} · ${existing.descripcion}`,
      usuarioId: userId,
    });
  }
  revalidatePath("/taller");
  revalidatePath("/taller/bitacora");
  revalidatePath(`/taller/${ordenId}`);
  revalidatePath(`/catalogo/unidades/${existing.unidadId}`);
  return { ok: true, id: ordenId };
}

export async function getRefaccionesSugeridas() {
  await requireActionPermission("taller");
  const rows = await db.query.ordenRefacciones.findMany({
    columns: { descripcion: true, proveedor: true },
    orderBy: (r, { desc: d }) => [d(r.id)],
    limit: 80,
  });
  const desc = [...new Set(rows.map((r) => r.descripcion).filter(Boolean))];
  const prov = [...new Set(rows.map((r) => r.proveedor).filter((p): p is string => Boolean(p)))];
  return { descripciones: desc.slice(0, 30), proveedores: prov.slice(0, 20) };
}

export async function getServiciosProgramadosTaller() {
  await requireActionPermission("taller");
  const { getAlertasMantenimientoOverview } = await import("@/app/actions/mantenimiento");
  const [alertas, abiertas] = await Promise.all([
    getAlertasMantenimientoOverview(),
    db.query.ordenesTaller.findMany({
      columns: { unidadId: true, esPreventivo: true, tipoControlPreventivo: true, estado: true },
      where: (t, { inArray }) => inArray(t.estado, ["abierta", "en_proceso"]),
    }),
  ]);
  const ocupadas = new Set(
    abiertas
      .filter((o) => o.esPreventivo)
      .map((o) => `${o.unidadId}:${o.tipoControlPreventivo ?? "km"}`),
  );
  return alertas
    .filter((a) => !ocupadas.has(`${a.unidadId}:${a.tipoControl}`))
    .sort((a, b) => {
      if (a.estado !== b.estado) return a.estado === "vencido" ? -1 : 1;
      return a.faltante - b.faltante;
    });
}

export async function crearOrdenTaller(input: {
  unidadId: number;
  operadorId?: number | null;
  fecha?: string;
  kmHrs?: number | null;
  motivo?: string | null;
  categoria?: CategoriaTaller;
  quienRecibio?: string | null;
  comentarios?: string | null;
  checklist?: ChecklistInput[];
  esPreventivo?: boolean;
  tipoControlPreventivo?: string | null;
}) {
  const { userId } = await requireActionPermission("taller");
  const categoria = input.categoria ?? (input.esPreventivo ? "preventivo" : "correctivo");
  if (!["preventivo", "correctivo", "otro", "urea", "llanta_danada"].includes(categoria)) {
    throw new Error("Categoría de orden no válida.");
  }
  if (CATEGORIAS_SIN_TALLER.includes(categoria as typeof CATEGORIAS_SIN_TALLER[number])) {
    throw new Error("Urea y Llanta dañada se registran como incidencia, sin crear orden de taller.");
  }
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
      categoria,
      estado: "abierta",
      esPreventivo: input.esPreventivo ?? false,
      tipoControlPreventivo: input.tipoControlPreventivo ?? (categoria === "preventivo" ? (unidad.tipo === "maquina" ? "hrs" : "km") : null),
      quienRecibio: input.quienRecibio?.trim() || null,
      comentarios: input.comentarios?.trim() || null,
      abiertoPorId: userId,
    })
    .returning({ id: ordenesTaller.id });
  const folio = (await leerFoliosOrdenes([orden.id])).get(orden.id) ?? null;

  const checks = CHECKLIST_PUNTOS.map((p) => {
    const given = input.checklist?.find((c) => c.clave === p.clave);
    return {
      ordenId: orden.id,
      clave: p.clave,
      respuesta: given?.respuesta ?? null,
      ok: given?.ok ?? null,
      nota: given?.nota ?? null,
    };
  });
  await db.insert(ordenChecklist).values(checks);
  await logOrden(orden.id, userId, "crear");
  await logTallerEvento({
    unidadId: input.unidadId,
    ordenId: orden.id,
    tipo: "orden_creada",
    detalle: `${folio != null ? `Folio ${formatoFolioTaller(folio)} · ` : ""}Orden #${orden.id} · ${input.motivo?.trim() || "Sin motivo"}`,
    usuarioId: userId,
  });

  revalidatePath("/taller");
  revalidatePath("/taller/bitacora");
  revalidatePath(`/catalogo/unidades/${input.unidadId}`);
  return { ok: true, id: orden.id };
}

export async function guardarOrdenTaller(id: number, input: OrdenTallerUpdateInput) {
  const { userId } = await requireActionPermission("taller");
  if (input.categoria && !["preventivo", "correctivo", "otro"].includes(input.categoria)) {
    throw new Error("Urea y Llanta dañada deben registrarse como incidencia, sin orden de taller.");
  }
  if ((input.proveedorExterno?.trim().length ?? 0) > 200) {
    throw new Error("El proveedor externo no puede exceder 200 caracteres.");
  }
  if ((input.comentarios?.trim().length ?? 0) > 4000) {
    throw new Error("Los comentarios no pueden exceder 4,000 caracteres.");
  }
  if (input.fechaSalida && !/^\d{4}-\d{2}-\d{2}$/.test(input.fechaSalida)) {
    throw new Error("La fecha de salida no es válida.");
  }
  const orden = await db.query.ordenesTaller.findFirst({
    where: eq(ordenesTaller.id, id),
    columns: {
      id: true,
      unidadId: true,
      operadorId: true,
      fecha: true,
      kmHrs: true,
      motivo: true,
      estado: true,
      quienRecibio: true,
      quienAtendio: true,
      mecanicos: true,
      mecanicoOtro: true,
      comentarios: true,
      proximoMto: true,
      esPreventivo: true,
      tipoControlPreventivo: true,
    },
  });
  if (!orden) throw new Error("Orden no encontrada");
  if (orden.estado === "cerrada" || orden.estado === "cancelada") {
    throw new Error("Esta orden ya está cerrada o cancelada");
  }

  const extension = await leerExtensionOrden(id);
  await db.update(ordenesTaller).set({
      operadorId: input.operadorId !== undefined ? input.operadorId : orden.operadorId,
      fecha: input.fecha ?? orden.fecha,
      kmHrs: input.kmHrs !== undefined ? input.kmHrs : orden.kmHrs,
      motivo: input.motivo !== undefined ? (input.motivo?.trim() || null) : orden.motivo,
      categoria: input.categoria ?? undefined,
      quienRecibio: input.quienRecibio !== undefined ? (input.quienRecibio?.trim() || null) : orden.quienRecibio,
      quienAtendio: input.quienAtendio !== undefined ? (input.quienAtendio?.trim() || null) : orden.quienAtendio,
      mecanicos: input.mecanicos !== undefined ? JSON.stringify(input.mecanicos) : undefined,
      mecanicoOtro: input.mecanicoOtro !== undefined ? (input.mecanicoOtro?.trim() || null) : undefined,
      comentarios: input.comentarios !== undefined ? (input.comentarios?.trim() || null) : orden.comentarios,
      proximoMto: input.proximoMto !== undefined ? (input.proximoMto?.trim() || null) : orden.proximoMto,
      esPreventivo: input.esPreventivo ?? orden.esPreventivo,
      tipoControlPreventivo:
        input.tipoControlPreventivo !== undefined
          ? input.tipoControlPreventivo
          : orden.tipoControlPreventivo,
      estado: input.estado ?? orden.estado,
      updatedAt: new Date(),
      ...(extension ? {
        diagnosticoFinal: input.diagnosticoFinal !== undefined ? (input.diagnosticoFinal?.trim() || null) : extension.diagnosticoFinal,
        trabajoRealizado: input.trabajoRealizado !== undefined ? (input.trabajoRealizado?.trim() || null) : extension.trabajoRealizado,
        observacionesSalida: input.observacionesSalida !== undefined ? (input.observacionesSalida?.trim() || null) : extension.observacionesSalida,
        quienEntrega: input.quienEntrega !== undefined ? (input.quienEntrega?.trim() || null) : extension.quienEntrega,
        fechaSalida: input.fechaSalida !== undefined ? (input.fechaSalida ? parseLocalDate(input.fechaSalida) : null) : extension.fechaSalida,
        ...(extension.proveedorExternoReady ? {
          proveedorExterno: input.proveedorExterno !== undefined ? (input.proveedorExterno?.trim() || null) : extension.proveedorExterno,
        } : {}),
        fotosIngreso: input.fotosIngreso !== undefined ? (input.fotosIngreso.length ? JSON.stringify(input.fotosIngreso) : null) : extension.fotosIngreso,
        fotosSalida: input.fotosSalida !== undefined ? (input.fotosSalida.length ? JSON.stringify(input.fotosSalida) : null) : extension.fotosSalida,
      } : {}),
    }).where(eq(ordenesTaller.id, id));

  if (input.checklist) {
    for (const c of input.checklist) {
      const row = await db.query.ordenChecklist.findFirst({
        where: and(eq(ordenChecklist.ordenId, id), eq(ordenChecklist.clave, c.clave)),
      });
      if (row) {
        try {
          await db.update(ordenChecklist).set({
            ok: c.ok,
            respuesta: c.respuesta ?? null,
            nota: c.nota ?? null,
            fotos: c.fotos?.length ? JSON.stringify(c.fotos) : null,
          }).where(eq(ordenChecklist.id, row.id));
        } catch (error) {
          if (!isMissingTallerExtension(error)) throw error;
          try {
            await db.update(ordenChecklist).set({ ok: c.ok, respuesta: c.respuesta ?? null, nota: c.nota ?? null })
              .where(eq(ordenChecklist.id, row.id));
          } catch (respuestaError) {
            if (!isMissingTallerExtension(respuestaError)) throw respuestaError;
            await db.update(ordenChecklist).set({ ok: c.ok, nota: c.nota ?? null })
              .where(eq(ordenChecklist.id, row.id));
          }
        }
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
        unidadMedida: r.unidadMedida || "pz",
        precio: r.precio ?? null,
        iva: r.iva ?? true,
        origen: r.origen || "Comprado",
        proveedor: r.proveedor?.trim() || null,
        folioFactura: r.folioFactura?.trim() || null,
      }));
    if (rows.length) await db.insert(ordenRefacciones).values(rows);
  }

  await logOrden(id, userId, input.estado === "en_proceso" ? "en_proceso" : "editar");
  if (input.estado && input.estado !== orden.estado) {
    await logTallerEvento({
      unidadId: orden.unidadId,
      incidenciaId: extension?.incidenciaId ?? null,
      ordenId: id,
      tipo: "orden_estado",
      detalle: `Estado: ${orden.estado} → ${input.estado}`,
      usuarioId: userId,
    });
  }

  revalidatePath("/taller");
  revalidatePath("/taller/bitacora");
  revalidatePath(`/taller/${id}`);
  revalidatePath(`/catalogo/unidades/${orden.unidadId}`);
  return { ok: true };
}

export async function cerrarOrdenTaller(id: number, input?: {
  quienAtendio?: string | null;
  quienEntrega?: string | null;
  esPreventivo?: boolean;
  tipoControlPreventivo?: "km" | "hrs";
  datos?: OrdenTallerUpdateInput;
}) {
  const { userId } = await requireManageRole();
  if (input?.datos) await guardarOrdenTaller(id, input.datos);
  const orden = await db.query.ordenesTaller.findFirst({
    where: eq(ordenesTaller.id, id),
    columns: {
      id: true,
      unidadId: true,
      fecha: true,
      kmHrs: true,
      motivo: true,
      estado: true,
      esPreventivo: true,
      tipoControlPreventivo: true,
      eventoMantenimientoId: true,
      quienAtendio: true,
      cerradoPorId: true,
      abiertoPorId: true,
    },
  });
  if (!orden) throw new Error("Orden no encontrada");
  if (orden.estado === "cerrada") throw new Error("Ya está cerrada");
  if (orden.estado === "cancelada") throw new Error("Está cancelada");
  const folio = (await leerFoliosOrdenes([id])).get(id) ?? null;
  const extension = await leerExtensionOrden(id);
  const incidenciaId = extension?.incidenciaId ?? null;

  const esPreventivo = input?.esPreventivo ?? orden.esPreventivo;
  const tipoControl = input?.tipoControlPreventivo ?? (orden.tipoControlPreventivo as "km" | "hrs" | null) ?? "km";

  let eventoId = orden.eventoMantenimientoId;
  if (esPreventivo && orden.kmHrs != null && !eventoId) {
    const { mantenimientosEventos } = await import("@/db/schema");
    const ya = await db.query.mantenimientosEventos.findFirst({
      where: and(
        eq(mantenimientosEventos.unidadId, orden.unidadId),
        eq(mantenimientosEventos.tipoControl, tipoControl),
        eq(mantenimientosEventos.fechaServicio, orden.fecha),
      ),
      orderBy: (e, { desc: d }) => [d(e.createdAt)],
    });
    if (ya) {
      eventoId = ya.id;
    }
  }
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
      ...(extension ? {
        quienEntrega: input?.quienEntrega !== undefined ? input.quienEntrega : extension.quienEntrega,
        fechaSalida: extension.fechaSalida ?? new Date(),
      } : {}),
    })
    .where(eq(ordenesTaller.id, id));

  await logOrden(id, userId, "cerrar");
  const cierreDetalle = extension?.trabajoRealizado
    ? `Trabajo realizado: ${extension.trabajoRealizado}`
    : [
      extension?.diagnosticoFinal && `Diagnóstico: ${extension.diagnosticoFinal}`,
      extension?.observacionesSalida && `Salida: ${extension.observacionesSalida}`,
      extension?.comentarios && `Comentarios: ${extension.comentarios}`,
    ].filter(Boolean).join(" · ");
  await logTallerEvento({
    unidadId: orden.unidadId,
    incidenciaId,
    ordenId: id,
    tipo: "orden_cerrada",
    detalle: `${folio != null ? `Folio ${formatoFolioTaller(folio)} · ` : ""}Orden #${id}${cierreDetalle ? ` · ${cierreDetalle}` : ""}`,
    usuarioId: userId,
  });
  if (incidenciaId) {
    await db.update(incidenciasTaller).set({
      estado: "resuelta",
      resolucion: cierreDetalle || orden.motivo,
      updatedAt: new Date(),
    }).where(eq(incidenciasTaller.id, incidenciaId));
    await logTallerEvento({
      unidadId: orden.unidadId,
      incidenciaId,
      ordenId: id,
      tipo: "incidencia_resuelta",
      detalle: cierreDetalle || orden.motivo || `Resuelta con la orden #${id}`,
      usuarioId: userId,
    });
  }

  revalidatePath("/taller");
  revalidatePath("/taller/bitacora");
  revalidatePath(`/taller/${id}`);
  revalidatePath(`/catalogo/unidades/${orden.unidadId}`);
  revalidatePath("/overview");
  return { ok: true };
}

export async function cancelarOrdenTaller(id: number) {
  const { userId } = await requireManageRole();
  const orden = await db.query.ordenesTaller.findFirst({
    where: eq(ordenesTaller.id, id),
    columns: { id: true, unidadId: true, motivo: true, estado: true },
  });
  if (!orden) throw new Error("Orden no encontrada");
  if (orden.estado === "cerrada") throw new Error("No se puede cancelar una orden cerrada");
  const folio = (await leerFoliosOrdenes([id])).get(id) ?? null;
  const extension = await leerExtensionOrden(id);

  await db
    .update(ordenesTaller)
    .set({ estado: "cancelada", updatedAt: new Date() })
    .where(eq(ordenesTaller.id, id));
  await logOrden(id, userId, "cancelar");
  await logTallerEvento({
    unidadId: orden.unidadId,
    incidenciaId: extension?.incidenciaId ?? null,
    ordenId: id,
    tipo: "orden_cancelada",
    detalle: `${folio != null ? `Folio ${formatoFolioTaller(folio)} · ` : ""}Orden #${orden.id} · ${orden.motivo ?? "Sin motivo"}`,
    usuarioId: userId,
  });
  if (extension?.incidenciaId) {
    await db.update(incidenciasTaller).set({ estado: "cancelada", updatedAt: new Date() })
      .where(eq(incidenciasTaller.id, extension.incidenciaId));
    await logTallerEvento({
      unidadId: orden.unidadId,
      incidenciaId: extension.incidenciaId,
      ordenId: orden.id,
      tipo: "incidencia_cancelada",
      detalle: `Incidencia cancelada al anular la orden #${orden.id}`,
      usuarioId: userId,
    });
  }

  revalidatePath("/taller");
  revalidatePath("/taller/bitacora");
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
