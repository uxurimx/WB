import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!CLERK_WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET no configurado");
    return NextResponse.json({ error: "Config error" }, { status: 500 });
  }

  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Faltan headers svix" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  // ─── user.created ─────────────────────────────────────────
  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
    const email = email_addresses[0]?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || email;
    const role = (public_metadata?.role as string) ?? "despachador";

    await db.insert(users).values({ id, email, name, role }).onConflictDoNothing();
  }

  // ─── user.updated ─────────────────────────────────────────
  if (evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, public_metadata } = evt.data;
    const email = email_addresses[0]?.email_address ?? "";
    const name = [first_name, last_name].filter(Boolean).join(" ") || email;
    const role = (public_metadata?.role as string) ?? "despachador";

    await db
      .update(users)
      .set({ email, name, role })
      .where(eq(users.id, id));
  }

  // ─── user.deleted ─────────────────────────────────────────
  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    if (id) {
      await db.update(users).set({ activo: false }).where(eq(users.id, id));
    }
  }

  return NextResponse.json({ success: true });
}
