export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { hasNavPermission } from "@/lib/permissions";
import { getTicketPBAction } from "@/app/actions/poxelbit";
import TicketThreadPB from "@/components/poxelbit/TicketThreadPB";

export default async function PBTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const role = user.publicMetadata?.role as string | undefined;
  if (!hasNavPermission(role, "poxelbit")) redirect("/overview");

  const isAdmin = role === "admin";
  const ticket = await getTicketPBAction(parseInt(id));
  if (!ticket) notFound();

  return <TicketThreadPB ticket={ticket} isAdmin={isAdmin} />;
}
