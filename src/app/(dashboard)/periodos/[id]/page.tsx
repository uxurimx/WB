import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { periodos } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getRendimientosPeriodo,
} from "@/app/actions/rendimientos";
import ReporteActions from "@/components/periodos/ReporteActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatRango(inicio: string, fin: string) {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  const s = new Date(inicio + "T12:00:00").toLocaleDateString("es-MX", opts);
  const f = new Date(fin + "T12:00:00").toLocaleDateString("es-MX", opts);
  return `${s} — ${f}`;
}

function fmtNum(n: number | null, decimals = 1) {
  if (n === null) return "—";
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function DeltaBadge({
  diferencia,
  dentroDeTolerancia,
  tipo,
}: {
  diferencia: number | null;
  dentroDeTolerancia: boolean | null;
  tipo: string;
}) {
  if (diferencia === null || dentroDeTolerancia === null) {
    return (
      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
        Sin ref.
      </span>
    );
  }

  // Para camiones: mayor km/L es mejor (+) → verde
  // Para maquinas: menor L/Hr es mejor (-) → verde (invertido)
  const esMejora =
    tipo === "camion" ? diferencia >= 0 : diferencia <= 0;

  return (
    <div
      className={`flex items-center gap-1 text-xs font-semibold ${
        dentroDeTolerancia
          ? esMejora
            ? "text-emerald-500"
            : "text-emerald-500"
          : "text-red-500"
      }`}
    >
      {diferencia === 0 ? (
        <Minus className="w-3.5 h-3.5" />
      ) : esMejora ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {diferencia > 0 ? "+" : ""}
      {fmtNum(diferencia, 2)}
    </div>
  );
}

export default async function PeriodoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const periodoId = parseInt(id);
  if (isNaN(periodoId)) notFound();

  const [periodo, rends] = await Promise.all([
    db.query.periodos.findFirst({ where: eq(periodos.id, periodoId) }),
    getRendimientosPeriodo(periodoId),
  ]);

  if (!periodo) notFound();

  const totalLitros = rends.reduce(
    (s, r) => s + (r.litrosConsumidos ?? 0),
    0
  );
  const fueraTolerancia = rends.filter(
    (r) => r.dentroDeTolerancia === false
  ).length;
  const sinReferencia = rends.filter(
    (r) => r.rendimientoReferencia === null
  ).length;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/periodos"
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-500 transition-colors"
          style={{ color: "var(--fg-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Períodos
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--fg-muted)" }}
            >
              Rendimientos
            </p>
            <h1
              className="font-outfit font-bold text-3xl"
              style={{ color: "var(--fg)" }}
            >
              {periodo.nombre}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
              {formatRango(periodo.fechaInicio, periodo.fechaFin)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={periodo.cerrado ? "success" : "default"}>
              {periodo.cerrado ? "Cerrado" : "Activo"}
            </Badge>
            <ReporteActions periodoId={periodo.id} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Unidades", value: rends.length },
          { label: "Litros totales", value: `${totalLitros.toLocaleString()} L` },
          {
            label: "Fuera de tolerancia",
            value: fueraTolerancia,
            highlight: fueraTolerancia > 0,
          },
          { label: "Sin referencia", value: sinReferencia },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className="p-4 rounded-2xl border text-center"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
            }}
          >
            <p
              className="font-outfit font-bold text-2xl"
              style={{ color: highlight ? "rgb(239 68 68)" : "var(--fg)" }}
            >
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Tabla de rendimientos */}
      {rends.length === 0 ? (
        <div
          className="p-8 rounded-2xl border text-center"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--border)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            {periodo.cerrado
              ? "No se generaron rendimientos para este período."
              : "Los rendimientos se calcularán al cerrar el período."}
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: "var(--surface)" }}>
                <TableHead>Unidad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Litros</TableHead>
                <TableHead className="text-right">Km / Hrs</TableHead>
                <TableHead className="text-right">Rendimiento</TableHead>
                <TableHead className="text-right">Referencia</TableHead>
                <TableHead className="text-right">Δ</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rends.map((r) => {
                const unidad = r.unidad;
                const tipo = unidad?.tipo ?? "otro";
                const unidad_km = tipo === "camion" ? "km/L" : "L/Hr";

                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span className="font-mono font-bold text-sm">
                        {unidad?.codigo ?? `#${r.unidadId}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {tipo === "camion" ? "Camión" : "Maquinaria"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {fmtNum(r.litrosConsumidos, 0)} L
                    </TableCell>
                    <TableCell
                      className="text-right font-mono text-sm"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {fmtNum(r.kmHrsRecorridos, 0)}
                      {r.kmHrsRecorridos !== null
                        ? tipo === "camion"
                          ? " km"
                          : " hrs"
                        : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.rendimientoActual !== null ? (
                        <span className="font-mono font-semibold text-sm">
                          {fmtNum(r.rendimientoActual, 2)}{" "}
                          <span
                            className="text-xs font-normal"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            {unidad_km}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--fg-muted)" }}>—</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-right font-mono text-sm"
                      style={{ color: "var(--fg-muted)" }}
                    >
                      {r.rendimientoReferencia !== null
                        ? `${fmtNum(r.rendimientoReferencia, 2)} ${unidad_km}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeltaBadge
                        diferencia={r.diferencia}
                        dentroDeTolerancia={r.dentroDeTolerancia}
                        tipo={tipo}
                      />
                    </TableCell>
                    <TableCell>
                      {r.dentroDeTolerancia === true ? (
                        <Badge variant="success">OK</Badge>
                      ) : r.dentroDeTolerancia === false ? (
                        <Badge variant="danger">Fuera</Badge>
                      ) : r.rendimientoActual === null ? (
                        <Badge variant="secondary">Sin datos</Badge>
                      ) : (
                        <Badge variant="secondary">Sin ref.</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Nota tolerancia */}
      {rends.length > 0 && (
        <p className="mt-3 text-xs" style={{ color: "var(--fg-muted)" }}>
          Tolerancia aplicada: ±20% sobre rendimiento de referencia.
          Camiones: km/L · Maquinaria: L/Hr
        </p>
      )}
    </div>
  );
}
