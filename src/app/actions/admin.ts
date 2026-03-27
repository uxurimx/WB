"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { VALID_ROLES, type Role } from "@/lib/roles";

// ─── Guard ────────────────────────────────────────────────────
async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  const clerkUser = await currentUser();
  if (clerkUser?.publicMetadata?.role !== "admin") throw new Error("Sin permisos de administrador");
  return { userId };
}

// ─── Queries ──────────────────────────────────────────────────
export async function getUsuarios() {
  await requireAdmin();
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getInvitacionesPendientes() {
  await requireAdmin();
  const client = await clerkClient();
  const result = await client.invitations.getInvitationList({
    status: "pending",
    limit: 100,
  });
  return result.data.map((inv) => ({
    id: inv.id,
    emailAddress: inv.emailAddress,
    role: (inv.publicMetadata as { role?: string })?.role ?? "despachador",
    createdAt: inv.createdAt,
  }));
}

// ─── Mutations ────────────────────────────────────────────────
export async function invitarUsuario(email: string, role: string) {
  await requireAdmin();

  if (!email?.trim()) throw new Error("Email es requerido");
  if (!VALID_ROLES.includes(role as Role)) throw new Error("Rol inválido");

  const client = await clerkClient();
  await client.invitations.createInvitation({
    emailAddress: email.trim().toLowerCase(),
    publicMetadata: { role },
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`,
    ignoreExisting: false,
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function revocarInvitacion(invitationId: string) {
  await requireAdmin();

  const client = await clerkClient();
  await client.invitations.revokeInvitation(invitationId);

  revalidatePath("/admin");
  return { ok: true };
}

export async function updateRolUsuario(targetUserId: string, newRole: string) {
  const { userId } = await requireAdmin();

  if (!VALID_ROLES.includes(newRole as Role)) throw new Error("Rol inválido");
  if (targetUserId === userId) throw new Error("No puedes cambiar tu propio rol");

  await db
    .update(users)
    .set({ role: newRole })
    .where(eq(users.id, targetUserId));

  const client = await clerkClient();
  await client.users.updateUserMetadata(targetUserId, {
    publicMetadata: { role: newRole },
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function toggleActivoUsuario(targetUserId: string) {
  const { userId } = await requireAdmin();

  if (targetUserId === userId)
    throw new Error("No puedes desactivar tu propia cuenta");

  const target = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
  });
  if (!target) throw new Error("Usuario no encontrado");

  const client = await clerkClient();

  if (target.activo) {
    await client.users.banUser(targetUserId);
    await db
      .update(users)
      .set({ activo: false })
      .where(eq(users.id, targetUserId));
  } else {
    await client.users.unbanUser(targetUserId);
    await db
      .update(users)
      .set({ activo: true })
      .where(eq(users.id, targetUserId));
  }

  revalidatePath("/admin");
  return { ok: true, nuevoEstado: !target.activo };
}
