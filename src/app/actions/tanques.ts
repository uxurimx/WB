"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { tanques, recargasTanque } from "@/db/schema";
import { eq } from "drizzle-orm";
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
