import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ROLE_NAV_PERMISSIONS, mergeRolePermisos, type NavPermission } from "@/lib/permissions";

export const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

export async function requireRole(rolesPermitidos: string[]) {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (!user || !role || !rolesPermitidos.includes(role))
    throw new Error("Sin permisos para realizar esta acción");
  return { userId: user.id, role };
}

export async function requireManageRole() {
  return requireRole(MANAGE_ROLES);
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireMaintenanceManager() {
  return requireRole(MANAGE_ROLES);
}

export async function getActionPermisos(): Promise<{ userId: string; role: string; permisos: NavPermission[] }> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const clerkUser = await currentUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;
  if (!role) throw new Error("Sin permisos para realizar esta acción");

  let permisos: NavPermission[] = ROLE_NAV_PERMISSIONS[role] ?? [];
  try {
    const rolData = await db.query.roles.findFirst({ where: eq(roles.id, role) });
    if (rolData) permisos = mergeRolePermisos(role, JSON.parse(rolData.permisos) as NavPermission[]);
  } catch {
    // Neon transitorio — fallback al mapa estático
  }

  return { userId, role, permisos };
}

export async function requireActionPermission(perm: NavPermission) {
  const ctx = await getActionPermisos();
  if (!ctx.permisos.includes(perm))
    throw new Error("Sin permisos para realizar esta acción");
  return ctx;
}

export async function requireAnyActionPermission(perms: NavPermission[]) {
  const ctx = await getActionPermisos();
  if (!perms.some((p) => ctx.permisos.includes(p)))
    throw new Error("Sin permisos para realizar esta acción");
  return ctx;
}
