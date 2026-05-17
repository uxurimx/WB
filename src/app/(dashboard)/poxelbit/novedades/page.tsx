export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { hasNavPermission } from "@/lib/permissions";
import { getNovedadesPBAction, getPBModulosAction } from "@/app/actions/poxelbit";
import NovedadesPBClient from "@/components/poxelbit/NovedadesPBClient";

export default async function PBNovedadesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = user.publicMetadata?.role as string | undefined;
  if (!hasNavPermission(role, "poxelbit")) redirect("/overview");

  const isAdmin = role === "admin";
  const [novedades, modulosRaw] = await Promise.all([
    getNovedadesPBAction(50),
    getPBModulosAction(),
  ]);

  const modulos = modulosRaw.map((m) => ({ id: m.id, titulo: m.titulo }));

  return <NovedadesPBClient novedades={novedades} modulos={modulos} isAdmin={isAdmin} />;
}
