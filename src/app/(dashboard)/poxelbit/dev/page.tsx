export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { isPoxelbitDevAccount } from "@/lib/poxelbit-dev-agent-auth";
import { getPoxelbitDevAgentConfig } from "@/lib/poxelbit-dev-agent";
import PoxelbitDevAgentClient from "@/components/poxelbit/PoxelbitDevAgentClient";

export default async function PoxelbitDevPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  if (!isPoxelbitDevAccount(user)) redirect("/overview");

  return <PoxelbitDevAgentClient config={getPoxelbitDevAgentConfig()} />;
}
