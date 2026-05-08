"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Fuel, BarChart3, Calendar, Loader2, TrendingUp, TrendingDown, Minus, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCatalogoResumen } from "@/app/actions/cargas";
import { getRendimientosUnidad } from "@/app/actions/rendimientos";
import { getArchivosUnidad } from "@/app/actions/archivos";

type Resumen      = Awaited<ReturnType<typeof getCatalogoResumen>>;
type RendUnidad   = Awaited<ReturnType<typeof getRendimientosUnidad>>;
type FotosUnidad  = Awaited<ReturnType<typeof getArchivosUnidad>>;

function formatFecha(f: string) {
  return new Date(f + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function fmtNum(n: number | null, d = 1) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function CatalogoDetalleModal({
  tipo,
  id,
  nombre,
  open,
  onOpenChange,
}: {
  tipo: "unidad" | "operador" | "obra";
  id: number;
  nombre: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<"cargas" | "rendimiento" | "fotos">("cargas");
  const [datos, setDatos]         = useState<Resumen | null>(null);
  const [rends, setRends]         = useState<RendUnidad | null>(null);
  const [fotos, setFotos]         = useState<FotosUnidad>([]);
  const [fotoLightbox, setFotoLightbox] = useState<FotosUnidad[number] | null>(null);
  const [isPending, startTx]      = useTransition();
  const fetchedForId              = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    if (fetchedForId.current === id) return;
    fetchedForId.current = id;
    setDatos(null);
    setRends(null);
    setActiveTab("cargas");
    startTx(async () => {
      const [resumen, rendUnidad, archivosUnidad] = await Promise.all([
        getCatalogoResumen(tipo, id),
        tipo === "unidad" ? getRendimientosUnidad(id) : Promise.resolve(null),
        tipo === "unidad" ? getArchivosUnidad(id) : Promise.resolve([] as FotosUnidad),
      ]);
      setDatos(resumen);
      if (rendUnidad) setRends(rendUnidad);
      setFotos(archivosUnidad);
    });
  }, [open, id, tipo]);

  const tabs = tipo === "unidad"
    ? [
        { key: "cargas",      label: "Cargas" },
        { key: "rendimiento", label: "Rendimiento" },
        { key: "fotos",       label: `Fotos${fotos.length > 0 ? ` (${fotos.length})` : ""}` },
      ] as const
    : [{ key: "cargas", label: "Cargas" }] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            {nombre}
            <Badge variant="secondary" className="font-normal text-xs capitalize">{tipo}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs — solo para unidades */}
        {tipo === "unidad" && (
          <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === t.key
                    ? "border-indigo-500 text-indigo-500"
                    : "border-transparent"
                }`}
                style={activeTab !== t.key ? { color: "var(--fg-muted)" } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {isPending && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--fg-muted)" }} />
          </div>
        )}

        {/* ── Tab: Cargas ─────────────────────────────────── */}
        {datos && !isPending && activeTab === "cargas" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total cargas",   value: datos.totalCargas,                         icon: BarChart3 },
                { label: "Litros totales", value: `${datos.totalLitros.toLocaleString()} L`,  icon: Fuel },
                { label: "Patio",          value: datos.cargasPatio,                          icon: BarChart3 },
                { label: "Campo",          value: datos.cargasCampo,                          icon: Fuel },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-3 rounded-xl border"
                  style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--fg-muted)" }}>{label}</p>
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                    <span className="font-mono font-bold text-lg" style={{ color: "var(--fg)" }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {datos.ultimaFecha && (
              <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--fg-muted)" }}>
                <Calendar className="w-3.5 h-3.5" />
                Última carga: {formatFecha(datos.ultimaFecha)}
              </p>
            )}

            {datos.recientes.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--fg-muted)" }}>Cargas recientes</p>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ minWidth: "480px" }}>
                      <thead>
                        <tr style={{ backgroundColor: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                          <th className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                            style={{ color: "var(--fg-muted)" }}>Fecha</th>
                          <th className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                            style={{ color: "var(--fg-muted)" }}>Folio</th>
                          {tipo !== "unidad" && (
                            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                              style={{ color: "var(--fg-muted)" }}>Unidad</th>
                          )}
                          {tipo !== "operador" && (
                            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                              style={{ color: "var(--fg-muted)" }}>Operador</th>
                          )}
                          {tipo !== "obra" && (
                            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                              style={{ color: "var(--fg-muted)" }}>Obra</th>
                          )}
                          <th className="px-3 py-2 text-right font-semibold whitespace-nowrap"
                            style={{ color: "var(--fg-muted)" }}>Odóm./HRS</th>
                          <th className="px-3 py-2 text-right font-semibold whitespace-nowrap"
                            style={{ color: "var(--fg-muted)" }}>Litros</th>
                          <th className="px-3 py-2 text-center font-semibold whitespace-nowrap"
                            style={{ color: "var(--fg-muted)" }}>Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datos.recientes.map((c, i) => (
                          <tr key={c.id}
                            style={{
                              borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                              backgroundColor: "var(--surface)",
                            }}>
                            <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: "var(--fg-muted)" }}>
                              {c.fecha}
                            </td>
                            <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: "var(--fg-muted)" }}>
                              {c.folio != null ? `#${c.folio}` : "—"}
                            </td>
                            {tipo !== "unidad" && (
                              <td className="px-3 py-2 font-mono font-bold whitespace-nowrap" style={{ color: "var(--fg)" }}>
                                {c.unidadCodigo ?? "—"}
                              </td>
                            )}
                            {tipo !== "operador" && (
                              <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--fg-muted)" }}>
                                {c.operadorNombre ?? "—"}
                              </td>
                            )}
                            {tipo !== "obra" && (
                              <td className="px-3 py-2 whitespace-nowrap" style={{ color: "var(--fg-muted)" }}>
                                {c.obraNombre ?? "—"}
                              </td>
                            )}
                            <td className="px-3 py-2 font-mono text-right whitespace-nowrap" style={{ color: "var(--fg)" }}>
                              {c.odometroHrs != null ? c.odometroHrs.toLocaleString() : "—"}
                            </td>
                            <td className="px-3 py-2 font-mono font-semibold text-right whitespace-nowrap" style={{ color: "var(--fg)" }}>
                              {c.litros.toLocaleString()} L
                            </td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <Badge variant={c.origen === "campo" ? "warning" : "default"} className="text-[10px]">
                                {c.origen === "campo" ? "Campo" : "Patio"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>
                Sin cargas registradas.
              </p>
            )}
          </div>
        )}

        {/* ── Tab: Rendimiento (solo unidades) ────────────── */}
        {rends !== null && !isPending && activeTab === "rendimiento" && (
          <div className="space-y-3">
            {rends.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>
                Sin datos de rendimiento aún. Cierra un período para ver el historial.
              </p>
            ) : (
              <>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Historial por período cerrado · más reciente primero
                </p>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  {rends.map((r, i) => {
                    const esCamion = r.unidad?.tipo !== "maquina";
                    const unidadKm = esCamion ? "km/L" : "L/Hr";
                    const esMejora = esCamion ? (r.diferencia ?? 0) >= 0 : (r.diferencia ?? 0) <= 0;

                    return (
                      <div
                        key={r.id}
                        className="px-3 py-3"
                        style={{
                          borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                          backgroundColor: "var(--surface)",
                        }}
                      >
                        {/* Período */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold" style={{ color: "var(--fg)" }}>
                            {r.periodo?.nombre ?? `Período #${r.periodoId}`}
                          </span>
                          {r.dentroDeTolerancia === true ? (
                            <Badge variant="success">OK</Badge>
                          ) : r.dentroDeTolerancia === false ? (
                            <Badge variant="danger">Fuera</Badge>
                          ) : (
                            <Badge variant="secondary">Sin ref.</Badge>
                          )}
                        </div>

                        {/* Métricas */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-muted)" }}>Litros</p>
                            <p className="font-mono text-sm font-semibold" style={{ color: "var(--fg)" }}>
                              {fmtNum(r.litrosConsumidos, 0)} L
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-muted)" }}>
                              {esCamion ? "Km" : "Hrs"}
                            </p>
                            <p className="font-mono text-sm font-semibold" style={{ color: "var(--fg)" }}>
                              {fmtNum(r.kmHrsRecorridos, 0)}{r.kmHrsRecorridos !== null ? (esCamion ? " km" : " hrs") : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-muted)" }}>Rendimiento</p>
                            <p className="font-mono text-sm font-semibold" style={{ color: "var(--fg)" }}>
                              {fmtNum(r.rendimientoActual, 2)} <span className="text-xs font-normal" style={{ color: "var(--fg-muted)" }}>{unidadKm}</span>
                            </p>
                          </div>
                        </div>

                        {/* Delta vs referencia */}
                        {r.rendimientoReferencia !== null && r.diferencia !== null && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                              Ref: {fmtNum(r.rendimientoReferencia, 2)} {unidadKm}
                            </span>
                            <div className={`flex items-center gap-0.5 text-xs font-semibold ml-auto ${
                              r.dentroDeTolerancia ? "text-emerald-500" : "text-red-500"
                            }`}>
                              {r.diferencia === 0
                                ? <Minus className="w-3 h-3" />
                                : esMejora
                                  ? <TrendingUp className="w-3 h-3" />
                                  : <TrendingDown className="w-3 h-3" />
                              }
                              {r.diferencia > 0 ? "+" : ""}{fmtNum(r.diferencia, 2)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
        {/* ── Tab: Fotos (solo unidades) ──────────────────────── */}
        {tipo === "unidad" && activeTab === "fotos" && !isPending && (
          <div className="space-y-3">
            {fotos.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>
                Sin fotos registradas para esta unidad.
              </p>
            ) : (
              <>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  {fotos.length} foto{fotos.length !== 1 ? "s" : ""} · click para ampliar
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {fotos.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFotoLightbox(f)}
                      className="group text-left space-y-1 focus:outline-none"
                    >
                      <div className="relative overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
                        <img
                          src={f.url}
                          alt={`Folio #${f.cargaFolio}`}
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
                          {f.cargaOrigen === "campo" ? "Campo" : "Patio"}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono px-0.5" style={{ color: "var(--fg-muted)" }}>
                        {f.cargaFecha}
                        {f.cargaFolio != null ? ` · #${f.cargaFolio}` : ""}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>

      {/* Lightbox de foto ampliada */}
      <Dialog open={!!fotoLightbox} onOpenChange={(open) => { if (!open) setFotoLightbox(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-violet-400" />
              Foto odómetro{fotoLightbox?.cargaFolio != null ? ` — Folio #${fotoLightbox.cargaFolio}` : ""}
            </DialogTitle>
          </DialogHeader>
          {fotoLightbox && (
            <div className="space-y-3">
              <img
                src={fotoLightbox.url}
                alt="Foto odómetro"
                className="w-full rounded-xl object-contain max-h-[65vh] border"
                style={{ borderColor: "var(--border)" }}
              />
              <div className="flex items-center justify-between text-xs" style={{ color: "var(--fg-muted)" }}>
                <span className="font-mono">{fotoLightbox.cargaFecha} · {fotoLightbox.cargaOrigen === "campo" ? "Campo" : "Patio"}</span>
                <a
                  href={fotoLightbox.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  Abrir original ↗
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
