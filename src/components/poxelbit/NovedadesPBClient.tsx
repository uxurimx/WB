"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Megaphone, Rocket, AlertCircle, Wrench, TrendingUp, CheckCircle2, Plus,
  ChevronDown, Fuel, Clock, BarChart3, GitCommitVertical, ShieldCheck,
  Gauge, ListChecks, Zap, Eye, Sparkles, Lock, Database,
} from "lucide-react";
import { createNovedadPBAction } from "@/app/actions/poxelbit";
import type { getNovedadesPBAction, getPBModulosAction } from "@/app/actions/poxelbit";

type Novedad = Awaited<ReturnType<typeof getNovedadesPBAction>>[number];
type Modulo  = { id: number; titulo: string };

// ─── Tipo config ──────────────────────────────────────────────────────────────
const TIPO_CFG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; accent: string }> = {
  update:      { label: "Actualización", icon: TrendingUp,   color: "text-blue-400",    bg: "bg-blue-500/10",    accent: "#60a5fa" },
  milestone:   { label: "Hito",          icon: Rocket,       color: "text-indigo-400",  bg: "bg-indigo-500/10",  accent: "#818cf8" },
  alert:       { label: "Alerta",        icon: AlertCircle,  color: "text-amber-400",   bg: "bg-amber-500/10",   accent: "#fbbf24" },
  maintenance: { label: "Mantenimiento", icon: Wrench,       color: "text-slate-400",   bg: "bg-slate-500/10",   accent: "#94a3b8" },
  release:     { label: "Lanzamiento",   icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", accent: "#34d399" },
  feature:     { label: "Nueva función", icon: Sparkles,     color: "text-violet-400",  bg: "bg-violet-500/10",  accent: "#a78bfa" },
  security:    { label: "Seguridad",     icon: ShieldCheck,  color: "text-emerald-400", bg: "bg-emerald-500/10", accent: "#34d399" },
};

// ─── Iconos de bloques ────────────────────────────────────────────────────────
const BLOCK_ICONS: Record<string, React.ElementType> = {
  Fuel, Clock, BarChart3, GitCommitVertical, Gauge, ShieldCheck,
  ListChecks, Zap, Eye, Sparkles, Lock, Database, CheckCircle2,
  AlertCircle, Rocket, TrendingUp,
};

const FEATURE_COLORS: Record<string, string> = {
  blue:    "bg-blue-500/15 text-blue-400 border-blue-500/20",
  amber:   "bg-amber-500/15 text-amber-400 border-amber-500/20",
  emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  indigo:  "bg-indigo-500/15 text-indigo-400 border-indigo-500/20",
  violet:  "bg-violet-500/15 text-violet-400 border-violet-500/20",
  red:     "bg-red-500/15 text-red-400 border-red-500/20",
  slate:   "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

// ─── Tipos de bloques ─────────────────────────────────────────────────────────
type Block =
  | { type: "gauges"; items: { label: string; pct: number; value: string; max: string; color: string }[] }
  | { type: "features"; items: { icon: string; title: string; desc: string; color: string }[] }
  | { type: "compare"; title?: string; before: string; after: string }
  | { type: "security-steps"; items: { num: number; title: string; desc: string }[] }
  | { type: "callout"; text: string; variant: "success" | "info" | "warning" }
  | { type: "stats"; items: { value: string; label: string; sub?: string }[] };

type RichData = { lead: string; blocks: Block[] };

// ─── Gauge bar ────────────────────────────────────────────────────────────────
function GaugeBar({ label, pct, value, max, color }: { label: string; pct: number; value: string; max: string; color: string }) {
  const clampedPct = Math.min(100, Math.max(0, pct));
  const barColor =
    color === "amber" ? "bg-amber-400" :
    color === "blue"  ? "bg-blue-400"  :
    color === "red"   ? "bg-red-400"   : "bg-emerald-400";
  const textColor =
    clampedPct < 15 ? "text-red-400" :
    clampedPct < 35 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Fuel className="w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--fg)" }}>{label}</span>
        </div>
        <span className={`font-mono text-xs font-bold ${textColor}`}>{value}</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className={`text-[10px] font-semibold ${textColor}`}>{clampedPct.toFixed(0)}%</span>
        <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Máx {max}</span>
      </div>
    </div>
  );
}

// ─── Renderizador de bloques ──────────────────────────────────────────────────
function RichBlock({ block }: { block: Block }) {
  if (block.type === "gauges") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {block.items.map((g) => (
          <GaugeBar key={g.label} {...g} />
        ))}
      </div>
    );
  }

  if (block.type === "features") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {block.items.map((f) => {
          const Icon = BLOCK_ICONS[f.icon] ?? Zap;
          const cls = FEATURE_COLORS[f.color] ?? FEATURE_COLORS.blue;
          return (
            <div
              key={f.title}
              className="p-3.5 rounded-xl border"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              <div className={`inline-flex p-1.5 rounded-lg border mb-2.5 ${cls}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold mb-1" style={{ color: "var(--fg)" }}>{f.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>{f.desc}</p>
            </div>
          );
        })}
      </div>
    );
  }

  if (block.type === "compare") {
    return (
      <div className="mt-4">
        {block.title && (
          <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--fg-muted)" }}>
            {block.title}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-red-500/8 border border-red-500/20">
            <p className="text-[10px] font-bold text-red-400 mb-1.5 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400" />
              Antes
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>{block.before}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
            <p className="text-[10px] font-bold text-emerald-400 mb-1.5 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Ahora
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>{block.after}</p>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "security-steps") {
    return (
      <div className="mt-4 space-y-2.5">
        {block.items.map((item) => (
          <div
            key={item.num}
            className="flex gap-3 p-3.5 rounded-xl border"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {item.num}
            </div>
            <div>
              <p className="text-xs font-bold mb-0.5" style={{ color: "var(--fg)" }}>{item.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (block.type === "callout") {
    const styles = {
      success: "bg-emerald-500/10 border-emerald-500/25 text-emerald-300",
      info:    "bg-blue-500/10 border-blue-500/25 text-blue-300",
      warning: "bg-amber-500/10 border-amber-500/25 text-amber-300",
    };
    const icons = { success: CheckCircle2, info: Zap, warning: AlertCircle };
    const Icon = icons[block.variant];
    return (
      <div className={`mt-4 p-3.5 rounded-xl border flex items-start gap-2.5 ${styles[block.variant]}`}>
        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed">{block.text}</p>
      </div>
    );
  }

  if (block.type === "stats") {
    return (
      <div className="mt-4 grid grid-cols-3 gap-3">
        {block.items.map((s) => (
          <div
            key={s.label}
            className="p-3 rounded-xl border text-center"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <p className="font-mono font-bold text-base" style={{ color: "var(--fg)" }}>{s.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)" }}>{s.label}</p>
            {s.sub && <p className="text-[9px] mt-0.5 text-emerald-400">{s.sub}</p>}
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ─── Contenido rico ───────────────────────────────────────────────────────────
function RichContent({ contenido }: { contenido: string }) {
  let data: RichData | null = null;
  try {
    if (contenido.trimStart().startsWith("{")) {
      data = JSON.parse(contenido) as RichData;
    }
  } catch { /* plain text fallback */ }

  if (!data) {
    return (
      <p className="text-sm mt-2 leading-relaxed whitespace-pre-line" style={{ color: "var(--fg-muted)" }}>
        {contenido}
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--fg-muted)" }}>{data.lead}</p>
      {data.blocks.map((block, i) => (
        <RichBlock key={i} block={block} />
      ))}
    </div>
  );
}

// ─── Card de novedad ──────────────────────────────────────────────────────────
function NovedadCard({ n }: { n: Novedad }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TIPO_CFG[n.tipo] ?? TIPO_CFG.update;
  const Icon = cfg.icon;
  const isRich = n.contenido.trimStart().startsWith("{");

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-200"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Accent line */}
      <div className="h-0.5 w-full" style={{ backgroundColor: cfg.accent, opacity: 0.6 }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${cfg.bg}`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                <h3 className="font-semibold text-sm mt-0.5" style={{ color: "var(--fg)" }}>{n.titulo}</h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                  {new Date(n.createdAt ?? "").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                </span>
                {isRich && (
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      backgroundColor: expanded ? "var(--surface-2)" : cfg.accent + "22",
                      color: expanded ? "var(--fg-muted)" : cfg.accent,
                    }}
                  >
                    {expanded ? "Cerrar" : "Ver más"}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className={isRich && !expanded ? "mt-2" : ""}>
          {isRich && !expanded ? (
            // Vista colapsada: solo el lead
            (() => {
              try {
                const d = JSON.parse(n.contenido) as RichData;
                return <p className="text-xs leading-relaxed mt-2" style={{ color: "var(--fg-muted)" }}>{d.lead}</p>;
              } catch { return null; }
            })()
          ) : (
            <RichContent contenido={n.contenido} />
          )}
        </div>

        {n.modulo && (
          <Link
            href={`/poxelbit/modulos/${n.modulo.id}`}
            className="inline-flex items-center gap-1 mt-3 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {n.modulo.titulo} →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Fecha helpers ────────────────────────────────────────────────────────────
function formatDate(d: Date | string | null) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NovedadesPBClient({
  novedades,
  modulos,
  isAdmin,
}: {
  novedades: Novedad[];
  modulos: Modulo[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "", contenido: "", tipo: "update", moduloId: "" });
  const [error, setError] = useState("");
  const [isPending, startTx] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.titulo.trim()) { setError("El título es requerido"); return; }
    if (!form.contenido.trim()) { setError("El contenido es requerido"); return; }
    startTx(async () => {
      try {
        await createNovedadPBAction({
          titulo:    form.titulo.trim(),
          contenido: form.contenido.trim(),
          tipo:      form.tipo,
          moduloId:  form.moduloId ? parseInt(form.moduloId) : undefined,
        });
        setForm({ titulo: "", contenido: "", tipo: "update", moduloId: "" });
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al publicar");
      }
    });
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/poxelbit"
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-400 transition-colors"
          style={{ color: "var(--fg-muted)" }}
        >
          ← PoxelBit
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>PoxelBit</p>
            <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>Novedades</h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
              style={showForm
                ? { backgroundColor: "var(--surface-2)", color: "var(--fg)" }
                : { backgroundColor: "rgb(79 70 229)", color: "white" }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{showForm ? "Cancelar" : "Nueva novedad"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Form admin */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl border mb-6 space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>Nueva novedad</p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Título *</label>
            <input
              type="text" value={form.titulo}
              onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              placeholder="Título de la novedad"
              className="w-full h-9 px-3 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
              >
                {Object.entries(TIPO_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Módulo relacionado</label>
              <select
                value={form.moduloId}
                onChange={(e) => setForm((p) => ({ ...p, moduloId: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
              >
                <option value="">— Ninguno —</option>
                {modulos.map((m) => <option key={m.id} value={m.id}>{m.titulo}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Contenido *</label>
            <textarea
              value={form.contenido}
              onChange={(e) => setForm((p) => ({ ...p, contenido: e.target.value }))}
              placeholder="Texto o JSON de contenido rico..."
              rows={5}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-mono"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit" disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60"
            >
              {isPending ? "Publicando..." : "Publicar"}
            </button>
            <button
              type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: "var(--fg-muted)" }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {novedades.length === 0 ? (
        <div
          className="rounded-2xl border py-16 text-center"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "var(--fg-muted)" }} />
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Sin novedades todavía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {novedades.map((n) => <NovedadCard key={n.id} n={n} />)}
        </div>
      )}
    </div>
  );
}
