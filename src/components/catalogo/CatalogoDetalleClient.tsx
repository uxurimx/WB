"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, X, Pencil, Trash2, AlertCircle, AlertTriangle,
  Camera, ClipboardList, TrendingUp, TrendingDown, Minus, Fuel, BarChart3,
  ChevronUp, ChevronDown, ArrowUpDown,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateCarga, deleteCarga } from "@/app/actions/cargas";
import type { getCatalogoCargas } from "@/app/actions/catalogo";
import type { getRendimientosUnidad } from "@/app/actions/rendimientos";
import type { getArchivosUnidad } from "@/app/actions/archivos";
import type { getAuditLogCargasUnidad } from "@/app/actions/cargas";

type Carga     = Awaited<ReturnType<typeof getCatalogoCargas>>[number];
type RendItem  = Awaited<ReturnType<typeof getRendimientosUnidad>>[number];
type FotoItem  = Awaited<ReturnType<typeof getArchivosUnidad>>[number];
type AuditItem = Awaited<ReturnType<typeof getAuditLogCargasUnidad>>[number];

type Tab         = "cargas" | "rendimiento" | "fotos" | "cambios";
type SortCol     = "fecha" | "folio" | "litros" | "odometro";
type FiltroOrigen = "todos" | "patio" | "campo";

function fmtNum(n: number | null | undefined, d = 1) {
  if (n == null) return "—";
  return n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function SortIcon({ col, current, dir }: { col: SortCol; current: SortCol; dir: "asc" | "desc" }) {
  if (col !== current) return <ArrowUpDown className="w-3 h-3 opacity-30 inline ml-1" />;
  return dir === "asc"
    ? <ChevronUp className="w-3 h-3 inline ml-1" />
    : <ChevronDown className="w-3 h-3 inline ml-1" />;
}

export default function CatalogoDetalleClient({
  tipo,
  cargas: cargasInit,
  rends,
  fotos,
  audits,
  operadores,
  obras,
  canEdit,
}: {
  tipo: "unidad" | "operador" | "obra";
  cargas: Carga[];
  rends: RendItem[] | null;
  fotos: FotoItem[] | null;
  audits: AuditItem[] | null;
  operadores: { id: number; nombre: string }[];
  obras: { id: number; nombre: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("cargas");

  // Cargas locales para actualizaciones optimistas
  const [localCargas, setLocalCargas] = useState<Carga[]>(cargasInit);

  // Filtros
  const [busqueda,      setBusqueda]      = useState("");
  const [filtroOrigen,  setFiltroOrigen]  = useState<FiltroOrigen>("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [showFiltros,   setShowFiltros]   = useState(false);

  // Orden
  const [sortCol, setSortCol] = useState<SortCol>("fecha");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Edit carga
  const [editCarga, setEditCarga] = useState<Carga | null>(null);
  const [editForm, setEditForm] = useState({
    fecha: "", hora: "", folio: "", litros: "", odometroHrs: "",
    cuentaLtInicio: "", cuentaLtFin: "", operadorId: "", obraId: "", notas: "",
  });
  const [editError, setEditError] = useState("");
  const [editPending, startEditTx] = useTransition();

  // Delete
  const [deletingId,    setDeletingId]    = useState<number | null>(null);
  const [deleteNoteFor, setDeleteNoteFor] = useState<{ id: number; nota: string } | null>(null);
  const [deleteError,   setDeleteError]   = useState("");
  const [deletePending, startDeleteTx]    = useTransition();

  // Foto lightbox
  const [fotoLightbox, setFotoLightbox] = useState<FotoItem | null>(null);

  // ── Computed ─────────────────────────────────────────────────
  const totalLitros = localCargas.reduce((s, c) => s + c.litros, 0);
  const cargasPatio = localCargas.filter((c) => c.origen === "patio").length;
  const cargasCampo = localCargas.filter((c) => c.origen === "campo").length;

  const periodosFiltro = useMemo(() => {
    const seen = new Set<number>();
    const result: { id: number; nombre: string }[] = [];
    for (const c of localCargas) {
      if (c.periodoId && !seen.has(c.periodoId)) {
        seen.add(c.periodoId);
        result.push({ id: c.periodoId, nombre: c.periodoNombre ?? `Período #${c.periodoId}` });
      }
    }
    return result;
  }, [localCargas]);

  const filtrados = useMemo(() => {
    let r = localCargas;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      r = r.filter((c) =>
        (c.folio != null ? String(c.folio) : "").includes(q) ||
        (c.operadorNombre ?? "").toLowerCase().includes(q) ||
        (c.obraNombre ?? "").toLowerCase().includes(q) ||
        (c.unidadCodigo ?? "").toLowerCase().includes(q) ||
        (c.notas ?? "").toLowerCase().includes(q)
      );
    }
    if (filtroOrigen !== "todos") r = r.filter((c) => c.origen === filtroOrigen);
    if (filtroPeriodo) {
      const pid = parseInt(filtroPeriodo);
      r = r.filter((c) => c.periodoId === pid);
    }
    return [...r].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "fecha")    cmp = a.fecha.localeCompare(b.fecha);
      if (sortCol === "folio")    cmp = (a.folio ?? 0) - (b.folio ?? 0);
      if (sortCol === "litros")   cmp = a.litros - b.litros;
      if (sortCol === "odometro") cmp = (a.odometroHrs ?? 0) - (b.odometroHrs ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [localCargas, busqueda, filtroOrigen, filtroPeriodo, sortCol, sortDir]);

  const hayFiltros = busqueda.trim() !== "" || filtroOrigen !== "todos" || filtroPeriodo !== "";

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }

  // ── Edit handlers ─────────────────────────────────────────────
  function openEdit(c: Carga) {
    setEditCarga(c);
    setEditError("");
    setEditForm({
      fecha:          c.fecha,
      hora:           c.hora?.slice(0, 5) ?? "",
      folio:          c.folio != null ? String(c.folio) : "",
      litros:         String(c.litros),
      odometroHrs:    c.odometroHrs != null ? String(c.odometroHrs) : "",
      cuentaLtInicio: c.cuentaLtInicio != null ? String(c.cuentaLtInicio) : "",
      cuentaLtFin:    c.cuentaLtFin != null ? String(c.cuentaLtFin) : "",
      operadorId:     c.operadorId != null ? String(c.operadorId) : "",
      obraId:         c.obraId != null ? String(c.obraId) : "",
      notas:          c.notas ?? "",
    });
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEdit() {
    if (!editCarga) return;
    const litros = parseFloat(editForm.litros);
    if (!litros || litros <= 0) { setEditError("Los litros deben ser mayores a 0"); return; }
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
        router.refresh();
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  // ── Delete handlers ───────────────────────────────────────────
  function handleDelete(c: Carga) {
    setDeleteError("");
    if (c.periodoCerrado) {
      setDeleteNoteFor({ id: c.id, nota: "" });
    } else {
      setDeletingId(c.id);
    }
  }

  function confirmDeleteOpen(id: number) {
    startDeleteTx(async () => {
      try {
        await deleteCarga(id);
        setDeletingId(null);
        setLocalCargas((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
        setDeletingId(null);
      }
    });
  }

  function confirmDeleteConNota() {
    if (!deleteNoteFor?.nota.trim()) return;
    startDeleteTx(async () => {
      try {
        await deleteCarga(deleteNoteFor.id, deleteNoteFor.nota);
        const id = deleteNoteFor.id;
        setDeleteNoteFor(null);
        setLocalCargas((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  }

  const canEditRows = tipo === "unidad" && canEdit;

  const tabs = tipo === "unidad"
    ? [
        { key: "cargas" as Tab,      label: "Cargas" },
        { key: "rendimiento" as Tab, label: "Rendimiento" },
        { key: "fotos" as Tab,       label: `Fotos${fotos && fotos.length > 0 ? ` (${fotos.length})` : ""}` },
        { key: "cambios" as Tab,     label: `Cambios${audits && audits.length > 0 ? ` (${audits.length})` : ""}` },
      ]
    : [{ key: "cargas" as Tab, label: "Cargas" }];

  // ── Stats ─────────────────────────────────────────────────────
  const stats = [
    { label: "Total cargas",   value: localCargas.length,                          icon: BarChart3 },
    { label: "Litros totales", value: `${totalLitros.toLocaleString("es-MX")} L`, icon: Fuel },
    { label: "Patio",          value: cargasPatio,                                 icon: BarChart3 },
    { label: "Campo",          value: cargasCampo,                                 icon: Fuel },
  ];

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 border-b mb-6" style={{ borderColor: "var(--border)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
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

      {/* ── Tab Cargas ──────────────────────────────────────── */}
      {activeTab === "cargas" && (
        <div className="space-y-5">

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="p-4 rounded-2xl border"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "var(--fg-muted)" }}>{label}</p>
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <span className="font-mono font-bold text-xl" style={{ color: "var(--fg)" }}>{value}</span>
                </div>
              </div>
            ))}
          </div>

          {deleteError && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {deleteError}
            </p>
          )}

          {/* Barra búsqueda + filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--fg-muted)" }} />
              <input
                type="text"
                placeholder="Buscar por folio, operador, obra…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-9 h-9 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
              />
              {busqueda && (
                <button onClick={() => setBusqueda("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--surface-2)]">
                  <X className="w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFiltros((v) => !v)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg border text-sm font-medium transition-colors shrink-0 ${showFiltros || hayFiltros ? "border-indigo-500 text-indigo-500" : ""}`}
              style={!showFiltros && !hayFiltros ? { backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg-muted)" } : { backgroundColor: "var(--surface)" }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {hayFiltros && (
                <span className="ml-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] leading-none flex items-center justify-center">
                  {[filtroOrigen !== "todos", filtroPeriodo !== ""].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Panel filtros */}
          {showFiltros && (
            <div className="rounded-xl border p-4 space-y-3"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Origen */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-muted)" }}>Origen</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["todos", "patio", "campo"] as FiltroOrigen[]).map((v) => (
                      <button key={v} onClick={() => setFiltroOrigen(v)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          filtroOrigen === v ? "bg-indigo-500 text-white border-indigo-500" : ""
                        }`}
                        style={filtroOrigen !== v ? { backgroundColor: "var(--surface)", color: "var(--fg-muted)", borderColor: "var(--border)" } : undefined}>
                        {v === "todos" ? "Todos" : v === "patio" ? "Patio" : "Campo"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Período */}
                {periodosFiltro.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-muted)" }}>Período</p>
                    <select
                      value={filtroPeriodo}
                      onChange={(e) => setFiltroPeriodo(e.target.value)}
                      className="w-full h-9 rounded-lg border px-2.5 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
                    >
                      <option value="">— Todos los períodos —</option>
                      {periodosFiltro.map((p) => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {hayFiltros && (
                <div className="flex justify-end">
                  <button onClick={() => { setFiltroOrigen("todos"); setFiltroPeriodo(""); setBusqueda(""); }}
                    className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                    <X className="w-3 h-3" /> Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          )}

          {hayFiltros && (
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Mostrando {filtrados.length} de {localCargas.length} cargas
            </p>
          )}

          {/* Tabla */}
          {filtrados.length === 0 ? (
            <div className="p-10 rounded-2xl border text-center"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                {localCargas.length === 0 ? "Sin cargas registradas." : "Sin resultados para los filtros aplicados."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="overflow-x-auto">
                <Table style={{ minWidth: canEditRows ? "700px" : "600px" }}>
                  <TableHeader>
                    <TableRow style={{ backgroundColor: "var(--surface-2)" }}>
                      {/* Fecha sortable */}
                      <TableHead>
                        <button onClick={() => toggleSort("fecha")}
                          className="flex items-center gap-0.5 font-semibold hover:text-indigo-500 transition-colors whitespace-nowrap"
                          style={{ color: sortCol === "fecha" ? "var(--fg)" : "var(--fg-muted)" }}>
                          Fecha <SortIcon col="fecha" current={sortCol} dir={sortDir} />
                        </button>
                      </TableHead>
                      {/* Folio sortable */}
                      <TableHead>
                        <button onClick={() => toggleSort("folio")}
                          className="flex items-center gap-0.5 font-semibold hover:text-indigo-500 transition-colors whitespace-nowrap"
                          style={{ color: sortCol === "folio" ? "var(--fg)" : "var(--fg-muted)" }}>
                          Folio <SortIcon col="folio" current={sortCol} dir={sortDir} />
                        </button>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Origen</TableHead>
                      {tipo !== "unidad"   && <TableHead className="whitespace-nowrap">Unidad</TableHead>}
                      {tipo !== "operador" && <TableHead className="whitespace-nowrap">Operador</TableHead>}
                      {tipo !== "obra"     && <TableHead className="whitespace-nowrap">Obra</TableHead>}
                      {/* Odómetro sortable */}
                      <TableHead className="text-right">
                        <button onClick={() => toggleSort("odometro")}
                          className="flex items-center gap-0.5 font-semibold hover:text-indigo-500 transition-colors whitespace-nowrap ml-auto"
                          style={{ color: sortCol === "odometro" ? "var(--fg)" : "var(--fg-muted)" }}>
                          Odóm./HRS <SortIcon col="odometro" current={sortCol} dir={sortDir} />
                        </button>
                      </TableHead>
                      {/* Litros sortable */}
                      <TableHead className="text-right">
                        <button onClick={() => toggleSort("litros")}
                          className="flex items-center gap-0.5 font-semibold hover:text-indigo-500 transition-colors whitespace-nowrap ml-auto"
                          style={{ color: sortCol === "litros" ? "var(--fg)" : "var(--fg-muted)" }}>
                          Litros <SortIcon col="litros" current={sortCol} dir={sortDir} />
                        </button>
                      </TableHead>
                      {canEditRows && <TableHead className="w-16" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtrados.map((c) => (
                      <TableRow key={c.id} style={{ backgroundColor: "var(--surface)" }}>
                        {/* Fecha + badge periodo */}
                        <TableCell className="whitespace-nowrap">
                          <span className="font-mono text-sm" style={{ color: "var(--fg-muted)" }}>{c.fecha}</span>
                          {c.periodoCerrado && (
                            <span className="ml-1.5 text-[9px] font-semibold px-1 py-0.5 rounded"
                              style={{ backgroundColor: "rgba(239,68,68,0.1)", color: "rgb(239,68,68)" }}>
                              cerrado
                            </span>
                          )}
                          {c.periodoNombre && (
                            <div className="text-[10px] mt-0.5" style={{ color: "var(--fg-muted)", opacity: 0.6 }}>
                              {c.periodoNombre}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono whitespace-nowrap" style={{ color: "var(--fg-muted)" }}>
                          {c.folio != null ? `#${c.folio}` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={c.origen === "campo" ? "warning" : "default"} className="text-[10px]">
                            {c.origen === "campo" ? "Campo" : "Patio"}
                          </Badge>
                        </TableCell>
                        {tipo !== "unidad" && (
                          <TableCell className="font-mono font-bold whitespace-nowrap" style={{ color: "var(--fg)" }}>
                            {c.unidadCodigo ?? "—"}
                          </TableCell>
                        )}
                        {tipo !== "operador" && (
                          <TableCell className="whitespace-nowrap" style={{ color: "var(--fg-muted)" }}>
                            {c.operadorNombre ?? "—"}
                          </TableCell>
                        )}
                        {tipo !== "obra" && (
                          <TableCell className="whitespace-nowrap" style={{ color: "var(--fg-muted)" }}>
                            {c.obraNombre ?? "—"}
                          </TableCell>
                        )}
                        <TableCell className="font-mono text-right whitespace-nowrap" style={{ color: "var(--fg)" }}>
                          {c.odometroHrs != null ? c.odometroHrs.toLocaleString("es-MX") : "—"}
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-right whitespace-nowrap" style={{ color: "var(--fg)" }}>
                          {c.litros.toLocaleString("es-MX")} L
                        </TableCell>
                        {canEditRows && (
                          <TableCell className="whitespace-nowrap">
                            {deletingId === c.id ? (
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-red-500">¿Eliminar?</span>
                                <button onClick={() => confirmDeleteOpen(c.id)} disabled={deletePending}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-600 text-white disabled:opacity-50">
                                  Sí
                                </button>
                                <button onClick={() => setDeletingId(null)}
                                  className="px-1.5 py-0.5 rounded text-[10px] border"
                                  style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
                                  No
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-0.5 justify-end">
                                <button onClick={() => openEdit(c)}
                                  className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                                </button>
                                <button onClick={() => handleDelete(c)}
                                  className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors" title="Eliminar">
                                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </button>
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Rendimiento ──────────────────────────────────── */}
      {activeTab === "rendimiento" && rends !== null && (
        <div className="space-y-3">
          {rends.length === 0 ? (
            <div className="p-10 rounded-2xl border text-center"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
                Sin datos de rendimiento. Cierra un período para ver el historial.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                Historial por período · más reciente primero · {rends.length} períodos
              </p>
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                {rends.map((r, i) => {
                  const esCamion = r.unidad?.tipo !== "maquina";
                  const unidadKm = esCamion ? "km/L" : "L/Hr";
                  const esMejora = esCamion ? (r.diferencia ?? 0) >= 0 : (r.diferencia ?? 0) <= 0;
                  return (
                    <div key={r.id} className="px-4 py-4"
                      style={{
                        borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                        backgroundColor: "var(--surface)",
                      }}>
                      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
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
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Litros",    value: `${fmtNum(r.litrosConsumidos, 0)} L` },
                          { label: esCamion ? "Km recorridos" : "Horas",
                            value: r.kmHrsRecorridos !== null
                              ? `${fmtNum(r.kmHrsRecorridos, 0)} ${esCamion ? "km" : "hrs"}`
                              : "—" },
                          { label: "Rendimiento",
                            value: r.rendimientoActual !== null
                              ? `${fmtNum(r.rendimientoActual, 2)} ${unidadKm}`
                              : "—" },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
                            <p className="font-mono text-sm font-semibold" style={{ color: "var(--fg)" }}>{value}</p>
                          </div>
                        ))}
                      </div>
                      {/* Odómetro inicio → fin */}
                      {(r.odometroInicial !== null || r.odometroFinal !== null) && (
                        <p className="text-[10px] font-mono mt-2" style={{ color: "var(--fg-muted)" }}>
                          Odóm.: {r.odometroInicial?.toLocaleString("es-MX") ?? "—"} → {r.odometroFinal?.toLocaleString("es-MX") ?? "—"}
                        </p>
                      )}
                      {r.rendimientoReferencia !== null && r.diferencia !== null && (
                        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t"
                          style={{ borderColor: "var(--border)" }}>
                          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                            Ref: {fmtNum(r.rendimientoReferencia, 2)} {unidadKm}
                          </span>
                          <div className={`flex items-center gap-0.5 text-xs font-semibold ml-auto ${
                            r.dentroDeTolerancia ? "text-emerald-500" : "text-red-500"
                          }`}>
                            {r.diferencia === 0 ? <Minus className="w-3 h-3" />
                              : esMejora ? <TrendingUp className="w-3 h-3" />
                              : <TrendingDown className="w-3 h-3" />}
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

      {/* ── Tab Fotos ────────────────────────────────────────── */}
      {activeTab === "fotos" && fotos !== null && (
        <div className="space-y-4">
          {fotos.length === 0 ? (
            <div className="p-10 rounded-2xl border text-center"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Sin fotos registradas.</p>
            </div>
          ) : (
            <>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {fotos.length} foto{fotos.length !== 1 ? "s" : ""} · click para ampliar
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {fotos.map((f) => (
                  <button key={f.id} type="button" onClick={() => setFotoLightbox(f)}
                    className="group text-left space-y-1 focus:outline-none">
                    <div className="relative overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
                      <img src={f.url} alt={`Folio #${f.cargaFolio}`}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                        style={{ backgroundColor: "rgba(0,0,0,0.55)", color: "#fff" }}>
                        {f.cargaOrigen === "campo" ? "Campo" : "Patio"}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono px-0.5" style={{ color: "var(--fg-muted)" }}>
                      {f.cargaFecha}{f.cargaFolio != null ? ` · #${f.cargaFolio}` : ""}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab Cambios ──────────────────────────────────────── */}
      {activeTab === "cambios" && audits !== null && (
        <div className="space-y-3">
          {audits.length === 0 ? (
            <div className="p-10 rounded-2xl border text-center"
              style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Sin cambios en períodos cerrados.</p>
            </div>
          ) : (
            <>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                {audits.length} evento{audits.length !== 1 ? "s" : ""} · más reciente primero
              </p>
              <div className="space-y-2">
                {audits.map((a) => {
                  const esEliminacion = a.motivo === "delete_carga";
                  const periodoNombre = rends?.find((r) => r.periodoId === a.periodoId)?.periodo?.nombre
                    ?? (a.periodoId ? `Período #${a.periodoId}` : "—");
                  return (
                    <div key={a.id} className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center justify-between px-4 py-2.5 gap-2"
                        style={{ backgroundColor: esEliminacion ? "rgba(239,68,68,0.06)" : "rgba(99,102,241,0.06)" }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          {esEliminacion
                            ? <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            : <Pencil className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                          <span className="text-xs font-semibold"
                            style={{ color: esEliminacion ? "rgb(239,68,68)" : "rgb(99,102,241)" }}>
                            {esEliminacion ? "Carga eliminada" : "Carga modificada"}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                            style={{ backgroundColor: "var(--surface-2)", color: "var(--fg-muted)" }}>
                            {periodoNombre}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono shrink-0" style={{ color: "var(--fg-muted)" }}>
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleDateString("es-MX", {
                                day: "numeric", month: "short", year: "numeric",
                              }) + " " + new Date(a.createdAt).toLocaleTimeString("es-MX", {
                                hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>
                      <div className="px-4 py-3 space-y-1.5" style={{ backgroundColor: "var(--surface)" }}>
                        {a.nota ? (
                          <div className="flex gap-2">
                            <ClipboardList className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                            <p className="text-xs leading-relaxed" style={{ color: "var(--fg)" }}>{a.nota}</p>
                          </div>
                        ) : (
                          <p className="text-xs italic" style={{ color: "var(--fg-muted)" }}>Sin nota de motivo</p>
                        )}
                        <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                          Por: <span className="font-semibold">{a.usuarioNombre}</span>
                          {a.cargaId && <span className="ml-2 font-mono">· carga #{a.cargaId}</span>}
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

      {/* ── Modal: Editar carga ────────────────────────────── */}
      <Dialog open={!!editCarga} onOpenChange={(v) => { if (!v) setEditCarga(null); }}>
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
                <Input name="fecha" type="date" value={editForm.fecha} onChange={handleEditChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input name="hora" type="time" value={editForm.hora} onChange={handleEditChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Folio</Label>
                <Input name="folio" type="number" value={editForm.folio} onChange={handleEditChange} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Litros *</Label>
                <Input name="litros" type="number" step="0.5" value={editForm.litros} onChange={handleEditChange}
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
                onChange={handleEditChange} className="font-mono" placeholder="Sin registro" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CuentaLT inicio</Label>
                <Input name="cuentaLtInicio" type="number" step="1" value={editForm.cuentaLtInicio}
                  onChange={handleEditChange} className="font-mono" placeholder="—" />
              </div>
              <div className="space-y-1.5">
                <Label>CuentaLT fin</Label>
                <Input name="cuentaLtFin" type="number" step="1" value={editForm.cuentaLtFin}
                  onChange={handleEditChange} className="font-mono" placeholder="—" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operador</Label>
                <Select name="operadorId" value={editForm.operadorId} onChange={handleEditChange}>
                  <option value="">— Ninguno —</option>
                  {operadores.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Obra</Label>
                <Select name="obraId" value={editForm.obraId} onChange={handleEditChange}>
                  <option value="">— Sin obra —</option>
                  {obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea name="notas" value={editForm.notas} onChange={handleEditChange}
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

      {/* ── Modal: Eliminar período cerrado ───────────────── */}
      <Dialog open={!!deleteNoteFor} onOpenChange={(v) => { if (!v) setDeleteNoteFor(null); }}>
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
                value={deleteNoteFor?.nota ?? ""}
                onChange={(e) => setDeleteNoteFor((prev) => prev ? { ...prev, nota: e.target.value } : prev)}
                placeholder="Ej. Folio duplicado, error de captura, carga en unidad incorrecta…"
                rows={3} autoFocus
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
            <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deletePending || !deleteNoteFor?.nota.trim()}
              onClick={confirmDeleteConNota}>
              {deletePending ? "Eliminando…" : "Confirmar eliminación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Lightbox foto ────────────────────────────────── */}
      <Dialog open={!!fotoLightbox} onOpenChange={(v) => { if (!v) setFotoLightbox(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-violet-400" />
              Foto odómetro{fotoLightbox?.cargaFolio != null ? ` — Folio #${fotoLightbox.cargaFolio}` : ""}
            </DialogTitle>
          </DialogHeader>
          {fotoLightbox && (
            <div className="space-y-3">
              <img src={fotoLightbox.url} alt="Foto odómetro"
                className="w-full rounded-xl object-contain max-h-[65vh] border" style={{ borderColor: "var(--border)" }} />
              <div className="flex items-center justify-between text-xs" style={{ color: "var(--fg-muted)" }}>
                <span className="font-mono">
                  {fotoLightbox.cargaFecha} · {fotoLightbox.cargaOrigen === "campo" ? "Campo" : "Patio"}
                </span>
                <a href={fotoLightbox.url} target="_blank" rel="noopener noreferrer"
                  className="font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderColor: "var(--border)" }}>
                  Abrir original ↗
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
