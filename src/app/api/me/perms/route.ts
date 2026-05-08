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

  try {
    // DB es la fuente de verdad
    const rol = await db.query.roles.findFirst({ where: eq(roles.id, role) });
    if (rol) {
      return NextResponse.json({ permisos: JSON.parse(rol.permisos) as NavPermission[] });
    }
  } catch {
    // Neon transient error — usar config estática
  }

  return NextResponse.json({ permisos: ROLE_NAV_PERMISSIONS[role] ?? [] });
}
