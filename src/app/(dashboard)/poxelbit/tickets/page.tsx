export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { hasNavPermission } from "@/lib/permissions";
import { getTicketsPBAction, getPBModulosAction } from "@/app/actions/poxelbit";
import TicketsPBClient from "@/components/poxelbit/TicketsPBClient";

export default async function PBTicketsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = user.publicMetadata?.role as string | undefined;
  if (!hasNavPermission(role, "poxelbit")) redirect("/overview");

  const isAdmin = role === "admin";
  const [tickets, modulosRaw] = await Promise.all([
    getTicketsPBAction(),
    getPBModulosAction(),
  ]);

  const modulos = modulosRaw.map((m) => ({ id: m.id, titulo: m.titulo }));

  return <TicketsPBClient tickets={tickets} modulos={modulos} isAdmin={isAdmin} />;
}
