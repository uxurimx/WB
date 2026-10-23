import { NextResponse } from "next/server";
import { getPoxelbitDevAgentConfig } from "@/lib/poxelbit-dev-agent";
import { requirePoxelbitDevAccess } from "@/lib/poxelbit-dev-agent-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requirePoxelbitDevAccess();
  if (access.response) return access.response;
  return NextResponse.json(getPoxelbitDevAgentConfig(), { headers: { "Cache-Control": "no-store" } });
}
