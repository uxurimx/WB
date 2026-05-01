"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2, Fuel, Gauge, AlertTriangle, X, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";
import {
  UMBRAL_TALLER, UMBRAL_NISSAN,
  type AlertaRendimiento, type AnomaliaActiva,
} from "@/lib/alertas-config";

type StockInfo = { id: number; litros: number; max: number };

interface AlertasPanelProps {
  taller: StockInfo;
  nissan: StockInfo;
  alertasRendimiento: AlertaRendimiento[];
  anomaliasActivas: AnomaliaActiva[];
  ultimoPeriodoCerrado: { id: number; nombre: string } | null;
  periodoActivoId: number | null;
}

const LS_KEY = "alertas_rend_dismissed";

export default function AlertasPanel({
  taller,
  nissan,
  alertasRendimiento,
  anomaliasActivas,
  ultimoPeriodoCerrado,
  periodoActivoId,
}: AlertasPanelProps) {
  const [dismissedId, setDismissedId]         = useState<number | null>(null);
  const [rendExpanded, setRendExpanded]       = useState(false);
  const [mounted, setMounted]                 = useState(false);
  const [dismissedStock, setDismissedStock]   = useState<Set<string>>(new Set());
  const [dismissedAnomalias, setDismissedAnomalias] = useState<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem(LS_KEY);
    if (raw) setDismissedId(parseInt(raw, 10));
  }, []);

  function dismissRend() {
    if (!ultimoPeriodoCerrado) return;
    localStorage.setItem(LS_KEY, String(ultimoPeriodoCerrado.id));
    setDismissedId(ultimoPeriodoCerrado.id);
  }

  // Stock
  const stockAlertas: { label: string; litros: number; umbral: number; max: number }[] = [];
  if (taller.litros < UMBRAL_TALLER)
    stockAlertas.push({ label: "Tanque Taller", litros: taller.litros, umbral: UMBRAL_TALLER, max: taller.max });
  if (nissan.litros < UMBRAL_NISSAN)
    stockAlertas.push({ label: "Tanque NISSAN", litros: nissan.litros, umbral: UMBRAL_NISSAN, max: nissan.max });

  const rendDismissed = mounted && dismissedId === ultimoPeriodoCerrado?.id;
  const showRend      = alertasRendimiento.length > 0 && !rendDismissed;

  const visibleStockAlertas  = stockAlertas.filter((a) => !dismissedStock.has(a.label));
  const visibleAnomalias     = anomaliasActivas.filter((_, i) => !dismissedAnomalias.has(i));
  const totalVisible = visibleStockAlertas.length + visibleAnomalias.length + (showRend ? 1 : 0);

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
          Alertas proactivas
        </p>
        {totalVisible > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
            {totalVisible}
          </span>
        )}
      </div>

      {totalVisible === 0 ? (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Todo en parámetros normales.
            {ultimoPeriodoCerrado && (
              <span className="ml-1 opacity-60">Último período: {ultimoPeriodoCerrado.nombre}.</span>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* ── Stock ───────────────────────────────────────── */}
          {visibleStockAlertas.map(({ label, litros, umbral, max }) => {
            const critico = litros < umbral * 0.5;
            const barPct  = Math.min(100, Math.round((litros / max) * 100));
            return (
              <div
                key={label}
                className="px-4 py-3 rounded-2xl border"
                style={{
                  backgroundColor: critico ? "rgb(239 68 68 / 0.06)" : "rgb(245 158 11 / 0.06)",
                  borderColor:     critico ? "rgb(239 68 68 / 0.25)" : "rgb(245 158 11 / 0.25)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg shrink-0 ${critico ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
                    <Fuel className={`w-3.5 h-3.5 ${critico ? "text-red-500" : "text-amber-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${critico ? "text-red-600" : "text-amber-600"}`}>
                      {label} — stock bajo{critico && " · crítico"}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                      {litros.toLocaleString()} L · umbral {umbral.toLocaleString()} L
                    </p>
                  </div>
                  <Link
                    href="/tanques"
                    className={`text-xs font-semibold shrink-0 underline underline-offset-2 ${critico ? "text-red-500" : "text-amber-500"}`}
                  >
                    Registrar recarga
                  </Link>
                  <button
                    onClick={() => setDismissedStock((prev) => new Set([...prev, label]))}
                    className="p-1 rounded-lg hover:bg-black/10 transition-colors shrink-0"
                    style={{ color: "var(--fg-muted)" }}
                    aria-label="Cerrar alerta"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* progress bar */}
                <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                  <div
                    className={`h-full rounded-full transition-all ${critico ? "bg-red-500" : "bg-amber-500"}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* ── Anomalías del período activo ────────────────── */}
          {visibleAnomalias.map((a, visIdx) => {
            const origIdx = anomaliasActivas.indexOf(a);
            return (
              <div
                key={origIdx}
                className="flex items-start gap-3 px-4 py-3 rounded-2xl border"
                style={{
                  backgroundColor: "rgb(245 158 11 / 0.06)",
                  borderColor:     "rgb(245 158 11 / 0.25)",
                }}
              >
                <div className="mt-0.5 p-1.5 rounded-lg shrink-0 bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-600">
                    {a.unidadCodigo} — anomalía detectada
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                    {a.detalle} · {a.fecha}
                  </p>
                </div>
                {periodoActivoId && (
                  <Link
                    href={`/cargas?periodoId=${periodoActivoId}`}
                    className="text-xs font-semibold shrink-0 text-amber-500 underline underline-offset-2"
                  >
                    Ver cargas
                  </Link>
                )}
                <button
                  onClick={() => setDismissedAnomalias((prev) => new Set([...prev, origIdx]))}
                  className="p-1 rounded-lg hover:bg-amber-500/10 transition-colors shrink-0"
                  style={{ color: "var(--fg-muted)" }}
                  aria-label="Cerrar anomalía"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {/* ── Rendimiento — tarjeta resumen colapsable ────── */}
          {showRend && ultimoPeriodoCerrado && (
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: "rgb(245 158 11 / 0.06)",
                borderColor:     "rgb(245 158 11 / 0.25)",
              }}
            >
              {/* header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="p-1.5 rounded-lg shrink-0 bg-amber-500/10 border border-amber-500/20">
                  <Gauge className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-600">
                    {alertasRendimiento.length} unidad{alertasRendimiento.length > 1 ? "es" : ""} con rendimiento bajo
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                    Período: {ultimoPeriodoCerrado.nombre}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/periodos/${ultimoPeriodoCerrado.id}`}
                    className="text-xs font-semibold text-amber-500 underline underline-offset-2"
                  >
                    Ver análisis
                  </Link>
                  <button
                    onClick={() => setRendExpanded((v) => !v)}
                    className="ml-2 p-1 rounded-lg hover:bg-amber-500/10 transition-colors"
                    style={{ color: "var(--fg-muted)" }}
                    aria-label="Expandir"
                  >
                    {rendExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={dismissRend}
                    className="p-1 rounded-lg hover:bg-amber-500/10 transition-colors"
                    style={{ color: "var(--fg-muted)" }}
                    aria-label="Descartar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* expanded detail */}
              {rendExpanded && (
                <div className="border-t px-4 py-2 space-y-1" style={{ borderColor: "rgb(245 158 11 / 0.25)" }}>
                  {alertasRendimiento.map((a) => {
                    const pctAbs  = Math.abs(a.diferenciaPct);
                    const critico = pctAbs > 20;
                    return (
                      <div key={a.unidadId} className="flex items-center gap-2 py-1.5">
                        <span className="text-xs font-semibold w-14 shrink-0" style={{ color: "var(--fg)" }}>
                          {a.unidadCodigo}
                        </span>
                        <span className="text-xs flex-1" style={{ color: "var(--fg-muted)" }}>
                          {a.rendimientoActual.toFixed(2)} L/km · ref {a.rendimientoReferencia.toFixed(2)} L/km
                        </span>
                        <span className={`text-xs font-bold tabular-nums ${critico ? "text-red-500" : "text-amber-500"}`}>
                          {a.diferenciaPct > 0 ? "+" : ""}{a.diferenciaPct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
