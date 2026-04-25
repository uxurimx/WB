import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { periodos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRendimientosPeriodo } from "@/app/actions/rendimientos";
import AnalisisPeriodoClient from "@/components/periodos/AnalisisPeriodoClient";

function formatRango(inicio: string, fin: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const s = new Date(inicio + "T12:00:00").toLocaleDateString("es-MX", opts);
  const f = new Date(fin   + "T12:00:00").toLocaleDateString("es-MX", opts);
  return `${s} — ${f}`;
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
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>
              Rendimientos
            </p>
            <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
              {periodo.nombre}
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
              {formatRango(periodo.fechaInicio, periodo.fechaFin)}
            </p>
          </div>
          <Badge variant={periodo.cerrado ? "success" : "default"}>
            {periodo.cerrado ? "Cerrado" : "Activo"}
          </Badge>
        </div>
      </div>

      {rends.length === 0 ? (
        <div
          className="p-8 rounded-2xl border text-center"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            {periodo.cerrado
              ? "No se generaron rendimientos para este período."
              : "Los rendimientos se calcularán al cerrar el período."}
          </p>
        </div>
      ) : (
        <AnalisisPeriodoClient rends={rends} periodoId={periodo.id} />
      )}
    </div>
  );
}
