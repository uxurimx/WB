import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ROLE_NAV_PERMISSIONS, type NavPermission } from "@/lib/permissions";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ permisos: [] });

  const clerkUser = await currentUser();
  const role = clerkUser?.publicMetadata?.role as string | undefined;
  if (!role) return NextResponse.json({ permisos: [] });

  const rol = await db.query.roles.findFirst({ where: eq(roles.id, role) });
  if (rol) {
    const dbPerms = JSON.parse(rol.permisos) as NavPermission[];
    // Asegura que permisos nuevos del config estático estén presentes en roles sistema
    if (rol.isSystem) {
      const staticPerms = ROLE_NAV_PERMISSIONS[role] ?? [];
      const merged = Array.from(new Set([...dbPerms, ...staticPerms]));
      return NextResponse.json({ permisos: merged });
    }
    return NextResponse.json({ permisos: dbPerms });
  }

  // Fallback: config estática
  return NextResponse.json({ permisos: ROLE_NAV_PERMISSIONS[role] ?? [] });
}
