import { NextResponse } from "next/server";
import { getDevAgentWorkspaceChanges, getPoxelbitDevAgentConfig } from "@/lib/poxelbit-dev-agent";
import { requirePoxelbitDevAccess } from "@/lib/poxelbit-dev-agent-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requirePoxelbitDevAccess();
  if (access.response) return access.response;
  const config = getPoxelbitDevAgentConfig();
  if (!config.enabled) return NextResponse.json({ error: config.reason }, { status: 503 });
  try {
    return NextResponse.json(getDevAgentWorkspaceChanges(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo revisar el estado de los archivos del proyecto." }, { status: 500 });
  }
}
