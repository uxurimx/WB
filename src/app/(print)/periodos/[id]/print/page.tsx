import { notFound } from "next/navigation";
import { db } from "@/db";
import { periodos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCargas } from "@/app/actions/cargas";
import { getRendimientosPeriodo } from "@/app/actions/rendimientos";
import PrintClient from "./PrintClient";

function fmtFecha(f: string) {
  return new Date(f + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRango(inicio: string, fin: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `${new Date(inicio + "T12:00:00").toLocaleDateString("es-MX", opts)} — ${new Date(fin + "T12:00:00").toLocaleDateString("es-MX", opts)}`;
}

function fmtNum(n: number | null, d = 1) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const periodoId = parseInt(id);
  if (isNaN(periodoId)) notFound();

  const [periodo, cargasData, rends] = await Promise.all([
    db.query.periodos.findFirst({ where: eq(periodos.id, periodoId) }),
    getCargas({ periodoId, limit: 1000 }),
    getRendimientosPeriodo(periodoId),
  ]);

  if (!periodo) notFound();

  const totalLitros = cargasData.reduce((s, c) => s + (c.litros ?? 0), 0);
  const unidadesDistintas = new Set(cargasData.map((c) => c.unidadId)).size;
  const hoy = new Date().toLocaleDateString("es-MX", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      {/* Print + screen styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 11px; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          h2 { page-break-after: avoid; }
        }
        body { background: white !important; color: #111 !important; }
      `}</style>

      <div className="min-h-screen p-8 max-w-5xl mx-auto" style={{ color: "#111", background: "white" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              Reporte de Período
            </p>
            <h1 className="text-3xl font-bold mb-1">{periodo.nombre}</h1>
            <p className="text-sm text-gray-500">{fmtRango(periodo.fechaInicio, periodo.fechaFin)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 mb-3">Generado el {hoy}</p>
            <PrintClient />
          </div>
        </div>

        {/* Resumen stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total cargas", value: cargasData.length },
            { label: "Litros despachados", value: `${totalLitros.toLocaleString()} L` },
            { label: "Unidades activas", value: unidadesDistintas },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl border border-gray-200 text-center">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Rendimientos */}
        {rends.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">
              Rendimientos
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {["Unidad", "Tipo", "Litros", "Km / Hrs", "Rendimiento", "Referencia", "Δ", "Estado"].map((h) => (
                    <th key={h} className="px-3 py-2 border border-gray-200 font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rends.map((r) => {
                  const tipo = r.unidad?.tipo ?? "otro";
                  const unidad_km = tipo === "camion" ? "km/L" : "L/Hr";
                  const ok = r.dentroDeTolerancia;
                  return (
                    <tr key={r.id} className={ok === false ? "bg-red-50" : ok === true ? "bg-green-50" : ""}>
                      <td className="px-3 py-1.5 border border-gray-200 font-mono font-bold">
                        {r.unidad?.codigo ?? `#${r.unidadId}`}
                      </td>
                      <td className="px-3 py-1.5 border border-gray-200 text-xs capitalize">
                        {tipo === "camion" ? "Camión" : "Maquinaria"}
                      </td>
                      <td className="px-3 py-1.5 border border-gray-200 font-mono text-right">
                        {fmtNum(r.litrosConsumidos, 0)} L
                      </td>
                      <td className="px-3 py-1.5 border border-gray-200 font-mono text-right text-gray-500">
                        {fmtNum(r.kmHrsRecorridos, 0)}{r.kmHrsRecorridos !== null ? (tipo === "camion" ? " km" : " hrs") : ""}
                      </td>
                      <td className="px-3 py-1.5 border border-gray-200 font-mono text-right font-semibold">
                        {r.rendimientoActual !== null ? `${fmtNum(r.rendimientoActual, 2)} ${unidad_km}` : "—"}
                      </td>
                      <td className="px-3 py-1.5 border border-gray-200 font-mono text-right text-gray-500">
                        {r.rendimientoReferencia !== null ? `${fmtNum(r.rendimientoReferencia, 2)} ${unidad_km}` : "—"}
                      </td>
                      <td className="px-3 py-1.5 border border-gray-200 font-mono text-right">
                        {r.diferencia !== null
                          ? `${r.diferencia > 0 ? "+" : ""}${fmtNum(r.diferencia, 2)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-1.5 border border-gray-200 text-center text-xs font-semibold">
                        {ok === true ? "✓ OK" : ok === false ? "✗ Fuera" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-xs text-gray-400 mt-1">
              Tolerancia ±20%. Camiones: km/L · Maquinaria: L/Hr
            </p>
          </section>
        )}

        {/* Cargas */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">
            Detalle de cargas ({cargasData.length})
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-left">
                {["Folio", "Fecha", "Unidad", "Operador", "Litros", "Origen", "Diesel", "Odo/Hrs"].map((h) => (
                  <th key={h} className="px-3 py-2 border border-gray-200 font-semibold text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargasData.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-1.5 border border-gray-200 font-mono font-semibold">
                    {c.folio ?? "—"}
                  </td>
                  <td className="px-3 py-1.5 border border-gray-200 text-xs">
                    {fmtFecha(c.fecha)}{c.hora ? ` ${c.hora.slice(0, 5)}` : ""}
                  </td>
                  <td className="px-3 py-1.5 border border-gray-200 font-mono font-bold">
                    {c.unidad?.codigo ?? `#${c.unidadId}`}
                  </td>
                  <td className="px-3 py-1.5 border border-gray-200">
                    {c.operador?.nombre ?? "—"}
                  </td>
                  <td className="px-3 py-1.5 border border-gray-200 font-mono text-right font-semibold">
                    {c.litros.toLocaleString()} L
                  </td>
                  <td className="px-3 py-1.5 border border-gray-200 capitalize text-xs">
                    {c.origen}
                  </td>
                  <td className="px-3 py-1.5 border border-gray-200 text-xs capitalize">
                    {c.tipoDiesel ?? "normal"}
                  </td>
                  <td className="px-3 py-1.5 border border-gray-200 font-mono text-right text-gray-500">
                    {c.odometroHrs ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400 flex justify-between no-print">
          <span>WB Diesel Control</span>
          <span>{hoy}</span>
        </div>
      </div>
    </>
  );
}
