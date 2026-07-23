import { currentUser } from "@clerk/nextjs/server";

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
  return requireRole(["admin", "gerente"]);
}
