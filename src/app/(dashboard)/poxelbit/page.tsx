export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { hasNavPermission } from "@/lib/permissions";
import { getPBModulosAction, getPBStatsAction, getNovedadesPBAction } from "@/app/actions/poxelbit";
import PoxelBitDashboard from "@/components/poxelbit/PoxelBitDashboard";

export default async function PoxelBitPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = user.publicMetadata?.role as string | undefined;
  if (!hasNavPermission(role, "poxelbit")) redirect("/overview");

  const isAdmin = role === "admin";
  const [modulos, stats, novedades] = await Promise.all([
    getPBModulosAction(),
    getPBStatsAction(),
    getNovedadesPBAction(5),
  ]);

  return (
    <PoxelBitDashboard
      modulos={modulos}
      stats={stats}
      novedades={novedades}
      isAdmin={isAdmin}
    />
  );
}
