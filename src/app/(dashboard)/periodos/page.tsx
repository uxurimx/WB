export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Calendar, ChevronRight, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPeriodosConStats } from "@/app/actions/rendimientos";
import CerrarPeriodoModal from "@/components/periodos/CerrarPeriodoModal";

function formatRango(inicio: string, fin: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = new Date(inicio + "T12:00:00").toLocaleDateString("es-MX", opts);
  const f = new Date(fin + "T12:00:00").toLocaleDateString("es-MX", {
    ...opts,
    year: "numeric",
  });
  return `${s} – ${f}`;
}

export default async function PeriodosPage() {
  const periodos = await getPeriodosConStats();

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--fg-muted)" }}
          >
            Ciclos
          </p>
        </div>
        <h1
          className="font-outfit font-bold text-3xl"
          style={{ color: "var(--fg)" }}
        >
          Períodos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Semanas de trabajo (sábado → viernes). Al cerrar un período se
          calculan rendimientos automáticamente.
        </p>
      </div>

      {periodos.length === 0 ? (
        <div
          className="p-8 rounded-2xl border text-center"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Sin períodos creados. Se crean automáticamente al registrar la
            primera carga.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {periodos.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl border"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: p.cerrado ? "var(--border)" : "rgb(99 102 241 / 0.3)",
              }}
            >
              <div className="flex items-start gap-4 flex-wrap">
                {/* Icon status */}
                <div className="mt-0.5 shrink-0">
                  {p.cerrado ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-indigo-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p
                      className="font-semibold text-sm"
                      style={{ color: "var(--fg)" }}
                    >
                      {p.nombre}
                    </p>
                    {p.cerrado ? (
                      <Badge variant="success">Cerrado</Badge>
                    ) : (
                      <Badge variant="default">Activo</Badge>
                    )}
                    {!p.cerrado && p.fueraTolerancia > 0 && (
                      <Badge variant="danger">
                        {p.fueraTolerancia} fuera tolerancia
                      </Badge>
                    )}
                  </div>

                  <p
                    className="text-xs mb-3"
                    style={{ color: "var(--fg-muted)" }}
                  >
                    {formatRango(p.fechaInicio, p.fechaFin)}
                  </p>

                  {/* Stats row */}
                  <div className="flex gap-4 flex-wrap">
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      <span
                        className="font-mono font-bold text-sm"
                        style={{ color: "var(--fg)" }}
                      >
                        {p.totalCargas}
                      </span>{" "}
                      cargas
                    </span>
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      <span
                        className="font-mono font-bold text-sm"
                        style={{ color: "var(--fg)" }}
                      >
                        {p.litrosTotales.toLocaleString()}
                      </span>{" "}
                      L
                    </span>
                    {p.cerrado && (
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                        <span
                          className="font-mono font-bold text-sm"
                          style={{ color: "var(--fg)" }}
                        >
                          {p.totalRendimientos}
                        </span>{" "}
                        rendimientos
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!p.cerrado ? (
                    <CerrarPeriodoModal
                      periodoId={p.id}
                      periodoNombre={p.nombre}
                      totalCargas={p.totalCargas}
                    />
                  ) : (
                    <Link href={`/periodos/${p.id}`}>
                      <Badge
                        variant="secondary"
                        className="cursor-pointer flex items-center gap-1 px-3 py-1"
                      >
                        Ver rendimientos{" "}
                        <ChevronRight className="w-3 h-3" />
                      </Badge>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
