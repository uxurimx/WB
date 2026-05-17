export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { hasNavPermission } from "@/lib/permissions";
import { getPBModuloAction } from "@/app/actions/poxelbit";
import ModuloDetallePB from "@/components/poxelbit/ModuloDetallePB";

export default async function PBModuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = user.publicMetadata?.role as string | undefined;
  if (!hasNavPermission(role, "poxelbit")) redirect("/overview");

  const isAdmin = role === "admin";
  const modulo = await getPBModuloAction(parseInt(id));
  if (!modulo) notFound();

  return <ModuloDetallePB modulo={modulo} isAdmin={isAdmin} />;
}
