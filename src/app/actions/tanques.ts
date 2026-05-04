"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tanques, recargasTanque, transferenciasTanque } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSiguienteFolioPublic } from "./cargas";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";

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
  // Solo el tanque origen (Taller) registra la salida en su cuentalitros
  const nuevoCuentalitrosOrigen = (origen.cuentalitrosActual ?? 0) + input.litros;

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
      .set({ litrosActuales: nuevosLitrosDestino, ultimaActualizacion: new Date() })
      .where(eq(tanques.id, input.tanqueDestinoId)),
    db.insert(transferenciasTanque).values({
      folio,
      fecha: input.fecha,
      litros: input.litros,
      tanqueOrigenId: input.tanqueOrigenId,
      tanqueDestinoId: input.tanqueDestinoId,
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
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

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
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

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
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

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
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

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
        ultimaActualizacion: new Date(),
      }).where(eq(tanques.id, transferencia.tanqueDestinoId)),
      db.update(transferenciasTanque).set({
        fecha:  data.fecha !== undefined ? data.fecha : transferencia.fecha,
        litros: litrosNuevos,
        notas:  data.notas !== undefined ? data.notas : transferencia.notas,
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
    // Solo fecha/notas cambian, sin tocar tanques
    await db.update(transferenciasTanque).set({
      fecha: data.fecha !== undefined ? data.fecha : transferencia.fecha,
      notas: data.notas !== undefined ? data.notas : transferencia.notas,
    }).where(eq(transferenciasTanque.id, id));
  }

  revalidatePath("/overview");
  revalidatePath("/cargas");
  return { ok: true };
}

// ─── Eliminar transferencia ───────────────────────────────────────────────────
export async function deleteTransferencia(id: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

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
export async function getRecargasTanque(limit = 150) {
  const rows = await db.query.recargasTanque.findMany({
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
export async function getTransferencias(limit = 100) {
  const rows = await db.query.transferenciasTanque.findMany({
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
