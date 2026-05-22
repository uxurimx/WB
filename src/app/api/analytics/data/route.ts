import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { analyticsSessions, analyticsEvents } from "@/db/schema";
import { eq, desc, count, sql, and, gte, isNotNull, ne } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Math.min(90, Math.max(1, Number(searchParams.get("days") ?? "30")));

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [
    totalRow,
    todayRow,
    avgRow,
    timelineRows,
    deviceRows,
    browserRows,
    scrollRows,
    topClickRows,
    heatmapRows,
    recentRows,
  ] = await Promise.all([
    // Total sessions
    db.select({ count: count() }).from(analyticsSessions),

    // Today sessions
    db.select({ count: count() })
      .from(analyticsSessions)
      .where(sql`DATE(${analyticsSessions.createdAt}) = CURRENT_DATE`),

    // Avg duration, scroll, bounce rate (all time)
    db.select({
      avgDuration: sql<number>`ROUND(AVG(${analyticsSessions.durationSeconds}) FILTER (WHERE ${analyticsSessions.durationSeconds} IS NOT NULL))`,
      avgScroll: sql<number>`ROUND(AVG(${analyticsSessions.maxScrollPct}) FILTER (WHERE ${analyticsSessions.maxScrollPct} IS NOT NULL AND ${analyticsSessions.maxScrollPct} > 0))`,
      bounceRate: sql<number>`CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(*) FILTER (WHERE ${analyticsSessions.bounced} = true)::numeric * 100 / COUNT(*), 1) ELSE 0 END`,
    }).from(analyticsSessions),

    // Timeline: sessions per day for last N days
    db.select({
      date: sql<string>`TO_CHAR(DATE(${analyticsSessions.createdAt}), 'YYYY-MM-DD')`,
      count: count(),
    })
      .from(analyticsSessions)
      .where(gte(analyticsSessions.createdAt, since))
      .groupBy(sql`DATE(${analyticsSessions.createdAt})`)
      .orderBy(sql`DATE(${analyticsSessions.createdAt})`),

    // Device breakdown
    db.select({ type: analyticsSessions.deviceType, count: count() })
      .from(analyticsSessions)
      .where(isNotNull(analyticsSessions.deviceType))
      .groupBy(analyticsSessions.deviceType)
      .orderBy(desc(count())),

    // Browser breakdown
    db.select({ browser: analyticsSessions.browser, count: count() })
      .from(analyticsSessions)
      .where(isNotNull(analyticsSessions.browser))
      .groupBy(analyticsSessions.browser)
      .orderBy(desc(count())),

    // Scroll funnel: unique sessions per milestone
    db.select({
      milestone: analyticsEvents.value,
      sessions: sql<number>`COUNT(DISTINCT ${analyticsEvents.sessionId})`,
    })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.type, "scroll"))
      .groupBy(analyticsEvents.value),

    // Top click elements
    db.select({ element: analyticsEvents.element, count: count() })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.type, "click"),
          isNotNull(analyticsEvents.element),
          ne(analyticsEvents.element, ""),
        )
      )
      .groupBy(analyticsEvents.element)
      .orderBy(desc(count()))
      .limit(10),

    // Heatmap clicks (last 500)
    db.select({ xPct: analyticsEvents.xPct, yPct: analyticsEvents.yPct })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.type, "click"),
          isNotNull(analyticsEvents.xPct),
          isNotNull(analyticsEvents.yPct),
        )
      )
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(500),

    // Recent sessions
    db.select({
      sessionId: analyticsSessions.sessionId,
      deviceType: analyticsSessions.deviceType,
      browser: analyticsSessions.browser,
      os: analyticsSessions.os,
      durationSeconds: analyticsSessions.durationSeconds,
      maxScrollPct: analyticsSessions.maxScrollPct,
      bounced: analyticsSessions.bounced,
      createdAt: analyticsSessions.createdAt,
    })
      .from(analyticsSessions)
      .orderBy(desc(analyticsSessions.createdAt))
      .limit(25),
  ]);

  // Fill timeline gaps
  const timelineMap = new Map(timelineRows.map((r) => [r.date, r.count]));
  const timeline: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    timeline.push({ date: key, count: timelineMap.get(key) ?? 0 });
  }

  return NextResponse.json({
    summary: {
      total: totalRow[0]?.count ?? 0,
      today: todayRow[0]?.count ?? 0,
      avgDuration: avgRow[0]?.avgDuration ?? 0,
      avgScroll: avgRow[0]?.avgScroll ?? 0,
      bounceRate: avgRow[0]?.bounceRate ?? 0,
    },
    timeline,
    devices: deviceRows,
    browsers: browserRows,
    scrollFunnel: [25, 50, 75, 100].map((m) => ({
      milestone: m,
      sessions: Number(scrollRows.find((r) => r.milestone === String(m))?.sessions ?? 0),
    })),
    topClicks: topClickRows,
    heatmapClicks: heatmapRows,
    recent: recentRows,
  });
}
