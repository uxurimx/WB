"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Smartphone, Monitor, Tablet, Clock, MousePointerClick,
  TrendingUp, Globe, Percent, RefreshCw, Activity,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Summary = {
  total: number;
  today: number;
  avgDuration: number;
  avgScroll: number;
  bounceRate: number;
};

type TimelineItem = { date: string; count: number };
type DeviceItem   = { type: string | null; count: number };
type BrowserItem  = { browser: string | null; count: number };
type FunnelItem   = { milestone: number; sessions: number };
type ClickItem    = { element: string | null; count: number };
type HeatPoint    = { xPct: number | null; yPct: number | null };

type RecentSession = {
  sessionId: string;
  deviceType: string | null;
  browser: string | null;
  os: string | null;
  durationSeconds: number | null;
  maxScrollPct: number | null;
  bounced: boolean | null;
  createdAt: string | null;
};

type AnalyticsData = {
  summary: Summary;
  timeline: TimelineItem[];
  devices: DeviceItem[];
  browsers: BrowserItem[];
  scrollFunnel: FunnelItem[];
  topClicks: ClickItem[];
  heatmapClicks: HeatPoint[];
  recent: RecentSession[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDuration(secs: number): string {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function fmtDateShort(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function deviceIcon(type: string | null) {
  if (type === "mobile")  return <Smartphone className="w-4 h-4" />;
  if (type === "tablet")  return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

function deviceLabel(type: string | null): string {
  if (type === "mobile")  return "Móvil";
  if (type === "tablet")  return "Tablet";
  if (type === "desktop") return "Escritorio";
  return type ?? "Desconocido";
}

function osLabel(os: string | null): string {
  if (os === "ios")     return "iOS";
  if (os === "android") return "Android";
  if (os === "windows") return "Windows";
  if (os === "macos")   return "macOS";
  if (os === "linux")   return "Linux";
  return os ?? "—";
}

function heatColor(t: number): [number, number, number] {
  if (t < 0.25) { const s = t / 0.25; return [0, Math.round(s * 255), 255]; }
  if (t < 0.5)  { const s = (t - 0.25) / 0.25; return [0, 255, Math.round((1 - s) * 255)]; }
  if (t < 0.75) { const s = (t - 0.5) / 0.25; return [Math.round(s * 255), 255, 0]; }
  const s = (t - 0.75) / 0.25; return [255, Math.round((1 - s) * 255), 0];
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, highlight,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-3"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
          {label}
        </span>
        <div className={`p-2 rounded-xl ${highlight ? "bg-indigo-500/10" : "bg-[var(--surface-2)]"}`}>
          <Icon className={`w-4 h-4 ${highlight ? "text-indigo-500" : ""}`} style={!highlight ? { color: "var(--fg-muted)" } : undefined} />
        </div>
      </div>
      <div>
        <p className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Timeline Bar Chart ───────────────────────────────────────────────────────

function TimelineChart({ data }: { data: TimelineItem[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const visible = data.slice(-14);

  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {visible.map((d) => {
          const pct = (d.count / max) * 100;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <span
                className="text-[9px] font-bold text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                style={{ backgroundColor: "var(--fg)" }}
              >
                {d.count}
              </span>
              <div className="w-full rounded-t-sm bg-indigo-600/20 flex flex-col justify-end" style={{ height: "80px" }}>
                <div
                  className="w-full rounded-t-sm bg-indigo-600 transition-all duration-500"
                  style={{ height: `${pct}%`, minHeight: d.count > 0 ? "3px" : "0" }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 mt-1.5">
        {visible.map((d, i) => (
          <div key={d.date} className="flex-1 text-center">
            {(i === 0 || i === Math.floor(visible.length / 2) || i === visible.length - 1) && (
              <span className="text-[9px]" style={{ color: "var(--fg-muted)" }}>
                {fmtDateShort(d.date)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Heatmap Canvas ──────────────────────────────────────────────────────────

function Heatmap({ clicks }: { clicks: HeatPoint[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const valid = clicks.filter((c) => c.xPct != null && c.yPct != null);
    if (valid.length === 0) {
      ctx.fillStyle = "rgba(100,100,100,0.08)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(100,100,100,0.4)";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sin datos de clicks aún", W / 2, H / 2);
      return;
    }

    // Build heat grid (200x200)
    const GW = 200, GH = 200;
    const grid = new Float32Array(GW * GH);
    const RADIUS = 10;

    for (const { xPct, yPct } of valid) {
      const gx = Math.round((xPct! / 100) * (GW - 1));
      const gy = Math.round((yPct! / 100) * (GH - 1));
      for (let dy = -RADIUS; dy <= RADIUS; dy++) {
        for (let dx = -RADIUS; dx <= RADIUS; dx++) {
          const px = gx + dx, py = gy + dy;
          if (px < 0 || px >= GW || py < 0 || py >= GH) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > RADIUS) continue;
          grid[py * GW + px] += Math.exp(-(dist * dist) / (RADIUS * RADIUS * 0.3));
        }
      }
    }

    const maxVal = Math.max(...Array.from(grid));
    if (maxVal === 0) return;

    // Draw page silhouette
    ctx.fillStyle = "rgba(13,27,62,0.06)";
    ctx.fillRect(0, 0, W, H);
    // Nav bar
    ctx.fillStyle = "rgba(13,27,62,0.10)";
    ctx.fillRect(0, 0, W, Math.round(H * 0.06));
    // Hero
    ctx.fillStyle = "rgba(13,27,62,0.06)";
    ctx.fillRect(0, Math.round(H * 0.06), W, Math.round(H * 0.42));
    // Services
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, Math.round(H * 0.48), W, Math.round(H * 0.22));
    // Contact form
    ctx.fillStyle = "rgba(13,27,62,0.04)";
    ctx.fillRect(0, Math.round(H * 0.70), W, Math.round(H * 0.22));

    // Section labels
    ctx.font = "9px sans-serif";
    ctx.fillStyle = "rgba(100,100,100,0.4)";
    ctx.textAlign = "left";
    ctx.fillText("Nav", 4, 10);
    ctx.fillText("Hero", 4, Math.round(H * 0.06) + 14);
    ctx.fillText("Servicios", 4, Math.round(H * 0.48) + 14);
    ctx.fillText("Cotizar", 4, Math.round(H * 0.70) + 14);
    ctx.fillText("Footer", 4, Math.round(H * 0.92) + 14);

    // Draw heat map
    const imgData = ctx.createImageData(W, H);
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const gx = Math.round((px / W) * (GW - 1));
        const gy = Math.round((py / H) * (GH - 1));
        const val = grid[gy * GW + gx] / maxVal;
        if (val < 0.02) continue;
        const [r, g, b] = heatColor(val);
        const i = (py * W + px) * 4;
        imgData.data[i]     = r;
        imgData.data[i + 1] = g;
        imgData.data[i + 2] = b;
        imgData.data[i + 3] = Math.round(val * 200);
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [clicks]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={500}
      className="w-full rounded-xl"
      style={{ maxHeight: "420px", objectFit: "fill" }}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const RANGES = [
  { label: "7 días",  days: 7  },
  { label: "14 días", days: 14 },
  { label: "30 días", days: 30 },
  { label: "Todo",    days: 90 },
];

export default function AnalyticsDashboard() {
  const [days, setDays]       = useState(14);
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/analytics/data?days=${days}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const totalDevices = data?.devices.reduce((a, b) => a + b.count, 0) ?? 1;
  const totalBrowsers = data?.browsers.reduce((a, b) => a + b.count, 0) ?? 1;
  const maxFunnel = data?.scrollFunnel[0]?.sessions ?? 1;

  return (
    <div className="p-6 md:p-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>
            Landing · wbconstruccion.mx
          </p>
          <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
            Analíticas
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
          >
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  days === r.days
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-[var(--surface)]"
                }`}
                style={days !== r.days ? { color: "var(--fg-muted)" } : undefined}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={load}
            className="p-2 rounded-xl border hover:bg-[var(--surface-2)] transition-colors"
            style={{ borderColor: "var(--border)" }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} style={{ color: "var(--fg-muted)" }} />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border p-4 mb-6 text-sm" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
          No se pudo cargar. Intenta de nuevo.
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Visitas totales"
          value={loading ? "…" : String(data?.summary.total ?? 0)}
          icon={Globe}
          highlight
        />
        <KpiCard
          label="Hoy"
          value={loading ? "…" : String(data?.summary.today ?? 0)}
          sub="visitas hoy"
          icon={Activity}
        />
        <KpiCard
          label="Tiempo prom."
          value={loading ? "…" : fmtDuration(data?.summary.avgDuration ?? 0)}
          sub="en la página"
          icon={Clock}
        />
        <KpiCard
          label="Bounce rate"
          value={loading ? "…" : `${data?.summary.bounceRate ?? 0}%`}
          sub="sin interacción"
          icon={TrendingUp}
        />
        <KpiCard
          label="Scroll prom."
          value={loading ? "…" : `${data?.summary.avgScroll ?? 0}%`}
          sub="profundidad"
          icon={Percent}
        />
      </div>

      {/* Timeline + Devices row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">

        {/* Timeline */}
        <div
          className="lg:col-span-2 rounded-2xl border p-5"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--fg-muted)" }}>
            Visitas por día
          </p>
          {loading ? (
            <div className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: "var(--surface-2)" }} />
          ) : data ? (
            <TimelineChart data={data.timeline} />
          ) : null}
        </div>

        {/* Device breakdown */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--fg-muted)" }}>
            Dispositivos
          </p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-2)" }} />
              ))}
            </div>
          ) : data?.devices.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Sin datos</p>
          ) : (
            <div className="space-y-3">
              {(data?.devices ?? []).map((d) => {
                const pct = Math.round((d.count / totalDevices) * 100);
                return (
                  <div key={d.type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2" style={{ color: "var(--fg)" }}>
                        {deviceIcon(d.type)}
                        <span className="text-xs font-medium">{deviceLabel(d.type)}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: "var(--fg-muted)" }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
                      <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{d.count} visitas</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Browsers */}
          {!loading && (data?.browsers ?? []).length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-widest mt-5 mb-3" style={{ color: "var(--fg-muted)" }}>
                Navegadores
              </p>
              <div className="space-y-2">
                {(data?.browsers ?? []).slice(0, 4).map((b) => {
                  const pct = Math.round((b.count / totalBrowsers) * 100);
                  return (
                    <div key={b.browser} className="flex items-center gap-2">
                      <span className="text-xs w-14 font-medium capitalize" style={{ color: "var(--fg)" }}>
                        {b.browser ?? "—"}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
                        <div className="h-1.5 rounded-full bg-indigo-400/60" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] w-6 text-right font-semibold" style={{ color: "var(--fg-muted)" }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scroll Funnel + Top Clicks */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">

        {/* Scroll Funnel */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--fg-muted)" }}>
            Profundidad de scroll
          </p>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-2)" }} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.scrollFunnel ?? []).map((f) => {
                const pct = maxFunnel > 0 ? Math.round((f.sessions / maxFunnel) * 100) : 0;
                const colors: Record<number, string> = {
                  25:  "bg-indigo-400",
                  50:  "bg-indigo-500",
                  75:  "bg-indigo-600",
                  100: "bg-indigo-700",
                };
                return (
                  <div key={f.milestone}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                        {f.milestone}% scroll
                      </span>
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                        {f.sessions} sesiones
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${colors[f.milestone] ?? "bg-indigo-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {!loading && (data?.scrollFunnel ?? []).every((f) => f.sessions === 0) && (
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Sin datos de scroll aún</p>
              )}
            </div>
          )}
        </div>

        {/* Top Clicks */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
              Elementos más clickeados
            </p>
            <MousePointerClick className="w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
          </div>
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 rounded-lg animate-pulse" style={{ backgroundColor: "var(--surface-2)" }} />
              ))}
            </div>
          ) : (data?.topClicks ?? []).length === 0 ? (
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Sin datos de clicks aún</p>
          ) : (
            <div className="space-y-2">
              {(() => {
                const maxC = data!.topClicks[0]?.count ?? 1;
                return data!.topClicks.map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className="text-[10px] font-bold w-5 text-center rounded-full py-0.5"
                      style={{ backgroundColor: "var(--surface-2)", color: "var(--fg-muted)" }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--fg)" }}>
                        {c.element || "—"}
                      </p>
                      <div className="mt-0.5 h-1 rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
                        <div
                          className="h-1 rounded-full bg-indigo-500"
                          style={{ width: `${Math.round((c.count / maxC) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: "var(--fg-muted)" }}>
                      {c.count}
                    </span>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div
        className="rounded-2xl border p-5 mb-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Mapa de calor — Clicks en la landing
          </p>
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--fg-muted)" }}>
            <span className="inline-block w-3 h-3 rounded-sm bg-blue-400" />frío
            <span className="inline-block w-3 h-3 rounded-sm bg-green-400 ml-1" />
            <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400" />
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />caliente
          </div>
        </div>
        {loading ? (
          <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: "var(--surface-2)" }} />
        ) : (
          <Heatmap clicks={data?.heatmapClicks ?? []} />
        )}
        <p className="text-[10px] mt-2 text-center" style={{ color: "var(--fg-muted)" }}>
          Visualización proporcional a secciones de la página: Nav · Hero · Servicios · Cotizar · Footer
        </p>
      </div>

      {/* Recent sessions table */}
      <div
        className="rounded-2xl border"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Sesiones recientes
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["Fecha", "Dispositivo", "OS", "Tiempo", "Scroll", "Bounce"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: "var(--border)" }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 rounded animate-pulse" style={{ backgroundColor: "var(--surface-2)" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (data?.recent ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs" style={{ color: "var(--fg-muted)" }}>
                    Sin sesiones registradas aún
                  </td>
                </tr>
              ) : (
                (data?.recent ?? []).map((s) => (
                  <tr key={s.sessionId} className="border-b last:border-0 hover:bg-[var(--surface-2)] transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3 text-xs" style={{ color: "var(--fg-muted)" }}>
                      {s.createdAt ? fmtDate(s.createdAt.slice(0, 10)) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5" style={{ color: "var(--fg)" }}>
                        {deviceIcon(s.deviceType)}
                        <span className="text-xs">{deviceLabel(s.deviceType)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs capitalize" style={{ color: "var(--fg)" }}>
                      {osLabel(s.os)}
                    </td>
                    <td className="px-5 py-3 text-xs tabular-nums" style={{ color: "var(--fg)" }}>
                      {fmtDuration(s.durationSeconds ?? 0)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
                          <div
                            className="h-1.5 rounded-full bg-indigo-500"
                            style={{ width: `${s.maxScrollPct ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums" style={{ color: "var(--fg-muted)" }}>
                          {s.maxScrollPct ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.bounced
                            ? "bg-red-500/10 text-red-500"
                            : "bg-green-500/10 text-green-600"
                        }`}
                      >
                        {s.bounced ? "Sí" : "No"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
