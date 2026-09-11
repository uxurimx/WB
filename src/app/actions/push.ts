"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function subscribePush(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    throw new Error("Suscripción inválida");
  }

  await db
    .insert(pushSubscriptions)
    .values({
      usuarioId: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { usuarioId: userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });

  return { ok: true };
}

export async function unsubscribePush(endpoint: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  return { ok: true };
}
