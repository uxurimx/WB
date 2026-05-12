"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import {
  Fuel, BarChart3, Calendar, Loader2, TrendingUp, TrendingDown, Minus,
  Camera, Pencil, Trash2, AlertCircle, AlertTriangle, ClipboardList,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { getCatalogoResumen, updateCarga, deleteCarga, getAuditLogCargasUnidad } from "@/app/actions/cargas";
import { getRendimientosUnidad } from "@/app/actions/rendimientos";
import { getArchivosUnidad } from "@/app/actions/archivos";
import { getOperadores, getObras } from "@/app/actions/catalogo";

type Resumen      = Awaited<ReturnType<typeof getCatalogoResumen>>;
type RendUnidad   = Awaited<ReturnType<typeof getRendimientosUnidad>>;
type FotosUnidad  = Awaited<ReturnType<typeof getArchivosUnidad>>;
type AuditLog     = Awaited<ReturnType<typeof getAuditLogCargasUnidad>>;
type CargaReciente = Resumen["recientes"][number];
type Operador = { id: number; nombre: string };
type Obra     = { id: number; nombre: string };

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
  const [activeTab, setActiveTab] = useState<"cargas" | "rendimiento" | "fotos" | "cambios">("cargas");
  const [datos, setDatos]         = useState<Resumen | null>(null);
  const [rends, setRends]         = useState<RendUnidad | null>(null);
  const [fotos, setFotos]         = useState<FotosUnidad>([]);
  const [audits, setAudits]       = useState<AuditLog>([]);
  const [fotoLightbox, setFotoLightbox] = useState<FotosUnidad[number] | null>(null);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [obras, setObras]           = useState<Obra[]>([]);
  const [isPending, startTx]      = useTransition();
  const fetchedForId              = useRef<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Edit carga state ─────────────────────────────────────────
  const [editCarga, setEditCarga] = useState<CargaReciente | null>(null);
  const [editForm, setEditForm]   = useState({
    fecha: "", hora: "", folio: "", litros: "", odometroHrs: "",
    cuentaLtInicio: "", cuentaLtFin: "", operadorId: "", obraId: "", notas: "",
  });
  const [editError, setEditError]   = useState("");
  const [editPending, startEditTx]  = useTransition();

  // ── Delete + nota state ──────────────────────────────────────
  const [deleteNoteState, setDeleteNoteState] = useState<{ cargaId: number; nota: string } | null>(null);
  const [deletingOpenId, setDeletingOpenId]   = useState<number | null>(null);
  const [deleteError, setDeleteError]         = useState("");
  const [deletePending, startDeleteTx]        = useTransition();

  // ── Load data ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (fetchedForId.current === id) return;
    fetchedForId.current = id;
    setDatos(null);
    setRends(null);
    setActiveTab("cargas");
    startTx(async () => {
      const [resumen, rendUnidad, archivosUnidad, auditEntries, ops, obs] = await Promise.all([
        getCatalogoResumen(tipo, id),
        tipo === "unidad" ? getRendimientosUnidad(id) : Promise.resolve(null),
        tipo === "unidad" ? getArchivosUnidad(id) : Promise.resolve([] as FotosUnidad),
        tipo === "unidad" ? getAuditLogCargasUnidad(id) : Promise.resolve([] as AuditLog),
        getOperadores(true),
        getObras(true),
      ]);
      setDatos(resumen);
      if (rendUnidad) setRends(rendUnidad);
      setFotos(archivosUnidad);
      setAudits(auditEntries);
      setOperadores(ops.map((o) => ({ id: o.id, nombre: o.nombre })));
      setObras(obs.map((o) => ({ id: o.id, nombre: o.nombre })));
    });
  }, [open, id, tipo, refreshKey]);

  // refresh() invalida el cache de fetchedForId para forzar re-fetch
  function refresh() {
    fetchedForId.current = null;
    setRefreshKey((k) => k + 1);
  }

  // ── Edit handlers ────────────────────────────────────────────
  function openEdit(c: CargaReciente) {
    setEditCarga(c);
    setEditError("");
    setEditForm({
      fecha:          c.fecha,
      hora:           c.hora?.slice(0, 5) ?? "",
      folio:          c.folio ? String(c.folio) : "",
      litros:         String(c.litros),
      odometroHrs:    c.odometroHrs != null ? String(c.odometroHrs) : "",
      cuentaLtInicio: c.cuentaLtInicio != null ? String(c.cuentaLtInicio) : "",
      cuentaLtFin:    c.cuentaLtFin != null ? String(c.cuentaLtFin) : "",
      operadorId:     c.operadorId ? String(c.operadorId) : "",
      obraId:         c.obraId ? String(c.obraId) : "",
      notas:          c.notas ?? "",
    });
  }

  function handleEditFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEdit() {
    if (!editCarga) return;
    const litros = parseFloat(editForm.litros);
    if (!editForm.litros || litros <= 0) { setEditError("Los litros deben ser mayores a 0"); return; }
    startEditTx(async () => {
      try {
        await updateCarga(editCarga.id, {
          fecha:          editForm.fecha,
          hora:           editForm.hora || undefined,
          folio:          editForm.folio ? parseInt(editForm.folio) : undefined,
          litros,
          odometroHrs:    editForm.odometroHrs ? parseFloat(editForm.odometroHrs) : null,
          cuentaLtInicio: editForm.cuentaLtInicio ? parseFloat(editForm.cuentaLtInicio) : null,
          cuentaLtFin:    editForm.cuentaLtFin ? parseFloat(editForm.cuentaLtFin) : null,
          operadorId:     editForm.operadorId ? parseInt(editForm.operadorId) : null,
          obraId:         editForm.obraId ? parseInt(editForm.obraId) : null,
          notas:          editForm.notas || null,
        });
        setEditCarga(null);
        refresh();
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  // ── Delete handlers ──────────────────────────────────────────
  function handleDelete(c: CargaReciente) {
    setDeleteError("");
    if (c.periodoCerrado) {
      setDeleteNoteState({ cargaId: c.id, nota: "" });
    } else {
      setDeletingOpenId(c.id);
    }
  }

  function confirmDeleteOpen(id: number) {
    startDeleteTx(async () => {
      try {
        await deleteCarga(id);
        setDeletingOpenId(null);
        refresh();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
        setDeletingOpenId(null);
      }
    });
  }

  function confirmDeleteConNota() {
    if (!deleteNoteState?.nota.trim()) return;
    startDeleteTx(async () => {
      try {
        await deleteCarga(deleteNoteState.cargaId, deleteNoteState.nota);
        setDeleteNoteState(null);
        refresh();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  }

  const canEditRows = tipo === "unidad";

  const tabs = tipo === "unidad"
    ? [
        { key: "cargas",      label: "Cargas" },
        { key: "rendimiento", label: "Rendimiento" },
        { key: "fotos",       label: `Fotos${fotos.length > 0 ? ` (${fotos.length})` : ""}` },
        { key: "cambios",     label: `Cambios${audits.length > 0 ? ` (${audits.length})` : ""}` },
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

            {deleteError && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {deleteError}
              </p>
            )}

            {datos.recientes.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--fg-muted)" }}>Cargas recientes</p>
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs" style={{ minWidth: canEditRows ? "520px" : "480px" }}>
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
                          {canEditRows && <th className="px-3 py-2 w-16" />}
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
                              {c.periodoCerrado && (
                                <span className="ml-1 text-[9px] font-semibold px-1 py-0.5 rounded"
                                  style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "rgb(239,68,68)" }}>
                                  cerrado
                                </span>
                              )}
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
                            {canEditRows && (
                              <td className="px-3 py-2 whitespace-nowrap">
                                {deletingOpenId === c.id ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-red-500">¿Eliminar?</span>
                                    <button
                                      onClick={() => confirmDeleteOpen(c.id)}
                                      disabled={deletePending}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-600 text-white disabled:opacity-50"
                                    >Sí</button>
                                    <button
                                      onClick={() => setDeletingOpenId(null)}
                                      className="px-1.5 py-0.5 rounded text-[10px] border"
                                      style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                                    >No</button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-0.5 justify-end">
                                    <button
                                      onClick={() => openEdit(c)}
                                      className="p-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                                      title="Editar"
                                    >
                                      <Pencil className="w-3 h-3 text-indigo-400" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(c)}
                                      className="p-1 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}
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

        {/* ── Tab: Cambios / Auditoría (solo unidades) ─────────── */}
        {tipo === "unidad" && activeTab === "cambios" && !isPending && (
          <div className="space-y-3">
            {audits.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>
                Sin cambios registrados en períodos cerrados.
              </p>
            ) : (
              <>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                  Historial de modificaciones en períodos cerrados · más reciente primero
                </p>
                <div className="space-y-2">
                  {audits.map((a) => {
                    const periodoNombre = rends?.find((r) => r.periodoId === a.periodoId)?.periodo?.nombre
                      ?? (a.periodoId ? `Período #${a.periodoId}` : "—");
                    const esEliminacion = a.motivo === "delete_carga";
                    return (
                      <div key={a.id} className="rounded-xl border overflow-hidden"
                        style={{ borderColor: "var(--border)" }}>
                        {/* Header del evento */}
                        <div className="flex items-center justify-between px-3 py-2"
                          style={{ backgroundColor: esEliminacion ? "rgba(239,68,68,0.06)" : "rgba(99,102,241,0.06)" }}>
                          <div className="flex items-center gap-2">
                            {esEliminacion
                              ? <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              : <Pencil className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            }
                            <span className="text-xs font-semibold"
                              style={{ color: esEliminacion ? "rgb(239,68,68)" : "rgb(99,102,241)" }}>
                              {esEliminacion ? "Carga eliminada" : "Carga modificada"}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                              style={{ backgroundColor: "var(--surface-2)", color: "var(--fg-muted)" }}>
                              {periodoNombre}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: "var(--fg-muted)" }}>
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleDateString("es-MX", {
                                  day: "numeric", month: "short", year: "numeric",
                                }) + " " + new Date(a.createdAt).toLocaleTimeString("es-MX", {
                                  hour: "2-digit", minute: "2-digit",
                                })
                              : "—"
                            }
                          </span>
                        </div>

                        {/* Cuerpo: nota + usuario */}
                        <div className="px-3 py-2.5 space-y-1.5" style={{ backgroundColor: "var(--surface)" }}>
                          {a.nota ? (
                            <div className="flex gap-2">
                              <ClipboardList className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                              <p className="text-xs leading-relaxed" style={{ color: "var(--fg)" }}>
                                {a.nota}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs italic" style={{ color: "var(--fg-muted)" }}>
                              Sin nota de motivo
                            </p>
                          )}
                          <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                            Por: <span className="font-semibold">{a.usuarioNombre}</span>
                            {a.cargaId && (
                              <span className="ml-2 font-mono">· carga #{a.cargaId}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>

      {/* ── Modal: editar carga ─────────────────────────────────── */}
      <Dialog open={!!editCarga} onOpenChange={(open) => { if (!open) setEditCarga(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar carga #{editCarga?.folio ?? editCarga?.id}</DialogTitle>
          </DialogHeader>

          {editCarga && (
            <div className="rounded-xl border p-3 grid grid-cols-2 gap-3 text-xs"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "var(--fg-muted)" }}>Origen</p>
                <p className="mt-0.5" style={{ color: "var(--fg)" }}>{editCarga.origen === "campo" ? "Campo" : "Patio"}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "var(--fg-muted)" }}>Tipo diesel</p>
                <p className="mt-0.5" style={{ color: "var(--fg)" }}>{editCarga.tipoDiesel ?? "normal"}</p>
              </div>
              {editCarga.periodoCerrado && (
                <div className="col-span-2 flex items-center gap-1.5 text-amber-600 text-[10px] font-semibold">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Período cerrado — el rendimiento se recalculará al guardar
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input name="fecha" type="date" value={editForm.fecha} onChange={handleEditFormChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input name="hora" type="time" value={editForm.hora} onChange={handleEditFormChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Folio</Label>
                <Input name="folio" type="number" value={editForm.folio} onChange={handleEditFormChange} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Litros *</Label>
                <Input name="litros" type="number" step="0.5" value={editForm.litros} onChange={handleEditFormChange}
                  className="font-mono font-bold" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>
                Odómetro / Horas
                {editCarga?.kmEstimado && (
                  <span className="ml-2 text-[10px] text-amber-500 font-normal">fue estimado</span>
                )}
              </Label>
              <Input name="odometroHrs" type="number" step="1" value={editForm.odometroHrs}
                onChange={handleEditFormChange} className="font-mono" placeholder="Sin registro" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CuentaLT inicio</Label>
                <Input name="cuentaLtInicio" type="number" step="1" value={editForm.cuentaLtInicio}
                  onChange={handleEditFormChange} className="font-mono" placeholder="—" />
              </div>
              <div className="space-y-1.5">
                <Label>CuentaLT fin</Label>
                <Input name="cuentaLtFin" type="number" step="1" value={editForm.cuentaLtFin}
                  onChange={handleEditFormChange} className="font-mono" placeholder="—" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operador</Label>
                <Select name="operadorId" value={editForm.operadorId} onChange={handleEditFormChange}>
                  <option value="">— Ninguno —</option>
                  {operadores.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Obra</Label>
                <Select name="obraId" value={editForm.obraId} onChange={handleEditFormChange}>
                  <option value="">— Sin obra —</option>
                  {obras.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea name="notas" value={editForm.notas} onChange={handleEditFormChange}
                placeholder="Observaciones..." rows={2} />
            </div>
            {editError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editError}
              </p>
            )}
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Cambiar litros ajusta automáticamente el stock del tanque.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button size="sm" disabled={editPending} onClick={saveEdit}>
              {editPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: eliminar de período cerrado ─────────────────── */}
      <Dialog open={!!deleteNoteState} onOpenChange={(open) => { if (!open) setDeleteNoteState(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Eliminar de período cerrado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="rounded-xl border px-3 py-2.5 text-xs space-y-1"
              style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
              <p className="font-semibold" style={{ color: "var(--fg)" }}>Atención: período cerrado</p>
              <p style={{ color: "var(--fg-muted)" }}>
                Esta carga pertenece a un período cerrado. Al eliminarla, el rendimiento
                de la unidad será recalculado automáticamente.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo de la eliminación *</Label>
              <Textarea
                value={deleteNoteState?.nota ?? ""}
                onChange={(e) =>
                  setDeleteNoteState((prev) => prev ? { ...prev, nota: e.target.value } : prev)
                }
                placeholder="Ej. Folio duplicado, error de captura, carga en unidad incorrecta…"
                rows={3}
                autoFocus
              />
            </div>
            {deleteError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {deleteError}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletePending || !deleteNoteState?.nota.trim()}
              onClick={confirmDeleteConNota}
            >
              {deletePending ? "Eliminando…" : "Confirmar eliminación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Lightbox: foto ampliada ─────────────────────────────── */}
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
