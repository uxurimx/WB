import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!body?.sessionId || !body?.type) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await db.insert(analyticsEvents).values({
      sessionId: String(body.sessionId),
      type: String(body.type),
      element: body.element ? String(body.element).slice(0, 200) : null,
      xPct: typeof body.xPct === "number" ? body.xPct : null,
      yPct: typeof body.yPct === "number" ? body.yPct : null,
      value: body.value !== undefined ? String(body.value).slice(0, 200) : null,
    });
  } catch {
    // silently fail
  }

  return NextResponse.json({ ok: true });
}
