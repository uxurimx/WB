"use server";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { type Role, ROLE_LABELS, isProtectedUserEmail, sortRolesForAdmin } from "@/lib/roles";
import { ROLE_NAV_PERMISSIONS, mergeRolePermisos, type NavPermission } from "@/lib/permissions";

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
  await ensureSystemRoles();
  const selectedRole = await db.query.roles.findFirst({ where: eq(roles.id, role) });
  if (!selectedRole) throw new Error("Rol inválido");

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

  await ensureSystemRoles();
  const selectedRole = await db.query.roles.findFirst({ where: eq(roles.id, newRole) });
  if (!selectedRole) throw new Error("Rol inválido");
  if (targetUserId === userId) throw new Error("No puedes cambiar tu propio rol");

  const target = await db.query.users.findFirst({
    where: eq(users.id, targetUserId),
    columns: { id: true, email: true },
  });
  if (!target) throw new Error("Usuario no encontrado");
  if (isProtectedUserEmail(target.email)) throw new Error("El rol de este usuario está protegido.");

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

// ─── Roles CRUD ───────────────────────────────────────────────
async function ensureSystemRoles() {
  const defaults = Object.entries(ROLE_NAV_PERMISSIONS).map(([id, permisos]) => ({
      id,
      label: ROLE_LABELS[id as Role] ?? id,
      permisos: JSON.stringify(permisos),
      isSystem: true,
    }));
  await db.insert(roles).values(defaults).onConflictDoNothing();
  for (const id of ["taller", "encargado_taller"]) {
    const systemRole = defaults.find((role) => role.id === id);
    if (!systemRole) continue;
    await db.update(roles).set({
      label: systemRole.label,
      permisos: systemRole.permisos,
      isSystem: true,
    }).where(eq(roles.id, id));
  }
}

export async function getRoles() {
  await requireAdmin();
  await ensureSystemRoles();
  const list = await db.select().from(roles);

  return sortRolesForAdmin(list.map((r) => ({
    ...r,
    permisos: mergeRolePermisos(r.id, JSON.parse(r.permisos) as NavPermission[]),
  })));
}

// Restaura los permisos de los roles sistema a los defaults del config
export async function resetSystemRoles() {
  await requireAdmin();
  await ensureSystemRoles();
  for (const [id, permisos] of Object.entries(ROLE_NAV_PERMISSIONS)) {
    await db
      .update(roles)
      .set({ permisos: JSON.stringify(permisos) })
      .where(eq(roles.id, id));
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function createRole(data: { id: string; label: string; permisos: NavPermission[] }) {
  await requireAdmin();
  void data;
  throw new Error("La creación de roles está pausada hasta definir su alcance operativo o gerencial.");
}

export async function updateRolePerms(id: string, permisos: NavPermission[]) {
  await requireAdmin();
  if (id === "taller" || id === "encargado_taller") {
    throw new Error("Los permisos de los roles Taller se administran como configuración de sistema.");
  }
  await db.update(roles).set({ permisos: JSON.stringify(permisos) }).where(eq(roles.id, id));
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteRole(id: string) {
  await requireAdmin();
  await ensureSystemRoles();
  const rol = await db.query.roles.findFirst({ where: eq(roles.id, id) });
  if (!rol) throw new Error("Rol no encontrado");
  if (rol.isSystem) throw new Error("No se puede eliminar un rol del sistema");
  const usuarioAsignado = await db.query.users.findFirst({
    where: eq(users.role, id),
    columns: { id: true },
  });
  if (usuarioAsignado) throw new Error("No se puede eliminar un rol asignado a usuarios.");
  await db.delete(roles).where(eq(roles.id, id));
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
  if (isProtectedUserEmail(target.email)) throw new Error("La cuenta de este usuario está protegida.");

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
