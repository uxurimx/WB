import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Roles válidos del sistema
const VALID_ROLES = [
  "admin",
  "gerente",
  "despachador",
  "operador_nissan",
  "encargado_obra",
  "chofer",
] as const;

type Role = (typeof VALID_ROLES)[number];

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Solo admins pueden invitar
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await req.json();
  const { email, role = "despachador" } = body as { email: string; role: Role };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const client = await clerkClient();

  const invitation = await client.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role },
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`,
    ignoreExisting: false,
  });

  return NextResponse.json({
    success: true,
    id: invitation.id,
    email,
    role,
  });
}

// Listar invitaciones pendientes (solo admin)
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const client = await clerkClient();
  const invitations = await client.invitations.getInvitationList({
    status: "pending",
  });

  return NextResponse.json({ invitations: invitations.data });
}
