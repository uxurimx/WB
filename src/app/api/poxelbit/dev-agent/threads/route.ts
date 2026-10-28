import { NextResponse } from "next/server";
import { createDevAgentThreadSafe, getPoxelbitDevAgentConfig, listDevAgentThreadsSafe } from "@/lib/poxelbit-dev-agent";
import { requirePoxelbitDevAccess } from "@/lib/poxelbit-dev-agent-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const access = await requirePoxelbitDevAccess();
  if (access.response) return access.response;
  const config = getPoxelbitDevAgentConfig();
  if (!config.enabled) return NextResponse.json({ error: config.reason, threads: [] }, { status: 503 });
  try {
    return NextResponse.json({ threads: await listDevAgentThreadsSafe() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No se pudo leer el historial local del agente." }, { status: 500 });
  }
}

export async function POST() {
  const access = await requirePoxelbitDevAccess();
  if (access.response) return access.response;
  const config = getPoxelbitDevAgentConfig();
  if (!config.enabled) return NextResponse.json({ error: config.reason }, { status: 503 });
  try {
    const thread = await createDevAgentThreadSafe(access.user);
    return NextResponse.json({ thread }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo iniciar Codex." }, { status: 503 });
  }
}
