import { NextResponse } from "next/server";
import { getDevAgentThreadSafe, getPoxelbitDevAgentConfig } from "@/lib/poxelbit-dev-agent";
import { requirePoxelbitDevAccess } from "@/lib/poxelbit-dev-agent-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePoxelbitDevAccess();
  if (access.response) return access.response;
  const config = getPoxelbitDevAgentConfig();
  if (!config.enabled) return NextResponse.json({ error: config.reason }, { status: 503 });
  try {
    const { id } = await params;
    const file = await getDevAgentThreadSafe(id);
    if (!file) return NextResponse.json({ error: "No encontramos esa conversación." }, { status: 404 });
    return NextResponse.json(file, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo leer la conversación." }, { status: 400 });
  }
}
