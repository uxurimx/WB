"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type PusherClient from "pusher-js";
import Link from "next/link";
import {
  Fuel, Truck, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight,
  SlidersHorizontal, AlertTriangle, CheckCircle2, Clock, FileText,
  TrendingDown, DollarSign, Droplets, ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import RecargaTanqueModal from "@/components/dashboard/RecargaTanqueModal";
import TransferirNissanModal from "@/components/dashboard/TransferirNissanModal";
import EditarTanqueModal from "@/components/dashboard/EditarTanqueModal";
import AjustarStockModal from "@/components/tanques/AjustarStockModal";
import type { TanqueDetalle, EventoTimeline } from "@/app/actions/tanques";

// ─── Gauge circular SVG ───────────────────────────────────────────────────────
function CircularGauge({ pct, color }: { pct: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 80 80" aria-hidden>
      <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
      <circle
        cx="40" cy="40" r={r} fill="none"
        stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="transition-all duration-700"
      />
    </svg>
  );
}

// ─── Proyección de agotamiento ────────────────────────────────────────────────
function ProyeccionBadge({ dias, fecha }: { dias: number | null; fecha: string | null }) {
  if (dias === null) {
    return (
      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
        Sin datos de consumo reciente
      </span>
    );
  }
  const urgente = dias < 3;
  const advertencia = dias < 10;
  const color = urgente ? "text-red-500" : advertencia ? "text-yellow-500" : "text-emerald-500";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      ~{Math.round(dias)} días hasta umbral mínimo
      {fecha && (
        <span className="font-normal ml-1" style={{ color: "var(--fg-muted)" }}>
          ({new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })})
        </span>
      )}
    </span>
  );
}

// ─── Fila de stat ─────────────────────────────────────────────────────────────
function StatRow({
  label, value, sub, icon: Icon,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="p-1.5 rounded-lg" style={{ backgroundColor: "var(--surface-2)" }}>
        <Icon className="w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{label}</p>
        <p className="text-sm font-semibold font-mono" style={{ color: "var(--fg)" }}>
          {value}
          {sub && <span className="font-normal ml-1 text-xs" style={{ color: "var(--fg-muted)" }}>{sub}</span>}
        </p>
      </div>
    </div>
  );
}

// ─── Card de conciliación ─────────────────────────────────────────────────────
function ConciliacionCard({ tanque }: { tanque: TanqueDetalle }) {
  const { conciliacion: c } = tanque;
  const pctDiff = c.teorico > 0 ? Math.abs(c.diferencia / c.teorico) * 100 : 0;

  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: c.ok ? "var(--border)" : "rgb(234 179 8 / 0.4)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
          Conciliación
        </p>
        {c.ok
          ? <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> OK</Badge>
          : <Badge variant="danger" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" /> Desviación</Badge>
        }
      </div>

      <div className="grid grid-cols-3 gap-2 text-center mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-muted)" }}>Sistema</p>
          <p className="font-mono font-bold text-base" style={{ color: "var(--fg)" }}>{c.actual.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-muted)" }}>Teórico</p>
          <p className="font-mono font-bold text-base" style={{ color: "var(--fg)" }}>{c.teorico.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-muted)" }}>Δ</p>
          <p
            className="font-mono font-bold text-base"
            style={{ color: Math.abs(c.diferencia) > c.tolerancia ? "rgb(234 179 8)" : "var(--fg)" }}
          >
            {c.diferencia >= 0 ? "+" : ""}{c.diferencia.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="text-xs mb-3" style={{ color: "var(--fg-muted)" }}>
        Tolerancia: ±{c.tolerancia.toFixed(0)} L ({tanque.ajustePorcentaje}% de merma)
        {!c.ok && ` · Desviación: ${pctDiff.toFixed(1)}%`}
      </p>

      {c.anclaFecha && (
        <p className="text-xs mb-3" style={{ color: "var(--fg-muted)" }}>
          Último ancla:{" "}
          <span className="font-mono" style={{ color: "var(--fg)" }}>
            {new Date(c.anclaFecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
            {" · "}{c.anclaLitros.toLocaleString()} L
          </span>
        </p>
      )}
    </div>
  );
}

// ─── Fila de timeline ─────────────────────────────────────────────────────────
const TIPO_CONFIG = {
  recarga: {
    icon: ArrowUpCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    signo: "+",
  },
  transferencia_entrada: {
    icon: ArrowDownCircle,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
    signo: "+",
  },
  transferencia_salida: {
    icon: ArrowLeftRight,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/20",
    signo: "−",
  },
  consumo_dia: {
    icon: TrendingDown,
    color: "text-slate-400",
    bg: "bg-slate-400/10",
    border: "border-slate-400/20",
    signo: "−",
  },
  ajuste: {
    icon: SlidersHorizontal,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/20",
    signo: "→",
  },
} as const;

function TimelineRow({ ev }: { ev: EventoTimeline }) {
  const cfg = TIPO_CONFIG[ev.tipo];
  const Icon = cfg.icon;
  const fechaFormateada = new Date(ev.fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });

  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
      <div className={`shrink-0 p-1.5 rounded-lg border ${cfg.bg} ${cfg.border} mt-0.5`}>
        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>
            {ev.detalle}
          </p>
          <p className={`text-sm font-mono font-bold shrink-0 ${cfg.color}`}>
            {cfg.signo}{ev.litros.toLocaleString()} L
          </p>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{fechaFormateada}</span>
          {ev.folioFactura && (
            <span className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>
              <FileText className="w-3 h-3 inline mr-0.5" />{ev.folioFactura}
            </span>
          )}
          {ev.folio && (
            <span className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>
              Folio #{ev.folio}
            </span>
          )}
          {ev.precioLitro && (
            <span className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>
              ${ev.precioLitro.toFixed(2)}/L
            </span>
          )}
          {ev.notas && (
            <span className="text-xs italic truncate" style={{ color: "var(--fg-muted)" }}>
              {ev.notas}
            </span>
          )}
          {ev.tipo === "consumo_dia" && (
            <Link
              href={`/cargas?desde=${ev.fecha}&hasta=${ev.fecha}`}
              className="text-xs font-semibold flex items-center gap-0.5 text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Ver cargas <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function sortTanques(items: TanqueDetalle[]) {
  return [...items].sort((a, b) => (a.nombre === "Taller" ? -1 : b.nombre === "Taller" ? 1 : 0));
}

// ─── Tarjeta principal de un tanque ──────────────────────────────────────────
function TanqueCard({
  tanque,
  tallerData,
  nissanData,
  onAjuste,
}: {
  tanque: TanqueDetalle;
  tallerData?: TanqueDetalle;
  nissanData?: TanqueDetalle;
  onAjuste: (id: number, litros: number) => void;
}) {
  const pct = tanque.capacidadMax > 0
    ? Math.round((tanque.litrosActuales / tanque.capacidadMax) * 100)
    : 0;
  const alerta = tanque.litrosActuales < tanque.umbral;
  const esTaller = tanque.nombre === "Taller";

  const gaugeColor = alerta
    ? "rgb(239 68 68)"
    : pct > 50
    ? esTaller ? "#6366f1" : "#8b5cf6"
    : "rgb(234 179 8)";

  const { estadisticas: s } = tanque;

  return (
    <div
      className="p-5 rounded-2xl border flex flex-col gap-4"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: alerta ? "rgb(239 68 68 / 0.3)" : "var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-lg border"
            style={{
              backgroundColor: esTaller ? "rgb(99 102 241 / 0.1)" : "rgb(139 92 246 / 0.1)",
              borderColor: esTaller ? "rgb(99 102 241 / 0.2)" : "rgb(139 92 246 / 0.2)",
            }}
          >
            {esTaller
              ? <Fuel className="w-4 h-4 text-indigo-500" />
              : <Truck className="w-4 h-4 text-violet-500" />
            }
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
              {tanque.nombre}
            </p>
            {alerta && (
              <p className="text-xs text-red-500 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Stock bajo
              </p>
            )}
          </div>
        </div>
        {/* Acciones */}
        <div className="flex items-center gap-1">
          {esTaller && tallerData && (
            <RecargaTanqueModal tanqueId={tanque.id} cuentalitrosActual={tanque.cuentalitrosActual} />
          )}
          {!esTaller && tallerData && nissanData && (
            <TransferirNissanModal
              tanqueOrigenId={tallerData.id}
              tanqueDestinoId={tanque.id}
              litrosDisponibles={tallerData.litrosActuales}
              cuentalitrosTaller={tallerData.cuentalitrosActual}
              onTransferComplete={() => {}}
            />
          )}
          <AjustarStockModal
            tanqueId={tanque.id}
            tanqueNombre={tanque.nombre}
            litrosActuales={tanque.litrosActuales}
            capacidadMax={tanque.capacidadMax}
            onSuccess={(l) => onAjuste(tanque.id, l)}
          />
          <EditarTanqueModal
            tanque={{
              id: tanque.id,
              nombre: tanque.nombre,
              litros: tanque.litrosActuales,
              max: tanque.capacidadMax,
              cuentalitros: tanque.cuentalitrosActual,
              ajustePorcentaje: tanque.ajustePorcentaje,
              ultimaActualizacion: tanque.ultimaActualizacion,
            }}
          />
        </div>
      </div>

      {/* Gauge + nivel */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0 w-32 h-32 flex items-center justify-center">
          <CircularGauge pct={pct} color={gaugeColor} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="font-outfit font-bold text-2xl leading-none" style={{ color: alerta ? "rgb(239 68 68)" : "var(--fg)" }}>
              {pct}%
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>lleno</p>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-outfit font-bold text-3xl" style={{ color: alerta ? "rgb(239 68 68)" : "var(--fg)" }}>
            {tanque.litrosActuales.toLocaleString()}
            <span className="text-base font-normal ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
          </p>
          <p className="text-xs mb-2" style={{ color: "var(--fg-muted)" }}>
            de {tanque.capacidadMax.toLocaleString()} L máx.
          </p>
          <ProyeccionBadge
            dias={s.diasHastaUmbral}
            fecha={s.fechaProyectadaUmbral}
          />
          {tanque.cuentalitrosActual > 0 && (
            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
              Cuentalitros:{" "}
              <span className="font-mono font-semibold" style={{ color: "var(--fg)" }}>
                {tanque.cuentalitrosActual.toLocaleString()}
              </span>
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px" style={{ backgroundColor: "var(--border)" }} />

      {/* Stats */}
      <div className="space-y-0.5">
        <StatRow
          icon={TrendingDown}
          label="Consumo promedio (7 días)"
          value={s.promedioDiario7d > 0 ? `${s.promedioDiario7d.toFixed(0)} L/día` : "—"}
          sub={s.totalConsumo7d > 0 ? `(${s.totalConsumo7d.toLocaleString()} L total)` : undefined}
        />
        <StatRow
          icon={Droplets}
          label="Consumo últimos 30 días"
          value={s.totalConsumo30d > 0 ? `${s.totalConsumo30d.toLocaleString()} L` : "—"}
          sub={s.promedioDiario30d > 0 ? `${s.promedioDiario30d.toFixed(0)} L/día` : undefined}
        />
        {s.totalRecargado30d > 0 && (
          <StatRow
            icon={ArrowUpCircle}
            label="Recargado últimos 30 días"
            value={`${s.totalRecargado30d.toLocaleString()} L`}
          />
        )}
        {s.costoPromedioLitro !== null && (
          <StatRow
            icon={DollarSign}
            label="Precio promedio por litro"
            value={`$${s.costoPromedioLitro.toFixed(2)}`}
            sub={s.totalCostoEstimado30d !== null
              ? `≈ $${s.totalCostoEstimado30d.toLocaleString(undefined, { maximumFractionDigits: 0 })} en 30 días`
              : undefined}
          />
        )}
      </div>

      {/* Conciliación — mt-auto la ancla al fondo del card para alineación entre ambos tanques */}
      <div className="mt-auto">
        <ConciliacionCard tanque={tanque} />
      </div>

      {/* Última actualización */}
      {tanque.ultimaActualizacion && (
        <p className="text-xs flex items-center gap-1" style={{ color: "var(--fg-muted)" }}>
          <Clock className="w-3 h-3" />
          Actualizado{" "}
          {new Date(tanque.ultimaActualizacion).toLocaleString("es-MX", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
        </p>
      )}
    </div>
  );
}

// ─── Componente principal exportado ──────────────────────────────────────────
export default function TanquesClient({ tanques }: { tanques: TanqueDetalle[] }) {
  const router = useRouter();
  const pusherRef = useRef<PusherClient | null>(null);

  // Taller siempre primero en el orden de render
  const [tanqueActivo, setTanqueActivo] = useState<number>(
    tanques.find((t) => t.nombre === "Taller")?.id ?? tanques[0]?.id ?? 0
  );
  const [localTanques, setLocalTanques] = useState(() => sortTanques(tanques));

  useEffect(() => {
    setLocalTanques(sortTanques(tanques));
  }, [tanques]);

  useEffect(() => {
    const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    let cancelled = false;
    import("pusher-js").then(({ default: Pusher }) => {
      if (cancelled || pusherRef.current) return;
      const client = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" });
      pusherRef.current = client;
      const ch = client.subscribe("private-stock");
      ch.bind(
        "stock-actualizado",
        (data: { tanque: string; litrosActuales: number; cuentalitros?: number }) => {
          setLocalTanques((prev) =>
            prev.map((t) =>
              t.nombre === data.tanque
                ? {
                    ...t,
                    litrosActuales: data.litrosActuales,
                    ...(data.cuentalitros !== undefined ? { cuentalitrosActual: data.cuentalitros } : {}),
                    ultimaActualizacion: new Date().toISOString(),
                  }
                : t
            )
          );
          router.refresh();
        }
      );
    });

    return () => {
      cancelled = true;
      if (pusherRef.current) {
        pusherRef.current.unsubscribe("private-stock");
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [router]);

  const taller = localTanques.find((t) => t.nombre === "Taller");
  const nissan  = localTanques.find((t) => t.nombre === "NISSAN");
  const activo  = localTanques.find((t) => t.id === tanqueActivo) ?? localTanques[0];

  function handleAjuste(id: number, litros: number) {
    setLocalTanques((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, litrosActuales: litros }
          : t
      )
    );
    router.refresh();
  }

  const timeline = activo?.timeline ?? [];

  return (
    <div className="p-6 md:p-8 max-w-[1536px]">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>
          Inventario
        </p>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Control de Tanques
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
          Niveles, consumo, conciliación y ajustes de inventario.
        </p>
      </div>

      {/* Cards de tanques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
        {taller && (
          <TanqueCard
            tanque={taller}
            tallerData={taller}
            nissanData={nissan}
            onAjuste={handleAjuste}
          />
        )}
        {nissan && (
          <TanqueCard
            tanque={nissan}
            tallerData={taller}
            nissanData={nissan}
            onAjuste={handleAjuste}
          />
        )}
      </div>

      {/* Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h2 className="font-outfit font-semibold text-lg" style={{ color: "var(--fg)" }}>
              Historial de movimientos
            </h2>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Recargas, transferencias, consumo diario y ajustes — últimos 30 días aprox.
            </p>
          </div>
          {/* Selector de tanque */}
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {localTanques.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTanqueActivo(t.id)}
                className="px-4 py-1.5 text-sm font-medium transition-colors"
                style={{
                  backgroundColor: t.id === tanqueActivo ? "var(--accent)" : "var(--surface)",
                  color: t.id === tanqueActivo ? "white" : "var(--fg-muted)",
                }}
              >
                {t.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          {(Object.entries(TIPO_CONFIG) as [keyof typeof TIPO_CONFIG, (typeof TIPO_CONFIG)[keyof typeof TIPO_CONFIG]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const labels: Record<string, string> = {
              recarga: "Recarga",
              transferencia_entrada: "Entrada transfer.",
              transferencia_salida: "Salida transfer.",
              consumo_dia: "Consumo",
              ajuste: "Ajuste",
            };
            return (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`p-1 rounded border ${cfg.bg} ${cfg.border}`}>
                  <Icon className={`w-3 h-3 ${cfg.color}`} />
                </div>
                <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{labels[key]}</span>
              </div>
            );
          })}
        </div>

        {/* Feed */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          {timeline.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                Sin movimientos registrados para este tanque.
              </p>
            </div>
          ) : (
            <div className="divide-y px-4" style={{ borderColor: "var(--border)" }}>
              {timeline.map((ev) => (
                <TimelineRow key={ev.id} ev={ev} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
