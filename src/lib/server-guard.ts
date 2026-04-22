"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ROLE_NAV_PERMISSIONS, type NavPermission } from "./permissions";

function getHomeUrl(permisos: NavPermission[]): string {
  if (permisos.includes("dashboard"))          return "/overview";
  if (permisos.includes("cargas.nueva_patio")) return "/cargas/nueva";
  if (permisos.includes("cargas.nueva_campo")) return "/cargas/campo";
  if (permisos.includes("cargas.historial"))   return "/cargas";
  return "/sign-in";
}

export async function getServerPermisos(): Promise<NavPermission[]> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;
  if (!role) return [];

  // DB es la fuente de verdad
  const rolData = await db.query.roles.findFirst({ where: eq(roles.id, role) });
  if (rolData) return JSON.parse(rolData.permisos) as NavPermission[];

  // Fallback solo si el rol no existe aún en DB (antes del primer acceso al panel admin)
  return ROLE_NAV_PERMISSIONS[role] ?? [];
}

export async function requirePermission(perm: NavPermission) {
  const permisos = await getServerPermisos();
  if (!permisos.includes(perm)) redirect(getHomeUrl(permisos));
  return permisos;
}
