import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { analyticsSessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

function hashIp(ip: string): string {
  // Keep only first 2 octets for privacy (e.g. 192.168.x.x → "192.168")
  const parts = ip.replace("::ffff:", "").split(".");
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : ip.split(":")[0];
}

async function parseBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    const text = await req.text();
    try { return JSON.parse(text); } catch { return null; }
  }
}

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  if (!body?.sessionId) return NextResponse.json({ ok: false }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";

  try {
    if (body._update) {
      await db
        .update(analyticsSessions)
        .set({
          durationSeconds: typeof body.duration === "number" ? body.duration : null,
          maxScrollPct: typeof body.maxScrollPct === "number" ? body.maxScrollPct : 0,
          bounced: body.bounced === true,
          endedAt: new Date(),
        })
        .where(eq(analyticsSessions.sessionId, body.sessionId));
    } else {
      await db
        .insert(analyticsSessions)
        .values({
          sessionId: body.sessionId,
          deviceType: body.deviceType ?? null,
          browser: body.browser ?? null,
          os: body.os ?? null,
          screenW: typeof body.screenW === "number" ? body.screenW : null,
          screenH: typeof body.screenH === "number" ? body.screenH : null,
          referrer: body.referrer ?? null,
          ipHash: hashIp(ip),
        })
        .onConflictDoNothing();
    }
  } catch {
    // silently fail — analytics should never break the user experience
  }

  return NextResponse.json({ ok: true });
}
