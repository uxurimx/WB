"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers, TicketCheck, Megaphone, TrendingUp, CheckCircle2, PlayCircle,
  Circle, ArrowRight, Sparkles, LayoutGrid, Package,
  Wrench, Zap, ChevronLeft,
} from "lucide-react";
import { aprobarModuloPBAction, seedPBModulosAction } from "@/app/actions/poxelbit";
import type { getPBModulosAction, getNovedadesPBAction, getPBStatsAction } from "@/app/actions/poxelbit";

type Modulo   = Awaited<ReturnType<typeof getPBModulosAction>>[number];
type Novedad  = Awaited<ReturnType<typeof getNovedadesPBAction>>[number];
type Stats    = Awaited<ReturnType<typeof getPBStatsAction>>;

// ── Config de temas ───────────────────────────────────────────────────────────
const TEMA_CONFIG: Record<string, {
  nombre: string; icon: React.ElementType; descripcion: string;
  accent: string; accentBg: string; accentBorder: string;
  glowRing: string;
}> = {
  operaciones: {
    nombre:      "Operaciones",
    icon:        Wrench,
    descripcion: "Mejoras al flujo diario: cargas externas, app campo, firma digital y alertas.",
    accent:      "text-indigo-400",
    accentBg:    "bg-indigo-500/10",
    accentBorder:"border-indigo-500/20",
    glowRing:    "ring-1 ring-indigo-500/20",
  },
  analisis: {
    nombre:      "Análisis",
    icon:        TrendingUp,
    descripcion: "Inteligencia operativa: costos, dashboards gerenciales y reportes ejecutivos.",
    accent:      "text-emerald-400",
    accentBg:    "bg-emerald-500/10",
    accentBorder:"border-emerald-500/20",
    glowRing:    "ring-1 ring-emerald-500/20",
  },
  expansion: {
    nombre:      "Expansión",
    icon:        Zap,
    descripcion: "Crecimiento del sistema: portal clientes, multi-empresa y telemetría GPS.",
    accent:      "text-amber-400",
    accentBg:    "bg-amber-500/10",
    accentBorder:"border-amber-500/20",
    glowRing:    "ring-1 ring-amber-500/20",
  },
};

const ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  proposed:    { label: "Propuesto",    color: "text-slate-400",   bg: "bg-slate-500/10"  },
  approved:    { label: "Aprobado",     color: "text-yellow-400",  bg: "bg-yellow-500/10" },
  in_progress: { label: "En desarrollo",color: "text-blue-400",    bg: "bg-blue-500/10"   },
  completed:   { label: "Completado",   color: "text-emerald-400", bg: "bg-emerald-500/10"},
  paused:      { label: "Pausado",      color: "text-orange-400",  bg: "bg-orange-500/10" },
  cancelled:   { label: "Cancelado",    color: "text-red-400",     bg: "bg-red-500/10"    },
};

const NOVEDAD_CFG: Record<string, { emoji: string }> = {
  update:      { emoji: "📋" },
  new_module:  { emoji: "✨" },
  maintenance: { emoji: "🔧" },
  payment:     { emoji: "💳" },
  milestone:   { emoji: "🎯" },
};

const STATUS_FILTERS = [
  { key: "all",         label: "Todos"         },
  { key: "proposed",    label: "Propuestos"    },
  { key: "approved",    label: "Aprobados"     },
  { key: "in_progress", label: "En Desarrollo" },
  { key: "completed",   label: "Completados"   },
];

export default function PoxelBitDashboard({
  modulos,
  novedades,
  stats,
  isAdmin,
}: {
  modulos: Modulo[];
  novedades: Novedad[];
  stats: Stats;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [activeTab,   setActiveTab]   = useState<"proposals" | "announcements">("proposals");
  const [activeTema,  setActiveTema]  = useState<string | null>(null);
  const [cardFilter,  setCardFilter]  = useState("all");
  const [seeding,     setSeeding]     = useState(false);
  const [aprobando,   setAprobando]   = useState<number | null>(null);
  const [, startTx] = useTransition();

  const temaModulos = activeTema ? modulos.filter((m) => m.tema === activeTema) : modulos;
  const temasUnicos = Array.from(new Set(modulos.map((m) => m.tema))).filter((t) => t in TEMA_CONFIG);

  async function handleSeed() {
    if (!confirm("¿Sembrar los 12 módulos del plan de desarrollo?")) return;
    setSeeding(true);
    try {
      const res = await seedPBModulosAction();
      alert(res.message);
      router.refresh();
    } finally { setSeeding(false); }
  }

  async function handleAprobar(id: number) {
    if (!confirm("¿Aprobar este módulo para desarrollo?")) return;
    setAprobando(id);
    startTx(async () => {
      try {
        await aprobarModuloPBAction(id);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error al aprobar");
      } finally { setAprobando(null); }
    });
  }

  const filtrados = cardFilter === "all"
    ? temaModulos
    : temaModulos.filter((m) => m.estado === cardFilter);

  const kpiDefs = [
    { label: "Total módulos",  value: stats.total,         color: "text-slate-400",   bg: "bg-slate-500/10  border-slate-500/20",   icon: Layers       },
    { label: "Aprobados",      value: stats.aprobados,     color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20",  icon: CheckCircle2 },
    { label: "En Desarrollo",  value: stats.enDesarrollo,  color: "text-blue-400",    bg: "bg-blue-500/10   border-blue-500/20",    icon: PlayCircle   },
    { label: "Completados",    value: stats.completados,   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          {activeTema && (
            <button
              onClick={() => { setActiveTema(null); setCardFilter("all"); }}
              className="flex items-center gap-1 text-xs font-semibold mb-2 transition-colors hover:text-indigo-400"
              style={{ color: "var(--fg-muted)" }}
            >
              <ChevronLeft className="w-3 h-3" /> Propuestas
            </button>
          )}
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>
            Portal de Desarrollo
          </p>
          <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
            {activeTema ? (TEMA_CONFIG[activeTema]?.nombre ?? activeTema) : "PoxelBit"}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            {activeTema
              ? TEMA_CONFIG[activeTema]?.descripcion
              : "Seguimiento de módulos propuestos, solicitudes y comunicación con el equipo de desarrollo"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && modulos.length === 0 && (
            <button onClick={handleSeed} disabled={seeding}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-50">
              <Sparkles className="w-4 h-4" />
              {seeding ? "Sembrando..." : "Sembrar módulos"}
            </button>
          )}
          <Link href="/poxelbit/tickets/nuevo"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: "rgb(79 70 229)", color: "white" }}>
            <TicketCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo ticket</span>
          </Link>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpiDefs.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="p-4 rounded-2xl border"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>{label}</span>
              <div className={`p-1.5 rounded-lg border ${bg}`}><Icon className={`w-3.5 h-3.5 ${color}`} /></div>
            </div>
            <p className={`font-outfit font-bold text-3xl ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Inversión + Tickets ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div className="p-4 rounded-2xl border flex items-center gap-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--fg-muted)" }}>
              Inversión aprobada
            </p>
            <p className="font-outfit font-bold text-2xl text-emerald-400">
              ${stats.inversion.toLocaleString("es-MX")}{" "}
              <span className="text-sm font-normal text-emerald-500/60">MXN</span>
            </p>
          </div>
        </div>
        <Link href="/poxelbit/tickets"
          className="p-4 rounded-2xl border flex items-center gap-4 group hover:border-orange-500/20 transition-colors"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <TicketCheck className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--fg-muted)" }}>Tickets abiertos</p>
            <p className="font-outfit font-bold text-2xl text-orange-400">{stats.ticketsAbiertos}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-orange-400/50 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-6 border-b overflow-x-auto" style={{ borderColor: "var(--border)", scrollbarWidth: "none" }}>
        {([
          { key: "proposals",     label: "Propuestas", icon: Package   },
          { key: "announcements", label: "Novedades",  icon: Megaphone },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`shrink-0 flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent hover:text-[var(--fg)]"
            }`}
            style={{ color: activeTab === tab.key ? undefined : "var(--fg-muted)" }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.key === "announcements" && novedades.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold">
                {novedades.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Propuestas ──────────────────────────────────── */}
      {activeTab === "proposals" && (
        <>
          {!activeTema ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {temasUnicos.length === 0 ? (
                <div className="col-span-full rounded-2xl border py-16 text-center"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <Circle className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "var(--fg-muted)" }} />
                  <p className="text-sm mb-4" style={{ color: "var(--fg-muted)" }}>No hay propuestas registradas</p>
                  {isAdmin && (
                    <button onClick={handleSeed} disabled={seeding}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-50 mx-auto">
                      <Sparkles className="w-4 h-4" />
                      {seeding ? "Sembrando..." : "Sembrar módulos del plan"}
                    </button>
                  )}
                </div>
              ) : temasUnicos.map((temaKey) => {
                const cfg     = TEMA_CONFIG[temaKey];
                const tMods   = modulos.filter((m) => m.tema === temaKey);
                const tDone   = tMods.filter((m) => m.estado === "completed").length;
                const tActive = tMods.filter((m) => ["approved", "in_progress", "completed"].includes(m.estado)).length;
                const tCosto  = tMods.reduce((a, m) => a + m.costoEstimado, 0);
                const tDias   = tMods.reduce((a, m) => a + m.diasEstimados, 0);
                const pct     = tMods.length > 0 ? Math.round((tDone / tMods.length) * 100) : 0;
                const TopicIcon = cfg?.icon ?? Package;

                return (
                  <button
                    key={temaKey}
                    onClick={() => setActiveTema(temaKey)}
                    className={`text-left p-5 rounded-2xl border group transition-all duration-200 hover:scale-[1.01] ${cfg?.glowRing}`}
                    style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl border ${cfg?.accentBg} ${cfg?.accentBorder}`}>
                        <TopicIcon className={`w-5 h-5 ${cfg?.accent}`} />
                      </div>
                      <span className="relative flex h-2.5 w-2.5 mt-1">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${cfg?.accentBg}`} />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg?.accentBg}`} />
                      </span>
                    </div>
                    <h3 className="font-outfit font-bold text-lg mb-1" style={{ color: "var(--fg)" }}>{cfg?.nombre ?? temaKey}</h3>
                    <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--fg-muted)" }}>{cfg?.descripcion}</p>
                    <div className="flex items-center gap-3 text-xs mb-4 flex-wrap" style={{ color: "var(--fg-muted)" }}>
                      <span><span className={`font-semibold ${cfg?.accent}`}>${tCosto.toLocaleString("es-MX")}</span> MXN</span>
                      <span>·</span>
                      <span>{tDias} días</span>
                      <span>·</span>
                      <span>{tMods.length} módulos</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span style={{ color: "var(--fg-muted)" }}>{tActive} de {tMods.length} activos</span>
                        <span className={`font-semibold ${cfg?.accent}`}>{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-500/15">
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${cfg?.accent.replace("text-", "bg-")}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 pt-3 border-t ${cfg?.accentBorder}`}>
                      <span className={`text-xs font-bold ${cfg?.accent}`}>VER DETALLES</span>
                      <ArrowRight className={`w-3.5 h-3.5 ${cfg?.accent} group-hover:translate-x-1 transition-transform`} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex items-center gap-2 flex-wrap">
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                {STATUS_FILTERS.map((f) => (
                  <button key={f.key} onClick={() => setCardFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      cardFilter === f.key
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                        : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--surface-2)]"
                    }`}>
                    {f.label}
                    {f.key !== "all" && (
                      <span className="ml-1.5 opacity-60">{temaModulos.filter((m) => m.estado === f.key).length}</span>
                    )}
                  </button>
                ))}
              </div>

              {filtrados.length === 0 ? (
                <div className="rounded-2xl border py-12 text-center"
                  style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Sin módulos en este estado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtrados.map((mod) => {
                    const estadoCfg = ESTADO_CFG[mod.estado] ?? ESTADO_CFG.proposed;
                    return (
                      <div key={mod.id} className="rounded-2xl border overflow-hidden"
                        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                        {/* Header */}
                        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-outfit font-bold text-base leading-snug" style={{ color: "var(--fg)" }}>
                              {mod.titulo}
                            </h3>
                            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${estadoCfg.bg} ${estadoCfg.color}`}>
                              {estadoCfg.label}
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>{mod.resumen}</p>
                        </div>
                        {/* Stats */}
                        <div className="px-5 py-3 flex items-center gap-4 text-xs" style={{ color: "var(--fg-muted)" }}>
                          <span className="font-semibold text-emerald-400">${mod.costoEstimado.toLocaleString("es-MX")} MXN</span>
                          <span>·</span>
                          <span>{mod.diasEstimados} días</span>
                          {mod.progreso > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-indigo-400">{mod.progreso}% avance</span>
                            </>
                          )}
                        </div>
                        {/* Acciones */}
                        <div className="px-5 pb-4 flex items-center gap-2">
                          <Link href={`/poxelbit/modulos/${mod.id}`}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                            Ver detalles →
                          </Link>
                          {mod.estado === "proposed" && (
                            <button
                              onClick={() => handleAprobar(mod.id)}
                              disabled={aprobando === mod.id}
                              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {aprobando === mod.id ? "Aprobando..." : "Aprobar"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Novedades ───────────────────────────────────── */}
      {activeTab === "announcements" && (
        <div className="max-w-2xl">
          <div className="rounded-2xl border divide-y" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-indigo-400" />
                <h2 className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>Novedades recientes</h2>
              </div>
              <Link href="/poxelbit/novedades" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                Ver todas →
              </Link>
            </div>
            {novedades.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Sin novedades aún</p>
              </div>
            ) : novedades.slice(0, 8).map((n) => {
              const cfg = NOVEDAD_CFG[n.tipo] ?? NOVEDAD_CFG.update;
              return (
                <div key={n.id} className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <span className="text-base leading-none mt-0.5 shrink-0">{cfg.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight" style={{ color: "var(--fg)" }}>{n.titulo}</p>
                      <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>{n.contenido}</p>
                      <p className="text-[10px] mt-1.5" style={{ color: "var(--fg-muted)" }}>
                        {n.createdAt
                          ? new Date(n.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
