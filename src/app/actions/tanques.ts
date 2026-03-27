"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tanques, recargasTanque, transferenciasTanque } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { pusherServer, CHANNELS, EVENTS } from "@/lib/pusher-server";

export type RecargaTanqueInput = {
  tanqueId: number;
  fecha: string;          // "YYYY-MM-DD"
  litros: number;
  cuentalitrosNuevo?: number;
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
    tanqueId: input.tanqueId,
    fecha: input.fecha,
    litros: input.litros,
    proveedor: input.proveedor ?? null,
    folioFactura: input.folioFactura ?? null,
    precioLitro: input.precioLitro ?? null,
    registradoPorId: userId,
    notas: input.notas ?? null,
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

  // Actualizar ambos tanques + insertar registro
  await Promise.all([
    db
      .update(tanques)
      .set({ litrosActuales: nuevosLitrosOrigen, ultimaActualizacion: new Date() })
      .where(eq(tanques.id, input.tanqueOrigenId)),
    db
      .update(tanques)
      .set({ litrosActuales: nuevosLitrosDestino, ultimaActualizacion: new Date() })
      .where(eq(tanques.id, input.tanqueDestinoId)),
    db.insert(transferenciasTanque).values({
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
    }),
    pusherServer.trigger(CHANNELS.stock, EVENTS.stockActualizado, {
      tanque: destino.nombre,
      litrosActuales: nuevosLitrosDestino,
    }),
  ]);

  revalidatePath("/overview");
  return {
    ok: true,
    origen: { nombre: origen.nombre, litrosActuales: nuevosLitrosOrigen },
    destino: { nombre: destino.nombre, litrosActuales: nuevosLitrosDestino },
  };
}
