import Link from "next/link";
import { HardHat, Gauge, Banknote } from "lucide-react";

export type OperacionResumen = {
  desde: string;
  hasta: string;
  precioLitro: number | null;
  litrosCampo: number;
  litrosPatio: number;
  costoCampo: number | null;
  nissanDias: number | null;
  obras: { id: number; nombre: string; litros: number; cargas: number }[];
};

type PeorRendimiento = {
  unidadId: number;
  unidadCodigo: string;
  tipo: string;
  rendimientoActual: number;
  rendimientoReferencia: number;
  diferenciaPct: number;
};

function mxn(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

function fmtFecha(fecha: string) {
  const [y, m, d] = fecha.slice(0, 10).split("-");
  return `${d}/${m}`;
}

export default function OperacionPanel({
  operacion,
  peorRendimiento,
  periodoCerradoId,
}: {
  operacion: OperacionResumen;
  peorRendimiento: PeorRendimiento[];
  periodoCerradoId: number | null;
}) {
  const maxObra = Math.max(1, ...operacion.obras.map((o) => o.litros));
  const peores = [...peorRendimiento]
    .sort((a, b) => Math.abs(b.diferenciaPct) - Math.abs(a.diferenciaPct))
    .slice(0, 5);
  const showObras = operacion.obras.length > 0 && operacion.litrosCampo > 0;
  const showRend = peores.length > 0;
  if (!showObras && !showRend) return null;

  return (
    <section className={`mb-6 grid grid-cols-1 gap-4 ${showObras && showRend ? "lg:grid-cols-2" : ""}`}>
      {showObras && <div
        className="rounded-2xl border p-5"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
              Diesel por obra
            </p>
            <p className="font-outfit font-bold text-lg mt-0.5" style={{ color: "var(--fg)" }}>
              Campo · {fmtFecha(operacion.desde)} – {fmtFecha(operacion.hasta)}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <HardHat className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-4">
          <span className="font-semibold" style={{ color: "var(--fg)" }}>
            {Math.round(operacion.litrosCampo).toLocaleString("es-MX")} L
          </span>
          {operacion.costoCampo != null && (
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <Banknote className="w-3.5 h-3.5" />
              {mxn(operacion.costoCampo)}
            </span>
          )}
          {operacion.precioLitro != null && (
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
              a {operacion.precioLitro.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}/L
            </span>
          )}
        </div>

        <ul className="space-y-2.5">
            {operacion.obras.map((o) => (
              <li key={o.id}>
                <Link href={`/catalogo/obras/${o.id}`} className="block group">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium group-hover:underline" style={{ color: "var(--fg)" }}>
                      {o.nombre}
                    </span>
                    <span className="font-mono tabular-nums" style={{ color: "var(--fg-muted)" }}>
                      {Math.round(o.litros).toLocaleString("es-MX")} L
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--surface-2)" }}>
                    <div
                      className="h-full rounded-full bg-amber-500/80"
                      style={{ width: `${Math.round((o.litros / maxObra) * 100)}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>

        <p className="text-[11px] mt-4 leading-snug" style={{ color: "var(--fg-muted)" }}>
          Solo NISSAN (campo) lleva obra. Patio esta ventana:{" "}
          {Math.round(operacion.litrosPatio).toLocaleString("es-MX")} L sin proyecto.
          {operacion.nissanDias != null && operacion.nissanDias < 14 && (
            <> NISSAN al ritmo de campo: ~{operacion.nissanDias.toFixed(1)} días.</>
          )}
        </p>
      </div>}

      {showRend && <div
        className="rounded-2xl border p-5"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
              A vigilar
            </p>
            <p className="font-outfit font-bold text-lg mt-0.5" style={{ color: "var(--fg)" }}>
              Unidades que no rinden
            </p>
          </div>
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <Gauge className="w-4 h-4 text-red-500" />
          </div>
        </div>

        <ul className="space-y-2">
            {peores.map((u) => (
              <li key={u.unidadId}>
                <Link
                  href={`/catalogo/unidades/${u.unidadId}`}
                  className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 -mx-2 hover:bg-[var(--surface-2)]"
                >
                  <span className="font-medium text-sm" style={{ color: "var(--fg)" }}>
                    {u.unidadCodigo}
                  </span>
                  <span className="text-xs font-mono text-red-600">
                    {u.diferenciaPct.toFixed(0)}%
                    <span className="ml-1" style={{ color: "var(--fg-muted)" }}>
                      {u.tipo === "camion" ? "km/L" : "L/hr"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

        {periodoCerradoId != null && (
          <Link
            href="/periodos"
            className="inline-block text-xs font-semibold mt-4 underline underline-offset-2"
            style={{ color: "var(--fg-muted)" }}
          >
            Ver período cerrado
          </Link>
        )}
      </div>}
    </section>
  );
}
