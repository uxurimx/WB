import { CheckCircle2, Fuel, Gauge } from "lucide-react";
import { UMBRAL_TALLER, UMBRAL_NISSAN, type AlertaRendimiento } from "@/lib/alertas-config";

type StockInfo = { litros: number; max: number };

interface AlertasPanelProps {
  taller: StockInfo;
  nissan: StockInfo;
  alertasRendimiento: AlertaRendimiento[];
  ultimoPeriodo: { nombre: string } | null;
}

export default function AlertasPanel({
  taller,
  nissan,
  alertasRendimiento,
  ultimoPeriodo,
}: AlertasPanelProps) {
  const stockAlertas: { label: string; litros: number; umbral: number }[] = [];

  if (taller.litros < UMBRAL_TALLER) {
    stockAlertas.push({ label: "Tanque Taller", litros: taller.litros, umbral: UMBRAL_TALLER });
  }
  if (nissan.litros < UMBRAL_NISSAN) {
    stockAlertas.push({ label: "Tanque NISSAN", litros: nissan.litros, umbral: UMBRAL_NISSAN });
  }

  const totalAlertas = stockAlertas.length + alertasRendimiento.length;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--fg-muted)" }}
        >
          Alertas proactivas
        </p>
        {totalAlertas > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold leading-none">
            {totalAlertas}
          </span>
        )}
      </div>

      {totalAlertas === 0 ? (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Todo en parámetros normales.
            {ultimoPeriodo && (
              <span className="ml-1 opacity-60">Último período revisado: {ultimoPeriodo.nombre}.</span>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Alertas de stock */}
          {stockAlertas.map(({ label, litros, umbral }) => {
            const pct = Math.round((litros / umbral) * 100);
            const critico = litros < umbral * 0.5;
            return (
              <div
                key={label}
                className="flex items-start gap-3 px-4 py-3 rounded-2xl border"
                style={{
                  backgroundColor: critico ? "rgb(239 68 68 / 0.06)" : "rgb(245 158 11 / 0.06)",
                  borderColor:     critico ? "rgb(239 68 68 / 0.25)" : "rgb(245 158 11 / 0.25)",
                }}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    critico
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-amber-500/10 border border-amber-500/20"
                  }`}
                >
                  <Fuel className={`w-3.5 h-3.5 ${critico ? "text-red-500" : "text-amber-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${critico ? "text-red-600" : "text-amber-600"}`}
                  >
                    {label} — stock bajo
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                    {litros.toLocaleString()} L disponibles · umbral mínimo {umbral.toLocaleString()} L
                    {critico && " · Requiere recarga inmediata"}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold tabular-nums shrink-0 ${
                    critico ? "text-red-500" : "text-amber-500"
                  }`}
                >
                  {pct}%
                </span>
              </div>
            );
          })}

          {/* Alertas de rendimiento */}
          {alertasRendimiento.map((a) => {
            const pctAbs = Math.abs(a.diferenciaPct);
            const critico = pctAbs > 20;
            return (
              <div
                key={a.unidadId}
                className="flex items-start gap-3 px-4 py-3 rounded-2xl border"
                style={{
                  backgroundColor: critico ? "rgb(239 68 68 / 0.06)" : "rgb(245 158 11 / 0.06)",
                  borderColor:     critico ? "rgb(239 68 68 / 0.25)" : "rgb(245 158 11 / 0.25)",
                }}
              >
                <div
                  className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    critico
                      ? "bg-red-500/10 border border-red-500/20"
                      : "bg-amber-500/10 border border-amber-500/20"
                  }`}
                >
                  <Gauge className={`w-3.5 h-3.5 ${critico ? "text-red-500" : "text-amber-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${critico ? "text-red-600" : "text-amber-600"}`}
                  >
                    {a.unidadCodigo} — rendimiento bajo
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
                    {a.rendimientoActual.toFixed(2)} L/km real ·{" "}
                    referencia {a.rendimientoReferencia.toFixed(2)} L/km · período {a.periodoNombre}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold tabular-nums shrink-0 ${
                    critico ? "text-red-500" : "text-amber-500"
                  }`}
                >
                  {a.diferenciaPct > 0 ? "+" : ""}
                  {a.diferenciaPct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
