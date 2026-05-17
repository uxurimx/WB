"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2, Clock, RefreshCw, Bug, HelpCircle, DollarSign, Layers,
  ChevronRight, BarChart2, AlertCircle, Zap, BookOpen, ListChecks, Cpu,
} from "lucide-react";
import { aprobarModuloPBAction, updateEstadoModuloPBAction } from "@/app/actions/poxelbit";
import type { getPBModuloAction } from "@/app/actions/poxelbit";

type Modulo = NonNullable<Awaited<ReturnType<typeof getPBModuloAction>>>;

const TEMA_CFG: Record<string, { label: string; color: string; bg: string }> = {
  operaciones: { label: "Operaciones",  color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  analisis:    { label: "Análisis",     color: "text-emerald-400", bg: "bg-emerald-500/10" },
  expansion:   { label: "Expansión",    color: "text-amber-400",   bg: "bg-amber-500/10"   },
};

const ESTADO_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  proposed:    { label: "Propuesto",    color: "text-slate-400",   bg: "bg-slate-500/10",   icon: Clock        },
  approved:    { label: "Aprobado",     color: "text-indigo-400",  bg: "bg-indigo-500/10",  icon: CheckCircle2 },
  in_progress: { label: "En desarrollo",color: "text-blue-400",    bg: "bg-blue-500/10",    icon: RefreshCw    },
  completed:   { label: "Completado",   color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  paused:      { label: "Pausado",      color: "text-amber-400",   bg: "bg-amber-500/10",   icon: Clock        },
  cancelled:   { label: "Cancelado",    color: "text-red-400",     bg: "bg-red-500/10",     icon: AlertCircle  },
};

const TICKET_TIPO_CFG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  bug:        { label: "Bug",           icon: Bug,        color: "text-red-400"     },
  change:     { label: "Cambio",        icon: RefreshCw,  color: "text-blue-400"    },
  new_module: { label: "Nuevo módulo",  icon: Layers,     color: "text-indigo-400"  },
  question:   { label: "Pregunta",      icon: HelpCircle, color: "text-amber-400"   },
  payment:    { label: "Pago",          icon: DollarSign, color: "text-emerald-400" },
};

const TICKET_ESTADO_CFG: Record<string, { label: string; color: string }> = {
  open:        { label: "Abierto",    color: "text-indigo-400"  },
  in_progress: { label: "En proceso", color: "text-blue-400"    },
  resolved:    { label: "Resuelto",   color: "text-emerald-400" },
  closed:      { label: "Cerrado",    color: "text-slate-400"   },
};

const ADMIN_ESTADOS = ["proposed", "approved", "in_progress", "completed", "paused", "cancelled"] as const;

function safeJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val) as T; } catch { return fallback; }
}

function formatDate(d: Date | string | null) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

export default function ModuloDetallePB({
  modulo,
  isAdmin,
}: {
  modulo: Modulo;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [aprobando, setAprobando] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTx] = useTransition();

  const temaCfg   = TEMA_CFG[modulo.tema]     ?? TEMA_CFG.operaciones;
  const estadoCfg = ESTADO_CFG[modulo.estado] ?? ESTADO_CFG.proposed;
  const EstadoIcon = estadoCfg.icon;

  const casosUso   = safeJson<string[]>(modulo.casosUso,   []);
  const beneficios = safeJson<string[]>(modulo.beneficios, []);

  function handleAprobar() {
    setError("");
    startTx(async () => {
      try {
        await aprobarModuloPBAction(modulo.id);
        setAprobando(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al aprobar");
      }
    });
  }

  function handleEstadoAdmin(estado: typeof ADMIN_ESTADOS[number]) {
    setError("");
    startTx(async () => {
      try {
        await updateEstadoModuloPBAction(modulo.id, estado);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Breadcrumb */}
      <Link href="/poxelbit"
        className="flex items-center gap-1.5 text-xs font-semibold mb-6 hover:text-indigo-400 transition-colors"
        style={{ color: "var(--fg-muted)" }}>
        ← PoxelBit
      </Link>

      {/* Header card */}
      <div className="p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${temaCfg.bg} ${temaCfg.color}`}>
                {temaCfg.label}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${estadoCfg.bg} ${estadoCfg.color}`}>
                <EstadoIcon className="w-3 h-3" />
                {estadoCfg.label}
              </span>
              <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Fase {modulo.fasePackage}</span>
            </div>
            <h1 className="font-outfit font-bold text-2xl leading-snug" style={{ color: "var(--fg)" }}>
              {modulo.titulo}
            </h1>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "var(--fg-muted)" }}>{modulo.resumen}</p>
          </div>

          {/* KPI mini */}
          <div className="flex gap-3 shrink-0">
            <div className="text-center">
              <p className="font-bold text-lg" style={{ color: "var(--fg)" }}>
                ${(modulo.costoEstimado / 1000).toFixed(1)}k
              </p>
              <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Inversión</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg" style={{ color: "var(--fg)" }}>{modulo.diasEstimados}d</p>
              <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Tiempo</p>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        {(modulo.estado === "in_progress" || modulo.estado === "completed") && (
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-semibold" style={{ color: "var(--fg-muted)" }}>Progreso</span>
              <span className="text-[10px] font-bold text-indigo-400">{modulo.progreso}%</span>
            </div>
            <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--surface-2)" }}>
              <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${modulo.progreso}%` }} />
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="flex gap-4 text-[10px] flex-wrap" style={{ color: "var(--fg-muted)" }}>
          {modulo.aprobadoAt && <span>Aprobado: {formatDate(modulo.aprobadoAt)}</span>}
          {modulo.iniciadoAt && <span>Iniciado: {formatDate(modulo.iniciadoAt)}</span>}
          {modulo.completadoAt && <span>Completado: {formatDate(modulo.completadoAt)}</span>}
        </div>

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1.5 mt-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}

        {/* Aprobar (cliente) */}
        {modulo.estado === "proposed" && !isAdmin && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            {!aprobando ? (
              <button onClick={() => setAprobando(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                Aprobar este módulo
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  ¿Confirmas la aprobación de <span className="text-indigo-400">{modulo.titulo}</span>?
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
                  Al aprobar, el equipo de desarrollo iniciará la planificación y se confirmará el pago previo al inicio del desarrollo.
                </p>
                <div className="flex gap-2">
                  <button onClick={handleAprobar} disabled={isPending}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60">
                    {isPending ? "Aprobando..." : "Sí, aprobar"}
                  </button>
                  <button onClick={() => setAprobando(false)}
                    className="px-4 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--surface-2)]"
                    style={{ color: "var(--fg-muted)" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Control admin */}
        {isAdmin && (
          <div className="mt-4 pt-4 border-t flex items-center gap-2 flex-wrap" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Admin:</span>
            {ADMIN_ESTADOS.map((e) => {
              const cfg = ESTADO_CFG[e];
              const active = modulo.estado === e;
              return (
                <button key={e} onClick={() => handleEstadoAdmin(e)} disabled={isPending || active}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                    active ? `${cfg.bg} ${cfg.color} border-transparent` : "border-transparent hover:bg-[var(--surface-2)]"
                  }`}
                  style={!active ? { color: "var(--fg-muted)" } : undefined}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Descripción */}
      <div className="p-5 rounded-2xl border mb-4"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
          <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>Descripción</p>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--fg-muted)" }}>
          {modulo.descripcion}
        </p>
      </div>

      {/* Impacto */}
      {modulo.impacto && (
        <div className="p-5 rounded-2xl border mb-4 bg-indigo-500/5"
          style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <p className="font-semibold text-sm text-indigo-400">Impacto en el negocio</p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--fg)" }}>{modulo.impacto}</p>
        </div>
      )}

      {/* Casos de uso + Beneficios */}
      {(casosUso.length > 0 || beneficios.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {casosUso.length > 0 && (
            <div className="p-5 rounded-2xl border"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <ListChecks className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
                <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>Casos de uso</p>
              </div>
              <ul className="space-y-2">
                {casosUso.map((c, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--fg-muted)" }}>
                    <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-indigo-400" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {beneficios.length > 0 && (
            <div className="p-5 rounded-2xl border"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
                <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>Beneficios</p>
              </div>
              <ul className="space-y-2">
                {beneficios.map((b, i) => (
                  <li key={i} className="text-xs flex items-start gap-2" style={{ color: "var(--fg-muted)" }}>
                    <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0 text-emerald-400" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tickets relacionados */}
      {modulo.tickets && modulo.tickets.length > 0 && (
        <div className="p-5 rounded-2xl border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
              <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>Tickets relacionados</p>
            </div>
            <Link href="/poxelbit/tickets"
              className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver todos
            </Link>
          </div>
          <div className="space-y-1.5">
            {modulo.tickets.map((t) => {
              const tipoCfg   = TICKET_TIPO_CFG[t.tipo]     ?? TICKET_TIPO_CFG.question;
              const estadoCfg = TICKET_ESTADO_CFG[t.estado] ?? TICKET_ESTADO_CFG.open;
              const TipoIcon  = tipoCfg.icon;
              return (
                <Link key={t.id} href={`/poxelbit/tickets/${t.id}`}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[var(--surface-2)] transition-colors group">
                  <TipoIcon className={`w-3.5 h-3.5 shrink-0 ${tipoCfg.color}`} />
                  <span className="text-sm flex-1 truncate" style={{ color: "var(--fg)" }}>{t.titulo}</span>
                  <span className={`text-[10px] font-semibold shrink-0 ${estadoCfg.color}`}>{estadoCfg.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
