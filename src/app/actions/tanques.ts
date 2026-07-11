"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tanques, recargasTanque, transferenciasTanque, auditLog, cargas } from "@/db/schema";
import { eq, inArray, gte, lte, and, or, desc } from "drizzle-orm";
import { requireManageRole } from "@/lib/authz";
import { getSiguienteFolioPublic } from "./cargas";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";
import { conciliarTanques } from "@/lib/conciliacion";
import { UMBRAL_TALLER, UMBRAL_NISSAN } from "@/lib/alertas-config";

export type RecargaTanqueInput = {
  tanqueId: number;
  fecha: string;              // "YYYY-MM-DD"
  litros: number;
  cuentalitrosInicio?: number; // A2: lectura ANTES de que llegue la pipa (punto ancla de referencia)
  cuentalitrosNuevo?: number;  // lectura DESPUÉS de la descarga completa
  proveedor?: string;
  folioFactura?: string;
  precioLitro?: number;
  notas?: string;
};

export async function addRecargaTanque(input: RecargaTanqueInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  if (input.litros <= 0) throw new Error("Los litros deben ser mayores a 0");

  const tanque = await db.query.tanques.findFirst({
    where: eq(tanques.id, input.tanqueId),
  });
  if (!tanque) throw new Error("Tanque no encontrado");

  const nuevosLitros = Math.min(
    tanque.capacidadMax,
    (tanque.litrosActuales ?? 0) + input.litros
  );

  await db.insert(recargasTanque).values({
    tanqueId:          input.tanqueId,
    fecha:             input.fecha,
    litros:            input.litros,
    proveedor:         input.proveedor         ?? null,
    folioFactura:      input.folioFactura      ?? null,
    precioLitro:       input.precioLitro       ?? null,
    cuentalitrosInicio: input.cuentalitrosInicio ?? null,
    registradoPorId:   userId,
    notas:             input.notas             ?? null,
  });

  await db
    .update(tanques)
    .set({
      litrosActuales: nuevosLitros,
      cuentalitrosActual:
        input.cuentalitrosNuevo ?? tanque.cuentalitrosActual,
      ultimaActualizacion: new Date(),
    })
    .where(eq(tanques.id, input.tanqueId));

  await pusherServer
    .trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: tanque.nombre,
      litrosActuales: nuevosLitros,
    })
    .catch(() => {});

  revalidatePath("/overview");
  return { ok: true, litrosActuales: nuevosLitros };
}

// ─── Transferir entre tanques (ej. Taller → NISSAN) ──────────────────────────
export type TransferenciaInput = {
  tanqueOrigenId: number;
  tanqueDestinoId: number;
  litros: number;
  fecha: string; // "YYYY-MM-DD"
  notas?: string;
  cuentalitrosOrigen?: number; // Lectura inicial del cuentalitros de taller (bomba) antes de la transferencia
};

export async function transferirEntreTanques(input: TransferenciaInput) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  if (input.litros <= 0) throw new Error("Los litros deben ser mayores a 0");
  if (input.tanqueOrigenId === input.tanqueDestinoId)
    throw new Error("El origen y destino no pueden ser el mismo tanque");

  const [origen, destino] = await db
    .select()
    .from(tanques)
    .where(inArray(tanques.id, [input.tanqueOrigenId, input.tanqueDestinoId]))
    .then((rows) => [
      rows.find((r) => r.id === input.tanqueOrigenId),
      rows.find((r) => r.id === input.tanqueDestinoId),
    ]);

  if (!origen) throw new Error("Tanque origen no encontrado");
  if (!destino) throw new Error("Tanque destino no encontrado");
  if ((origen.litrosActuales ?? 0) < input.litros)
    throw new Error(
      `Stock insuficiente en ${origen.nombre}. Disponible: ${origen.litrosActuales?.toFixed(0)} L`
    );

  const nuevosLitrosOrigen = (origen.litrosActuales ?? 0) - input.litros;
  const nuevosLitrosDestino = Math.min(
    destino.capacidadMax,
    (destino.litrosActuales ?? 0) + input.litros
  );
  // Cuentalitros taller (bomba): si el usuario ingresó lectura manual, usar inicio+litros; si no, auto-incrementar
  const tallerInicio = input.cuentalitrosOrigen ?? null;
  const nuevoCuentalitrosOrigen = tallerInicio !== null
    ? tallerInicio + input.litros
    : (origen.cuentalitrosActual ?? 0) + input.litros;

  // Solo para el registro histórico — NO se actualiza el cuentalitros de la NISSAN
  const cuentaInicio = tallerInicio;
  const cuentaFin    = tallerInicio !== null ? tallerInicio + input.litros : null;

  // El folio de transferencia es parte de la misma secuencia que cargas patio
  const folio = await getSiguienteFolioPublic();

  // Actualizar ambos tanques + insertar registro
  await Promise.all([
    db
      .update(tanques)
      .set({
        litrosActuales: nuevosLitrosOrigen,
        cuentalitrosActual: nuevoCuentalitrosOrigen,
        ultimaActualizacion: new Date(),
      })
      .where(eq(tanques.id, input.tanqueOrigenId)),
    db
      .update(tanques)
      .set({
        litrosActuales: nuevosLitrosDestino,
        ultimaActualizacion: new Date(),
      })
      .where(eq(tanques.id, input.tanqueDestinoId)),
    db.insert(transferenciasTanque).values({
      folio,
      fecha: input.fecha,
      litros: input.litros,
      tanqueOrigenId: input.tanqueOrigenId,
      tanqueDestinoId: input.tanqueDestinoId,
      cuentalitrosNissanInicio: cuentaInicio,
      cuentalitrosDestino:      cuentaFin,
      registradoPorId: userId,
      notas: input.notas ?? null,
    }),
  ]);

  // Notificar ambos tanques vía Pusher
  await Promise.allSettled([
    pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: origen.nombre,
      litrosActuales: nuevosLitrosOrigen,
      cuentalitros: nuevoCuentalitrosOrigen,
    }),
    pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: destino.nombre,
      litrosActuales: nuevosLitrosDestino,
    }),
  ]);

  revalidatePath("/overview");
  revalidatePath("/cargas");
  return {
    ok: true,
    folio,
    origen: {
      nombre: origen.nombre,
      litrosActuales: nuevosLitrosOrigen,
      cuentalitros: nuevoCuentalitrosOrigen,
    },
    destino: { nombre: destino.nombre, litrosActuales: nuevosLitrosDestino },
  };
}

// ─── Editar configuración de tanque ──────────────────────────────────────────
export async function updateTanque(
  id: number,
  data: { nombre?: string; capacidadMax?: number; ajustePorcentaje?: number }
) {
  await requireManageRole();

  const patch: Record<string, unknown> = {};
  if (data.nombre !== undefined) patch.nombre = data.nombre.trim();
  if (data.capacidadMax !== undefined) {
    if (data.capacidadMax <= 0) throw new Error("La capacidad debe ser mayor a 0");
    patch.capacidadMax = data.capacidadMax;
  }
  if (data.ajustePorcentaje !== undefined) patch.ajustePorcentaje = data.ajustePorcentaje;

  if (Object.keys(patch).length === 0) return { ok: true };

  await db.update(tanques).set(patch).where(eq(tanques.id, id));

  revalidatePath("/overview");
  revalidatePath("/settings");
  return { ok: true };
}

// ─── Editar recarga ────────────────────────────────────────────────────────────
export async function updateRecargaTanque(
  id: number,
  data: {
    fecha?: string;
    litros?: number;
    proveedor?: string | null;
    folioFactura?: string | null;
    precioLitro?: number | null;
    cuentalitrosInicio?: number | null;
    notas?: string | null;
  }
) {
  await requireManageRole();

  const recarga = await db.query.recargasTanque.findFirst({
    where: eq(recargasTanque.id, id),
  });
  if (!recarga) throw new Error("Recarga no encontrada");

  const litrosNuevos = data.litros ?? recarga.litros;
  if (litrosNuevos <= 0) throw new Error("Los litros deben ser mayores a 0");

  const tanque = await db.query.tanques.findFirst({
    where: eq(tanques.id, recarga.tanqueId),
  });
  if (!tanque) throw new Error("Tanque no encontrado");

  const delta = litrosNuevos - recarga.litros;
  const nuevoBalance = (tanque.litrosActuales ?? 0) + delta;

  if (nuevoBalance < 0)
    throw new Error(
      `No se puede reducir: el balance resultante sería negativo (${nuevoBalance.toFixed(0)} L). ` +
        `Se han consumido más litros de los que la recarga corregida habría aportado.`
    );

  await db
    .update(recargasTanque)
    .set({
      fecha:              data.fecha               !== undefined ? data.fecha               : recarga.fecha,
      litros:             litrosNuevos,
      proveedor:          data.proveedor           !== undefined ? data.proveedor           : recarga.proveedor,
      folioFactura:       data.folioFactura        !== undefined ? data.folioFactura        : recarga.folioFactura,
      precioLitro:        data.precioLitro         !== undefined ? data.precioLitro         : recarga.precioLitro,
      cuentalitrosInicio: data.cuentalitrosInicio  !== undefined ? data.cuentalitrosInicio  : recarga.cuentalitrosInicio,
      notas:              data.notas               !== undefined ? data.notas               : recarga.notas,
    })
    .where(eq(recargasTanque.id, id));

  if (delta !== 0) {
    const litrosAjustados = Math.min(tanque.capacidadMax, nuevoBalance);
    await db
      .update(tanques)
      .set({ litrosActuales: litrosAjustados, ultimaActualizacion: new Date() })
      .where(eq(tanques.id, recarga.tanqueId));

    await pusherServer
      .trigger(CHANNELS.stock, EVENTS.stockActualizado, {
        tanque: tanque.nombre,
        litrosActuales: litrosAjustados,
      })
      .catch(() => {});
  }

  revalidatePath("/overview");
  revalidatePath("/cargas");
  return { ok: true };
}

// ─── Eliminar recarga ─────────────────────────────────────────────────────────
export async function deleteRecargaTanque(id: number) {
  const { userId } = await requireManageRole();

  const recarga = await db.query.recargasTanque.findFirst({
    where: eq(recargasTanque.id, id),
  });
  if (!recarga) throw new Error("Recarga no encontrada");

  const tanque = await db.query.tanques.findFirst({
    where: eq(tanques.id, recarga.tanqueId),
  });
  if (!tanque) throw new Error("Tanque no encontrado");

  const nuevoBalance = (tanque.litrosActuales ?? 0) - recarga.litros;
  if (nuevoBalance < 0)
    throw new Error(
      `No se puede eliminar: el balance resultante sería negativo (${nuevoBalance.toFixed(0)} L). ` +
        `Esos litros ya fueron consumidos.`
    );

  // Snapshot completo antes de borrar — permite reconstruir la recarga si fue un error
  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "delete",
    entidad: "recarga_tanque",
    entidadId: String(id),
    datosJson: JSON.stringify(recarga),
  });

  await db.delete(recargasTanque).where(eq(recargasTanque.id, id));

  await db
    .update(tanques)
    .set({ litrosActuales: nuevoBalance, ultimaActualizacion: new Date() })
    .where(eq(tanques.id, recarga.tanqueId));

  await pusherServer
    .trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: tanque.nombre,
      litrosActuales: nuevoBalance,
    })
    .catch(() => {});

  revalidatePath("/overview");
  revalidatePath("/cargas");
}

// ─── Editar transferencia ─────────────────────────────────────────────────────
export async function updateTransferencia(
  id: number,
  data: {
    fecha?: string;
    litros?: number;
    notas?: string | null;
    cuentalitrosNissanInicio?: number | null;
    cuentalitrosDestino?: number | null;
  }
) {
  await requireManageRole();

  const transferencia = await db.query.transferenciasTanque.findFirst({
    where: eq(transferenciasTanque.id, id),
  });
  if (!transferencia) throw new Error("Transferencia no encontrada");

  const litrosNuevos = data.litros ?? transferencia.litros;
  if (litrosNuevos <= 0) throw new Error("Los litros deben ser mayores a 0");

  const delta = litrosNuevos - transferencia.litros;

  if (delta !== 0) {
    const [origen, destino] = await db
      .select()
      .from(tanques)
      .where(inArray(tanques.id, [transferencia.tanqueOrigenId, transferencia.tanqueDestinoId]))
      .then((rows) => [
        rows.find((r) => r.id === transferencia.tanqueOrigenId),
        rows.find((r) => r.id === transferencia.tanqueDestinoId),
      ]);

    if (!origen || !destino) throw new Error("Tanques no encontrados");

    const nuevoBalanceOrigen  = (origen.litrosActuales  ?? 0) - delta;
    const nuevoBalanceDestino = (destino.litrosActuales ?? 0) + delta;

    if (nuevoBalanceOrigen < 0)
      throw new Error(
        `Stock insuficiente en ${origen.nombre} para incrementar la transferencia. ` +
          `Disponible: ${origen.litrosActuales?.toFixed(0)} L`
      );
    if (nuevoBalanceDestino < 0)
      throw new Error(
        `No se puede reducir la transferencia: el balance en ${destino.nombre} resultaría negativo.`
      );

    const litrosOrigenFinal  = Math.max(0, nuevoBalanceOrigen);
    const litrosDestinoFinal = Math.min(destino.capacidadMax, nuevoBalanceDestino);

    await Promise.all([
      db.update(tanques).set({
        litrosActuales:     litrosOrigenFinal,
        cuentalitrosActual: (origen.cuentalitrosActual ?? 0) + delta,
        ultimaActualizacion: new Date(),
      }).where(eq(tanques.id, transferencia.tanqueOrigenId)),
      db.update(tanques).set({
        litrosActuales: litrosDestinoFinal,
        ...(data.cuentalitrosDestino !== undefined ? { cuentalitrosActual: data.cuentalitrosDestino } : {}),
        ultimaActualizacion: new Date(),
      }).where(eq(tanques.id, transferencia.tanqueDestinoId)),
      db.update(transferenciasTanque).set({
        fecha:                    data.fecha !== undefined ? data.fecha : transferencia.fecha,
        litros:                   litrosNuevos,
        notas:                    data.notas !== undefined ? data.notas : transferencia.notas,
        cuentalitrosNissanInicio: data.cuentalitrosNissanInicio !== undefined ? data.cuentalitrosNissanInicio : transferencia.cuentalitrosNissanInicio,
        cuentalitrosDestino:      data.cuentalitrosDestino !== undefined ? data.cuentalitrosDestino : transferencia.cuentalitrosDestino,
      }).where(eq(transferenciasTanque.id, id)),
    ]);

    await Promise.allSettled([
      pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
        tanque: origen.nombre,  litrosActuales: litrosOrigenFinal,
      }),
      pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
        tanque: destino.nombre, litrosActuales: litrosDestinoFinal,
      }),
    ]);
  } else {
    // Solo fecha/notas/cuentalitros cambian, sin tocar litros de tanques
    await db.update(transferenciasTanque).set({
      fecha:                    data.fecha !== undefined ? data.fecha : transferencia.fecha,
      notas:                    data.notas !== undefined ? data.notas : transferencia.notas,
      cuentalitrosNissanInicio: data.cuentalitrosNissanInicio !== undefined ? data.cuentalitrosNissanInicio : transferencia.cuentalitrosNissanInicio,
      cuentalitrosDestino:      data.cuentalitrosDestino !== undefined ? data.cuentalitrosDestino : transferencia.cuentalitrosDestino,
    }).where(eq(transferenciasTanque.id, id));

    if (data.cuentalitrosDestino !== undefined) {
      await db.update(tanques)
        .set({ cuentalitrosActual: data.cuentalitrosDestino ?? undefined, ultimaActualizacion: new Date() })
        .where(eq(tanques.id, transferencia.tanqueDestinoId));
    }
  }

  revalidatePath("/overview");
  revalidatePath("/cargas");
  return { ok: true };
}

// ─── Eliminar transferencia ───────────────────────────────────────────────────
export async function deleteTransferencia(id: number) {
  const { userId } = await requireManageRole();

  const transferencia = await db.query.transferenciasTanque.findFirst({
    where: eq(transferenciasTanque.id, id),
  });
  if (!transferencia) throw new Error("Transferencia no encontrada");

  const [origen, destino] = await db
    .select()
    .from(tanques)
    .where(inArray(tanques.id, [transferencia.tanqueOrigenId, transferencia.tanqueDestinoId]))
    .then((rows) => [
      rows.find((r) => r.id === transferencia.tanqueOrigenId),
      rows.find((r) => r.id === transferencia.tanqueDestinoId),
    ]);

  if (!origen || !destino) throw new Error("Tanques no encontrados");

  const nuevoBalanceDestino = (destino.litrosActuales ?? 0) - transferencia.litros;
  if (nuevoBalanceDestino < 0)
    throw new Error(
      `No se puede eliminar: el balance en ${destino.nombre} resultaría negativo. ` +
        `Esos litros ya fueron consumidos.`
    );

  const litrosOrigenRestaurado = Math.min(
    origen.capacidadMax,
    (origen.litrosActuales ?? 0) + transferencia.litros
  );

  // Snapshot completo antes de borrar — permite reconstruir la transferencia si fue un error
  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "delete",
    entidad: "transferencia_tanque",
    entidadId: String(id),
    datosJson: JSON.stringify(transferencia),
  });

  await Promise.all([
    db.delete(transferenciasTanque).where(eq(transferenciasTanque.id, id)),
    db.update(tanques).set({
      litrosActuales:     litrosOrigenRestaurado,
      cuentalitrosActual: Math.max(0, (origen.cuentalitrosActual ?? 0) - transferencia.litros),
      ultimaActualizacion: new Date(),
    }).where(eq(tanques.id, transferencia.tanqueOrigenId)),
    db.update(tanques).set({
      litrosActuales: nuevoBalanceDestino,
      ultimaActualizacion: new Date(),
    }).where(eq(tanques.id, transferencia.tanqueDestinoId)),
  ]);

  await Promise.allSettled([
    pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: origen.nombre,  litrosActuales: litrosOrigenRestaurado,
    }),
    pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: destino.nombre, litrosActuales: nuevoBalanceDestino,
    }),
  ]);

  revalidatePath("/overview");
  revalidatePath("/cargas");
}

// ─── Historial de recargas ────────────────────────────────────────────────────
export async function getRecargasTanque(
  limit = 150,
  opts?: { fechaDesde?: string; fechaHasta?: string }
) {
  const rows = await db.query.recargasTanque.findMany({
    where: opts?.fechaDesde || opts?.fechaHasta
      ? (r, { gte: _gte, lte: _lte, and: _and }) => {
          const conds = [];
          if (opts?.fechaDesde) conds.push(_gte(r.fecha, opts.fechaDesde!));
          if (opts?.fechaHasta) conds.push(_lte(r.fecha, opts.fechaHasta!));
          return conds.length ? _and(...conds) : undefined;
        }
      : undefined,
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    limit,
    with: { tanque: true },
  });
  return rows.map((r) => ({
    ...r,
    tanqueNombre: r.tanque?.nombre ?? `Tanque ${r.tanqueId}`,
  }));
}

// ─────────────────────────────────────────────────────────────
// HISTORIAL DE TRANSFERENCIAS
// ─────────────────────────────────────────────────────────────
export async function getTransferencias(
  limit = 100,
  opts?: { fechaDesde?: string; fechaHasta?: string }
) {
  const rows = await db.query.transferenciasTanque.findMany({
    where: opts?.fechaDesde || opts?.fechaHasta
      ? (t, { gte: _gte, lte: _lte, and: _and }) => {
          const conds = [];
          if (opts?.fechaDesde) conds.push(_gte(t.fecha, opts.fechaDesde!));
          if (opts?.fechaHasta) conds.push(_lte(t.fecha, opts.fechaHasta!));
          return conds.length ? _and(...conds) : undefined;
        }
      : undefined,
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
  });
  // Enriquecer con nombres de tanque (evita join manual)
  const tanquesRows = await db.select({ id: tanques.id, nombre: tanques.nombre }).from(tanques);
  const byId = Object.fromEntries(tanquesRows.map((t) => [t.id, t.nombre]));
  return rows.map((r) => ({
    ...r,
    origenNombre: byId[r.tanqueOrigenId] ?? `Tanque ${r.tanqueOrigenId}`,
    destinoNombre: byId[r.tanqueDestinoId] ?? `Tanque ${r.tanqueDestinoId}`,
  }));
}

// ─── Tipos para la página de tanques ─────────────────────────────────────────
export type EventoTimeline = {
  id: string;
  fecha: string;
  tipo: "recarga" | "transferencia_salida" | "transferencia_entrada" | "consumo_dia" | "ajuste";
  litros: number;
  detalle: string;
  notas: string | null;
  folio?: number | null;
  proveedor?: string | null;
  precioLitro?: number | null;
  folioFactura?: string | null;
};

export type EstadisticasTanque = {
  promedioDiario7d: number;
  promedioDiario30d: number;
  totalConsumo7d: number;
  totalConsumo30d: number;
  totalRecargado30d: number;
  costoPromedioLitro: number | null;
  totalCostoEstimado30d: number | null;
  diasHastaUmbral: number | null;
  fechaProyectadaUmbral: string | null;
};

export type TanqueDetalle = {
  id: number;
  nombre: string;
  capacidadMax: number;
  litrosActuales: number;
  cuentalitrosActual: number;
  ajustePorcentaje: number;
  ultimaActualizacion: string | null;
  umbral: number;
  timeline: EventoTimeline[];
  estadisticas: EstadisticasTanque;
  conciliacion: {
    actual: number;
    teorico: number;
    diferencia: number;
    tolerancia: number;
    ok: boolean;
    anclaFecha: string | null;
    anclaLitros: number;
  };
};

// ─── Detalle completo de todos los tanques (para /tanques) ───────────────────
export async function getTanquesDetalle(): Promise<TanqueDetalle[]> {
  const tanquesData = await db.select().from(tanques);
  const conciliaciones = await conciliarTanques();

  const ahora = new Date();
  const hace30 = new Date(ahora); hace30.setDate(hace30.getDate() - 30);
  const hace7  = new Date(ahora); hace7.setDate(hace7.getDate() - 7);
  const hace30Str = hace30.toISOString().split("T")[0];
  const hace7Str  = hace7.toISOString().split("T")[0];

  return Promise.all(
    tanquesData.map(async (t) => {
      const conc = conciliaciones.find((c) => c.tanqueId === t.id) ?? {
        tanqueId: t.id, nombre: t.nombre,
        actual: t.litrosActuales ?? 0, teorico: t.litrosActuales ?? 0,
        diferencia: 0, tolerancia: 0, ok: true,
        anclaFecha: null, anclaLitros: 0,
      };

      const [recargas, transferencias, cargasData, ajustesAudit] = await Promise.all([
        db.query.recargasTanque.findMany({
          where: (r, { eq: _eq }) => _eq(r.tanqueId, t.id),
          orderBy: (r, { desc: _desc }) => [_desc(r.fecha), _desc(r.createdAt)],
          limit: 60,
        }),
        db.select().from(transferenciasTanque)
          .where(or(
            eq(transferenciasTanque.tanqueOrigenId, t.id),
            eq(transferenciasTanque.tanqueDestinoId, t.id),
          ))
          .orderBy(desc(transferenciasTanque.fecha))
          .limit(60),
        db.select({ fecha: cargas.fecha, litros: cargas.litros })
          .from(cargas)
          .where(and(eq(cargas.tanqueId, t.id), gte(cargas.fecha, hace30Str))),
        db.select().from(auditLog)
          .where(and(
            eq(auditLog.accion, "ajuste_stock"),
            eq(auditLog.entidad, "tanques"),
            eq(auditLog.entidadId, String(t.id)),
          ))
          .orderBy(desc(auditLog.createdAt))
          .limit(20),
      ]);

      // Nombres de tanques para transferencias
      const tanquesNombres = Object.fromEntries(tanquesData.map((tt) => [tt.id, tt.nombre]));

      // Construir timeline
      const timeline: EventoTimeline[] = [];

      for (const r of recargas) {
        timeline.push({
          id: `rec_${r.id}`,
          fecha: r.fecha,
          tipo: "recarga",
          litros: r.litros,
          detalle: r.proveedor ? `Pipa ${r.proveedor}` : "Recarga de pipa",
          notas: r.notas,
          proveedor: r.proveedor,
          precioLitro: r.precioLitro,
          folioFactura: r.folioFactura,
        });
      }

      for (const tr of transferencias) {
        if (tr.tanqueOrigenId === t.id) {
          timeline.push({
            id: `tr_out_${tr.id}`,
            fecha: tr.fecha,
            tipo: "transferencia_salida",
            litros: tr.litros,
            detalle: `→ ${tanquesNombres[tr.tanqueDestinoId] ?? `Tanque ${tr.tanqueDestinoId}`}`,
            notas: tr.notas,
            folio: tr.folio,
          });
        } else {
          timeline.push({
            id: `tr_in_${tr.id}`,
            fecha: tr.fecha,
            tipo: "transferencia_entrada",
            litros: tr.litros,
            detalle: `← ${tanquesNombres[tr.tanqueOrigenId] ?? `Tanque ${tr.tanqueOrigenId}`}`,
            notas: tr.notas,
            folio: tr.folio,
          });
        }
      }

      // Cargas agrupadas por fecha
      const cargasPorFecha = new Map<string, number>();
      for (const c of cargasData) {
        cargasPorFecha.set(c.fecha, (cargasPorFecha.get(c.fecha) ?? 0) + (c.litros ?? 0));
      }
      for (const [fecha, litrosDia] of cargasPorFecha) {
        timeline.push({
          id: `cons_${t.id}_${fecha}`,
          fecha,
          tipo: "consumo_dia",
          litros: litrosDia,
          detalle: "Consumo del día",
          notas: null,
        });
      }

      for (const aj of ajustesAudit) {
        let datos: { antes?: number; despues?: number; notas?: string } = {};
        try { datos = JSON.parse(aj.datosJson ?? "{}"); } catch { /* ignore */ }
        timeline.push({
          id: `adj_${aj.id}`,
          fecha: aj.createdAt!.toISOString().split("T")[0],
          tipo: "ajuste",
          litros: datos.despues ?? 0,
          detalle: "Ajuste de inventario",
          notas: datos.notas ?? null,
        });
      }

      timeline.sort((a, b) => {
        const d = b.fecha.localeCompare(a.fecha);
        return d !== 0 ? d : b.id.localeCompare(a.id);
      });

      // Estadísticas
      const totalConsumo30d = cargasData.reduce((s, c) => s + (c.litros ?? 0), 0);
      const totalConsumo7d  = cargasData
        .filter((c) => c.fecha >= hace7Str)
        .reduce((s, c) => s + (c.litros ?? 0), 0);

      const promedioDiario7d  = totalConsumo7d  / 7;
      const promedioDiario30d = totalConsumo30d / 30;

      const recargasRecientes = recargas.filter((r) => r.fecha >= hace30Str);
      const totalRecargado30d = recargasRecientes.reduce((s, r) => s + r.litros, 0);

      const recargasConPrecio = recargasRecientes.filter((r) => r.precioLitro && r.precioLitro > 0);
      const costoPromedioLitro = recargasConPrecio.length > 0
        ? recargasConPrecio.reduce((s, r) => s + r.precioLitro!, 0) / recargasConPrecio.length
        : null;
      const totalCostoEstimado30d = costoPromedioLitro !== null ? totalConsumo30d * costoPromedioLitro : null;

      const umbral = t.nombre === "NISSAN" ? UMBRAL_NISSAN : UMBRAL_TALLER;
      const litrosActuales = t.litrosActuales ?? 0;
      const diasHastaUmbral = promedioDiario7d > 0
        ? Math.max(0, (litrosActuales - umbral) / promedioDiario7d)
        : null;
      const fechaProyectadaUmbral = diasHastaUmbral !== null
        ? (() => {
            const d = new Date();
            d.setDate(d.getDate() + Math.floor(diasHastaUmbral));
            return d.toISOString().split("T")[0];
          })()
        : null;

      return {
        id: t.id,
        nombre: t.nombre,
        capacidadMax: t.capacidadMax,
        litrosActuales,
        cuentalitrosActual: t.cuentalitrosActual ?? 0,
        ajustePorcentaje: t.ajustePorcentaje ?? 2,
        ultimaActualizacion: t.ultimaActualizacion?.toISOString() ?? null,
        umbral,
        timeline: timeline.slice(0, 100),
        estadisticas: {
          promedioDiario7d,
          promedioDiario30d,
          totalConsumo7d,
          totalConsumo30d,
          totalRecargado30d,
          costoPromedioLitro,
          totalCostoEstimado30d,
          diasHastaUmbral,
          fechaProyectadaUmbral,
        },
        conciliacion: {
          actual:      conc.actual,
          teorico:     conc.teorico,
          diferencia:  conc.diferencia,
          tolerancia:  conc.tolerancia,
          ok:          conc.ok,
          anclaFecha:  conc.anclaFecha,
          anclaLitros: conc.anclaLitros,
        },
      };
    }),
  );
}

// ─── Ajuste manual de stock (ancla para conciliación) ────────────────────────
export async function ajustarStockTanque(
  tanqueId: number,
  litrosMedidos: number,
  notas?: string,
) {
  const { userId } = await requireManageRole();

  const tanque = await db.query.tanques.findFirst({ where: eq(tanques.id, tanqueId) });
  if (!tanque) throw new Error("Tanque no encontrado");
  if (litrosMedidos < 0) throw new Error("Los litros no pueden ser negativos");
  if (litrosMedidos > tanque.capacidadMax)
    throw new Error(`Los litros superan la capacidad máxima (${tanque.capacidadMax.toLocaleString()} L)`);

  const antes = tanque.litrosActuales ?? 0;

  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "ajuste_stock",
    entidad: "tanques",
    entidadId: String(tanqueId),
    datosJson: JSON.stringify({ antes, despues: litrosMedidos, notas: notas ?? null }),
  });

  await db.update(tanques)
    .set({ litrosActuales: litrosMedidos, ultimaActualizacion: new Date() })
    .where(eq(tanques.id, tanqueId));

  await pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
    tanque: tanque.nombre,
    litrosActuales: litrosMedidos,
  }).catch(() => {});

  revalidatePath("/overview");
  revalidatePath("/tanques");
  return { ok: true, antes, despues: litrosMedidos };
}
