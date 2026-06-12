"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, X, TrendingUp, TrendingDown, Minus, ArrowUpDown, ChevronUp, ChevronDown,
  RefreshCw, AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import ReporteActions from "./ReporteActions";
import { recalcularRendimientos } from "@/app/actions/rendimientos";
import type { getRendimientosPeriodo } from "@/app/actions/rendimientos";

type Rend = Awaited<ReturnType<typeof getRendimientosPeriodo>>[number];
type FiltroTipo   = "todos" | "camion" | "maquina";
type FiltroEstado = "todos" | "ok" | "fuera" | "sin_ref";
type SortCol = "codigo" | "litros" | "kmhrs" | "rendimiento" | "diferencia" | "estado";

function fmtNum(n: number | null, d = 1) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function DeltaBadge({ diferencia, dentroDeTolerancia, tipo }: {
  diferencia: number | null; dentroDeTolerancia: boolean | null; tipo: string;
}) {
  if (diferencia === null || dentroDeTolerancia === null) {
    return <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Sin ref.</span>;
  }
  const esMejora = tipo === "camion" ? diferencia >= 0 : diferencia <= 0;
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold ${dentroDeTolerancia ? "text-emerald-500" : "text-red-500"}`}>
      {diferencia === 0 ? <Minus className="w-3.5 h-3.5" /> : esMejora ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {diferencia > 0 ? "+" : ""}{fmtNum(diferencia, 2)}
    </div>
  );
}

function SortIcon({ col, current, dir }: { col: SortCol; current: SortCol; dir: "asc" | "desc" }) {
  if (col !== current) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
  return dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
}

export default function AnalisisPeriodoClient({
  rends,
  periodoId,
  periodoCerrado = true,
}: {
  rends: Rend[];
  periodoId: number;
  periodoCerrado?: boolean;
}) {
  const [busqueda, setBusqueda]         = useState("");
  const [filtroTipo, setFiltroTipo]     = useState<FiltroTipo>("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [sortCol, setSortCol]           = useState<SortCol>("codigo");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");
  const router = useRouter();
  const [showFiltros, setShowFiltros]   = useState(false);
  const [recalcMsg, setRecalcMsg]       = useState("");
  const [recalcError, setRecalcError]   = useState("");
  const [isPendingRecalc, startRecalc]  = useTransition();

  const filtrados: Rend[] = useMemo(() => {
    let r = rends;

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      r = r.filter((x) => (x.unidad?.codigo ?? "").toLowerCase().includes(q));
    }
    if (filtroTipo !== "todos") {
      r = r.filter((x) => {
        const t = x.unidad?.tipo ?? "otro";
        return filtroTipo === "camion" ? t === "camion" : t !== "camion";
      });
    }
    if (filtroEstado !== "todos") {
      r = r.filter((x) => {
        if (filtroEstado === "ok")      return x.dentroDeTolerancia === true;
        if (filtroEstado === "fuera")   return x.dentroDeTolerancia === false;
        if (filtroEstado === "sin_ref") return x.rendimientoReferencia === null || x.rendimientoActual === null;
        return true;
      });
    }

    return [...r].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case "codigo":
          cmp = (a.unidad?.codigo ?? "").localeCompare(b.unidad?.codigo ?? "");
          break;
        case "litros":
          cmp = (a.litrosConsumidos ?? 0) - (b.litrosConsumidos ?? 0);
          break;
        case "kmhrs":
          cmp = (a.kmHrsRecorridos ?? 0) - (b.kmHrsRecorridos ?? 0);
          break;
        case "rendimiento":
          cmp = (a.rendimientoActual ?? 0) - (b.rendimientoActual ?? 0);
          break;
        case "diferencia":
          cmp = (a.diferencia ?? 0) - (b.diferencia ?? 0);
          break;
        case "estado": {
          const estadoVal = (x: Rend) =>
            x.dentroDeTolerancia === true ? 0 : x.dentroDeTolerancia === false ? 1 : 2;
          cmp = estadoVal(a) - estadoVal(b);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rends, busqueda, filtroTipo, filtroEstado, sortCol, sortDir]);

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  // Cards reactivas
  // El indicador solo cuenta desviaciones que empeoran: camión rinde menos (Δ<0),
  // maquinaria consume más (Δ>0). Las mejoras fuera de tolerancia no suman.
  const esEmpeora = (r: Rend) =>
    r.diferencia !== null &&
    (r.unidad?.tipo === "camion" ? r.diferencia < 0 : r.diferencia > 0);
  const totalLitros      = filtrados.reduce((s, r) => s + (r.litrosConsumidos ?? 0), 0);
  const fueraTolerancia  = filtrados.filter((r) => r.dentroDeTolerancia === false && esEmpeora(r)).length;
  const sinReferencia    = filtrados.filter((r) => r.rendimientoReferencia === null).length;

  const hayFiltros = !!(busqueda.trim() || filtroTipo !== "todos" || filtroEstado !== "todos");
  // Siempre pasar IDs en el orden actual (sort + filtro) para que print/excel respeten ambos
  const sortedUnidadIds = filtrados.map((r) => r.unidadId);

  function clearFiltros() {
    setBusqueda(""); setFiltroTipo("todos"); setFiltroEstado("todos");
  }

  function handleRecalcular() {
    setRecalcMsg(""); setRecalcError("");
    startRecalc(async () => {
      try {
        const res = await recalcularRendimientos(periodoId);
        setRecalcMsg(`Recalculado — ${res.rendimientosCreados} unidades actualizadas.`);
      } catch (err) {
        setRecalcError(err instanceof Error ? err.message : "Error al recalcular");
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <>
      {/* Banner recalcular */}
      {periodoCerrado && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5 p-3 rounded-xl border"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              ¿Los km parecen incorrectos? Recalcula para usar el odómetro del periodo anterior como referencia de inicio.
            </p>
          </div>
          <button
            onClick={handleRecalcular}
            disabled={isPendingRecalc}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-colors hover:bg-[var(--surface)] disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPendingRecalc ? "animate-spin" : ""}`} />
            {isPendingRecalc ? "Recalculando..." : "Recalcular rendimientos"}
          </button>
        </div>
      )}
      {recalcMsg && (
        <p className="text-xs text-emerald-500 mb-4 flex items-center gap-1.5">
          <RefreshCw className="w-3 h-3" /> {recalcMsg}
        </p>
      )}
      {recalcError && (
        <p className="text-xs text-red-500 mb-4">{recalcError}</p>
      )}

      {/* Cards reactivas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Unidades",          value: filtrados.length },
          { label: "Litros totales",    value: `${totalLitros.toLocaleString()} L` },
          { label: "Fuera tolerancia",  value: fueraTolerancia, highlight: fueraTolerancia > 0 },
          { label: "Sin referencia",    value: sinReferencia },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className="p-4 rounded-2xl border text-center"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
          >
            <p
              className="font-outfit font-bold text-2xl"
              style={{ color: highlight ? "rgb(239 68 68)" : "var(--fg)" }}
            >
              {value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Barra de búsqueda + filtros + acciones */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--fg-muted)" }} />
          <input
            type="text"
            placeholder="Buscar unidad…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 h-9 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-black/10">
              <X className="w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
            </button>
          )}
        </div>

        {/* Toggle filtros */}
        <button
          onClick={() => setShowFiltros((v) => !v)}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-colors ${showFiltros || filtroTipo !== "todos" || filtroEstado !== "todos" ? "border-indigo-500 text-indigo-500" : ""}`}
          style={{
            backgroundColor: "var(--surface)",
            borderColor: showFiltros || filtroTipo !== "todos" || filtroEstado !== "todos" ? undefined : "var(--border)",
            color: showFiltros || filtroTipo !== "todos" || filtroEstado !== "todos" ? undefined : "var(--fg-muted)",
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {(filtroTipo !== "todos" || filtroEstado !== "todos") && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-500 text-white text-xs leading-none">
              {[filtroTipo !== "todos" ? 1 : 0, filtroEstado !== "todos" ? 1 : 0].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>

        {/* Acciones print/excel */}
        <ReporteActions periodoId={periodoId} unidadIds={sortedUnidadIds} />
      </div>

      {/* Panel de filtros */}
      {showFiltros && (
        <div
          className="rounded-xl border p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
          style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          {/* Tipo */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-muted)" }}>
              Tipo
            </p>
            <div className="flex flex-wrap gap-1.5">
              {([
                ["todos",   "Todos"],
                ["camion",  "Camiones"],
                ["maquina", "Maquinaria"],
              ] as [FiltroTipo, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFiltroTipo(val)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filtroTipo === val ? "bg-indigo-500 text-white border-indigo-500" : "border-transparent"}`}
                  style={filtroTipo !== val ? { backgroundColor: "var(--surface)", color: "var(--fg-muted)", borderColor: "var(--border)" } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-muted)" }}>
              Estado
            </p>
            <div className="flex flex-wrap gap-1.5">
              {([
                ["todos",   "Todos"],
                ["ok",      "OK"],
                ["fuera",   "Fuera"],
                ["sin_ref", "Sin ref."],
              ] as [FiltroEstado, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFiltroEstado(val)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filtroEstado === val ? "bg-indigo-500 text-white border-indigo-500" : "border-transparent"}`}
                  style={filtroEstado !== val ? { backgroundColor: "var(--surface)", color: "var(--fg-muted)", borderColor: "var(--border)" } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {hayFiltros && (
            <div className="sm:col-span-2 flex justify-end">
              <button onClick={clearFiltros} className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info filtro activo */}
      {hayFiltros && (
        <p className="text-xs mb-3" style={{ color: "var(--fg-muted)" }}>
          Mostrando {filtrados.length} de {rends.length} unidades
          {" · Print y Excel respetarán este orden y filtro"}
        </p>
      )}

      {/* Tabla */}
      {filtrados.length === 0 ? (
        <div
          className="p-8 rounded-2xl border text-center"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Sin resultados para los filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: "var(--surface)" }}>
                {([
                  ["codigo",      "Unidad",      "text-left"],
                  ["tipo",        "Tipo",         "text-left"],
                  ["litros",      "Litros",       "text-right"],
                  ["kmhrs",       "Km / Hrs",     "text-right"],
                  ["rendimiento", "Rendimiento",  "text-right"],
                  ["referencia",  "Referencia",   "text-right"],
                  ["diferencia",  "Δ",            "text-right"],
                  ["estado",      "Estado",       "text-left"],
                ] as [SortCol | "tipo" | "referencia", string, string][]).map(([col, label, align]) => {
                  const sortable = col !== "tipo" && col !== "referencia";
                  return (
                    <TableHead key={col} className={align}>
                      {sortable ? (
                        <button
                          onClick={() => toggleSort(col as SortCol)}
                          className="flex items-center gap-1 hover:text-indigo-500 transition-colors font-semibold"
                          style={{ color: sortCol === col ? "var(--fg)" : "var(--fg-muted)" }}
                        >
                          {label}
                          <SortIcon col={col as SortCol} current={sortCol} dir={sortDir} />
                        </button>
                      ) : (
                        label
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map((r) => {
                const unidad = r.unidad;
                const tipo = unidad?.tipo ?? "otro";
                const unidad_km = tipo === "camion" ? "km/L" : "L/Hr";

                return (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/catalogo/unidades/${r.unidadId}`)}
                  >
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
                    <TableCell className="text-right">
                      <span className="font-mono text-sm" style={{ color: "var(--fg-muted)" }}>
                        {fmtNum(r.kmHrsRecorridos, 0)}
                        {r.kmHrsRecorridos !== null ? (tipo === "camion" ? " km" : " hrs") : ""}
                      </span>
                      {(r.odometroInicial !== null || r.odometroFinal !== null) && (
                        <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--fg-muted)", opacity: 0.6 }}>
                          {r.odometroInicial != null ? r.odometroInicial.toLocaleString("es-MX") : "—"}
                          {" → "}
                          {r.odometroFinal != null ? r.odometroFinal.toLocaleString("es-MX") : "—"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.rendimientoActual !== null ? (
                        <span className="font-mono font-semibold text-sm">
                          {fmtNum(r.rendimientoActual, 2)}{" "}
                          <span className="text-xs font-normal" style={{ color: "var(--fg-muted)" }}>{unidad_km}</span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--fg-muted)" }}>—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm" style={{ color: "var(--fg-muted)" }}>
                      {r.rendimientoReferencia !== null ? `${fmtNum(r.rendimientoReferencia, 2)} ${unidad_km}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DeltaBadge diferencia={r.diferencia} dentroDeTolerancia={r.dentroDeTolerancia} tipo={tipo} />
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

      {filtrados.length > 0 && (
        <p className="mt-3 text-xs" style={{ color: "var(--fg-muted)" }}>
          Tolerancia aplicada: ±20% sobre rendimiento de referencia.
          Camiones: km/L · Maquinaria: L/Hr
        </p>
      )}

    </>
  );
}
