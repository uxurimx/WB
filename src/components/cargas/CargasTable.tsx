"use client";

import { useState, useTransition } from "react";
import {
  Pencil, Trash2, AlertCircle, ArrowRight, Fuel,
  ChevronDown, ChevronUp, Gauge, Hash, MapPin, User,
  Search, X as XIcon, ArrowUpDown,
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
import { updateCarga, deleteCarga } from "@/app/actions/cargas";
import {
  updateRecargaTanque, deleteRecargaTanque,
  updateTransferencia, deleteTransferencia,
} from "@/app/actions/tanques";

// ─── Types ───────────────────────────────────────────────────
export type CargaItem = {
  _tipo: "carga";
  id: number;
  fecha: string;
  hora: string | null;
  folio: number | null;
  litros: number;
  origen: string;
  tipoDiesel: string | null;
  notas: string | null;
  operadorId: number | null;
  obraId: number | null;
  odometroHrs: number | null;
  cuentaLtInicio: number | null;
  cuentaLtFin: number | null;
  kmEstimado: boolean;
  unidad: { codigo: string } | null;
  operador: { nombre: string } | null;
  obra: { nombre: string } | null;
};

export type TransferenciaItem = {
  _tipo: "transferencia";
  id: number;
  fecha: string;
  folio: number | null;
  litros: number;
  origenNombre: string;
  destinoNombre: string;
  notas: string | null;
};

export type RecargaItem = {
  _tipo: "recarga";
  id: number;
  fecha: string;
  litros: number;
  tanqueNombre: string;
  proveedor: string | null;
  folioFactura: string | null;
  precioLitro: number | null;
  cuentalitrosInicio: number | null;
  notas: string | null;
};

export type HistorialItem = CargaItem | TransferenciaItem | RecargaItem;

type Operador = { id: number; nombre: string };
type Obra     = { id: number; nombre: string };

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function DetailPill({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
        {label}
      </span>
      <span className={`text-xs ${mono ? "font-mono" : ""}`} style={{ color: "var(--fg)" }}>
        {value}
      </span>
    </div>
  );
}

// ─── Botones de acción reutilizables ─────────────────────────
function ActionButtons({
  id,
  deletingId,
  isPending,
  onEdit,
  onDelete,
}: {
  id: number;
  deletingId: number | null;
  isPending: boolean;
  onEdit: () => void;
  onDelete: (id: number) => void;
}) {
  if (deletingId === id) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-red-500">¿Eliminar?</span>
        <button
          onClick={() => onDelete(id)}
          disabled={isPending}
          className="px-2 py-0.5 rounded text-xs font-semibold bg-red-600 text-white"
        >
          Sí
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onEdit}
        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
      >
        <Pencil className="w-3.5 h-3.5 text-indigo-400" />
      </button>
      <button
        onClick={() => onDelete(id)}
        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
      </button>
    </div>
  );
}

// ─── Fila de carga expandible ─────────────────────────────────
function CargaRow({
  item,
  canEdit,
  operadores,
  obras,
  onEdit,
  onDelete,
  isDeleting,
  isPending,
}: {
  item: CargaItem;
  canEdit: boolean;
  operadores: Operador[];
  obras: Obra[];
  onEdit: (c: CargaItem) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasDetails =
    item.odometroHrs != null ||
    item.cuentaLtInicio != null ||
    item.cuentaLtFin != null ||
    item.obra != null ||
    item.notas;

  return (
    <>
      <tr
        className="border-b transition-colors hover:bg-[rgba(0,0,0,0.02)] cursor-pointer"
        style={{ borderColor: "var(--border)" }}
        onClick={() => hasDetails && setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {item.folio ?? "—"}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <p className="text-sm" style={{ color: "var(--fg)" }}>{formatFecha(item.fecha)}</p>
          {item.hora && (
            <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{item.hora.slice(0, 5)}</p>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono font-bold text-sm" style={{ color: "var(--fg)" }}>
            {item.unidad?.codigo ?? "—"}
          </span>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
            {item.operador?.nombre ?? "—"}
          </span>
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <span className="font-mono font-semibold text-sm" style={{ color: "var(--fg)" }}>
            {item.litros.toLocaleString()}
          </span>
          <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
        </td>
        <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
          {item.odometroHrs != null ? (
            <span className="font-mono text-sm" style={{ color: "var(--fg)" }}>
              {item.odometroHrs.toLocaleString()}
              {item.kmEstimado && (
                <span className="ml-1 text-[10px] text-amber-500">est.</span>
              )}
            </span>
          ) : (
            <span style={{ color: "var(--fg-muted)" }}>—</span>
          )}
        </td>
        <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
          {item.cuentaLtInicio != null || item.cuentaLtFin != null ? (
            <span className="font-mono text-xs" style={{ color: "var(--fg)" }}>
              {item.cuentaLtInicio?.toLocaleString() ?? "—"}
              {" → "}
              {item.cuentaLtFin?.toLocaleString() ?? "—"}
            </span>
          ) : (
            <span className="text-sm" style={{ color: "var(--fg-muted)" }}>—</span>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <Badge variant={item.origen === "campo" ? "warning" : "default"}>
            {item.origen === "campo" ? "Campo" : "Patio"}
          </Badge>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1 justify-end">
            {hasDetails && (
              <span style={{ color: "var(--fg-muted)" }}>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            )}
            {canEdit && (
              <ActionButtons
                id={item.id}
                deletingId={isDeleting ? item.id : null}
                isPending={isPending}
                onEdit={() => onEdit(item)}
                onDelete={onDelete}
              />
            )}
          </div>
        </td>
      </tr>

      {expanded && hasDetails && (
        <tr style={{ backgroundColor: "var(--surface-2)" }}>
          <td colSpan={9} className="px-4 py-3">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {item.odometroHrs != null && (
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <DetailPill label="Odómetro / HRS" value={`${item.odometroHrs.toLocaleString()}${item.kmEstimado ? " (estimado)" : ""}`} mono />
                </div>
              )}
              {(item.cuentaLtInicio != null || item.cuentaLtFin != null) && (
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <DetailPill
                    label="Cuentalitros inicio → fin"
                    value={`${item.cuentaLtInicio?.toLocaleString() ?? "—"} → ${item.cuentaLtFin?.toLocaleString() ?? "—"}`}
                    mono
                  />
                </div>
              )}
              {item.obra != null && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <DetailPill label="Obra" value={item.obra.nombre} />
                </div>
              )}
              {item.operador != null && (
                <div className="flex items-center gap-1.5 sm:hidden">
                  <User className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <DetailPill label="Operador" value={item.operador.nombre} />
                </div>
              )}
              {item.notas && (
                <div className="flex items-center gap-1.5 w-full">
                  <DetailPill label="Notas" value={item.notas} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type SortCol = "fecha" | "litros" | "folio" | "unidad" | "operador" | "odometro";
type TipoFiltro = "todos" | "patio" | "campo" | "recarga" | "transf";

// ─── Componente principal ─────────────────────────────────────
export default function CargasTable({
  items,
  operadores,
  obras,
  canEdit,
}: {
  items: HistorialItem[];
  operadores: Operador[];
  obras: Obra[];
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  // ── Búsqueda / filtro / orden ──────────────────────────────
  const [busqueda,    setBusqueda]    = useState("");
  const [tipoFiltro,  setTipoFiltro]  = useState<TipoFiltro>("todos");
  const [sortCol,     setSortCol]     = useState<SortCol>("fecha");
  const [sortDir,     setSortDir]     = useState<"asc" | "desc">("desc");

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }

  const itemsFiltrados = items
    .filter((item) => {
      if (tipoFiltro === "patio")   return item._tipo === "carga" && item.origen === "patio";
      if (tipoFiltro === "campo")   return item._tipo === "carga" && item.origen === "campo";
      if (tipoFiltro === "recarga") return item._tipo === "recarga";
      if (tipoFiltro === "transf")  return item._tipo === "transferencia";
      return true;
    })
    .filter((item) => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      if (item._tipo === "carga") {
        return (
          (item.unidad?.codigo ?? "").toLowerCase().includes(q) ||
          (item.operador?.nombre ?? "").toLowerCase().includes(q) ||
          (item.obra?.nombre ?? "").toLowerCase().includes(q) ||
          String(item.folio ?? "").includes(q)
        );
      }
      if (item._tipo === "recarga")       return (item.proveedor ?? "").toLowerCase().includes(q) || item.tanqueNombre.toLowerCase().includes(q);
      if (item._tipo === "transferencia") return item.origenNombre.toLowerCase().includes(q) || item.destinoNombre.toLowerCase().includes(q);
      return true;
    })
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      const getFolio    = (x: HistorialItem) => (x._tipo !== "recarga" ? (x.folio ?? 0) : 0);
      const getUnidad   = (x: HistorialItem) => (x._tipo === "carga" ? (x.unidad?.codigo ?? "") : "");
      const getOperador = (x: HistorialItem) => (x._tipo === "carga" ? (x.operador?.nombre ?? "") : "");
      const getOdometro = (x: HistorialItem) => (x._tipo === "carga" ? (x.odometroHrs ?? 0) : 0);
      if (sortCol === "fecha")    return mul * a.fecha.localeCompare(b.fecha);
      if (sortCol === "litros")   return mul * (a.litros - b.litros);
      if (sortCol === "folio")    return mul * (getFolio(a) - getFolio(b));
      if (sortCol === "unidad")   return mul * getUnidad(a).localeCompare(getUnidad(b));
      if (sortCol === "operador") return mul * getOperador(a).localeCompare(getOperador(b));
      if (sortCol === "odometro") return mul * (getOdometro(a) - getOdometro(b));
      return 0;
    });

  // ── Estado: edición/eliminación de cargas ──────────────────
  const [editCarga,    setEditCarga]    = useState<CargaItem | null>(null);
  const [editCargaForm, setEditCargaForm] = useState({
    fecha: "", hora: "", folio: "", litros: "", odometroHrs: "",
    cuentaLtInicio: "", cuentaLtFin: "",
    operadorId: "", obraId: "", notas: "",
  });
  const [editCargaError,  setEditCargaError]  = useState("");
  const [deletingCargaId, setDeletingCargaId] = useState<number | null>(null);
  const [deleteCargaError, setDeleteCargaError] = useState("");

  // ── Estado: edición/eliminación de recargas ────────────────
  const [editRecarga,    setEditRecarga]    = useState<RecargaItem | null>(null);
  const [editRecargaForm, setEditRecargaForm] = useState({
    fecha: "", litros: "", proveedor: "", folioFactura: "",
    precioLitro: "", cuentalitrosInicio: "", notas: "",
  });
  const [editRecargaError,   setEditRecargaError]   = useState("");
  const [deletingRecargaId,  setDeletingRecargaId]  = useState<number | null>(null);
  const [deleteRecargaError, setDeleteRecargaError] = useState("");

  // ── Estado: edición/eliminación de transferencias ──────────
  const [editTransf,    setEditTransf]    = useState<TransferenciaItem | null>(null);
  const [editTransfForm, setEditTransfForm] = useState({ fecha: "", litros: "", notas: "" });
  const [editTransfError,   setEditTransfError]   = useState("");
  const [deletingTransfId,  setDeletingTransfId]  = useState<number | null>(null);
  const [deleteTransfError, setDeleteTransfError] = useState("");

  // ── Handlers: cargas ───────────────────────────────────────
  function openEditCarga(c: CargaItem) {
    setEditCarga(c);
    setEditCargaError("");
    setEditCargaForm({
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

  function handleCargaFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setEditCargaForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEditCarga() {
    if (!editCarga) return;
    if (!editCargaForm.litros || parseFloat(editCargaForm.litros) <= 0) {
      setEditCargaError("Los litros deben ser mayores a 0"); return;
    }
    startTransition(async () => {
      try {
        await updateCarga(editCarga.id, {
          fecha:          editCargaForm.fecha,
          hora:           editCargaForm.hora || undefined,
          folio:          editCargaForm.folio ? parseInt(editCargaForm.folio) : undefined,
          litros:         parseFloat(editCargaForm.litros),
          odometroHrs:    editCargaForm.odometroHrs ? parseFloat(editCargaForm.odometroHrs) : null,
          cuentaLtInicio: editCargaForm.cuentaLtInicio ? parseFloat(editCargaForm.cuentaLtInicio) : null,
          cuentaLtFin:    editCargaForm.cuentaLtFin ? parseFloat(editCargaForm.cuentaLtFin) : null,
          operadorId:     editCargaForm.operadorId ? parseInt(editCargaForm.operadorId) : null,
          obraId:         editCargaForm.obraId ? parseInt(editCargaForm.obraId) : null,
          notas:          editCargaForm.notas || null,
        });
        setEditCarga(null);
      } catch (err) {
        setEditCargaError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleDeleteCarga(id: number) {
    if (deletingCargaId === id) {
      startTransition(async () => {
        try {
          await deleteCarga(id);
          setDeletingCargaId(null);
        } catch (err) {
          setDeleteCargaError(err instanceof Error ? err.message : "Error al eliminar");
          setDeletingCargaId(null);
        }
      });
    } else {
      setDeletingCargaId(id);
      setDeleteCargaError("");
    }
  }

  // ── Handlers: recargas ─────────────────────────────────────
  function openEditRecarga(r: RecargaItem) {
    setEditRecarga(r);
    setEditRecargaError("");
    setEditRecargaForm({
      fecha:              r.fecha,
      litros:             String(r.litros),
      proveedor:          r.proveedor ?? "",
      folioFactura:       r.folioFactura ?? "",
      precioLitro:        r.precioLitro != null ? String(r.precioLitro) : "",
      cuentalitrosInicio: r.cuentalitrosInicio != null ? String(r.cuentalitrosInicio) : "",
      notas:              r.notas ?? "",
    });
  }

  function handleRecargaFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEditRecargaForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEditRecarga() {
    if (!editRecarga) return;
    if (!editRecargaForm.litros || parseFloat(editRecargaForm.litros) <= 0) {
      setEditRecargaError("Los litros deben ser mayores a 0"); return;
    }
    startTransition(async () => {
      try {
        await updateRecargaTanque(editRecarga.id, {
          fecha:              editRecargaForm.fecha,
          litros:             parseFloat(editRecargaForm.litros),
          proveedor:          editRecargaForm.proveedor || null,
          folioFactura:       editRecargaForm.folioFactura || null,
          precioLitro:        editRecargaForm.precioLitro ? parseFloat(editRecargaForm.precioLitro) : null,
          cuentalitrosInicio: editRecargaForm.cuentalitrosInicio ? parseFloat(editRecargaForm.cuentalitrosInicio) : null,
          notas:              editRecargaForm.notas || null,
        });
        setEditRecarga(null);
      } catch (err) {
        setEditRecargaError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleDeleteRecarga(id: number) {
    if (deletingRecargaId === id) {
      startTransition(async () => {
        try {
          await deleteRecargaTanque(id);
          setDeletingRecargaId(null);
        } catch (err) {
          setDeleteRecargaError(err instanceof Error ? err.message : "Error al eliminar");
          setDeletingRecargaId(null);
        }
      });
    } else {
      setDeletingRecargaId(id);
      setDeleteRecargaError("");
    }
  }

  // ── Handlers: transferencias ───────────────────────────────
  function openEditTransf(t: TransferenciaItem) {
    setEditTransf(t);
    setEditTransfError("");
    setEditTransfForm({
      fecha:  t.fecha,
      litros: String(t.litros),
      notas:  t.notas ?? "",
    });
  }

  function handleTransfFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEditTransfForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEditTransf() {
    if (!editTransf) return;
    if (!editTransfForm.litros || parseFloat(editTransfForm.litros) <= 0) {
      setEditTransfError("Los litros deben ser mayores a 0"); return;
    }
    startTransition(async () => {
      try {
        await updateTransferencia(editTransf.id, {
          fecha:  editTransfForm.fecha,
          litros: parseFloat(editTransfForm.litros),
          notas:  editTransfForm.notas || null,
        });
        setEditTransf(null);
      } catch (err) {
        setEditTransfError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleDeleteTransf(id: number) {
    if (deletingTransfId === id) {
      startTransition(async () => {
        try {
          await deleteTransferencia(id);
          setDeletingTransfId(null);
        } catch (err) {
          setDeleteTransfError(err instanceof Error ? err.message : "Error al eliminar");
          setDeletingTransfId(null);
        }
      });
    } else {
      setDeletingTransfId(id);
      setDeleteTransfError("");
    }
  }

  const TIPO_OPTS: { key: TipoFiltro; label: string }[] = [
    { key: "todos",   label: "Todos" },
    { key: "patio",   label: "Patio" },
    { key: "campo",   label: "Campo" },
    { key: "recarga", label: "Recargas" },
    { key: "transf",  label: "Transferencias" },
  ];

  function SortBtn({ col, label }: { col: SortCol; label: string }) {
    const active = sortCol === col;
    return (
      <button type="button" onClick={() => toggleSort(col)} className="flex items-center gap-1 group">
        {label}
        <ArrowUpDown
          className={`w-3 h-3 transition-colors ${active ? "text-indigo-400" : "opacity-40 group-hover:opacity-70"}`}
        />
      </button>
    );
  }

  const cargasFiltradas = itemsFiltrados.filter((i): i is CargaItem => i._tipo === "carga");
  const statsLitros  = cargasFiltradas.reduce((s, c) => s + c.litros, 0);
  const statsUnidades = new Set(cargasFiltradas.map((c) => c.unidad?.codigo ?? `id-${c.id}`)).size;

  const anyDeleteError = deleteCargaError || deleteRecargaError || deleteTransfError;

  return (
    <>
      {anyDeleteError && (
        <p className="text-sm text-red-500 flex items-center gap-1.5 mb-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {anyDeleteError}
        </p>
      )}

      {/* Mini dashboard reactivo */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Cargas",       value: cargasFiltradas.length },
          { label: "Litros Despachados", value: `${statsLitros.toLocaleString()} L` },
          { label: "Unidades Distintas", value: statsUnidades },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-2xl border text-center"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="font-outfit font-bold text-2xl" style={{ color: "var(--fg)" }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda + filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--fg-muted)" }} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar unidad, operador, folio..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/30"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
              style={{ color: "var(--fg-muted)" }}
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TIPO_OPTS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTipoFiltro(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                tipoFiltro === key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "hover:bg-[var(--surface-2)]"
              }`}
              style={tipoFiltro !== key ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                {[
                  { col: "folio"    as SortCol, label: "Folio",      cls: "" },
                  { col: "fecha"    as SortCol, label: "Fecha",      cls: "" },
                  { col: "unidad"   as SortCol, label: "Unidad",     cls: "" },
                  { col: "operador" as SortCol, label: "Operador",   cls: "hidden sm:table-cell" },
                  { col: "litros"   as SortCol, label: "Litros",     cls: "text-right" },
                  { col: "odometro" as SortCol, label: "Odóm./HRS",  cls: "hidden md:table-cell" },
                ].map(({ col, label, cls }) => (
                  <th key={col} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${cls}`}
                    style={{ color: "var(--fg-muted)" }}>
                    <SortBtn col={col} label={label} />
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell"
                  style={{ color: "var(--fg-muted)" }}>CuentaLT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--fg-muted)" }}>Tipo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-sm" style={{ color: "var(--fg-muted)" }}>
                    {busqueda || tipoFiltro !== "todos" ? "Sin resultados para esa búsqueda." : "Sin registros."}
                  </td>
                </tr>
              )}

              {itemsFiltrados.map((item) => {
                const key = `${item._tipo}-${item.id}`;

                // ─── Recarga ──────────────────────────────────
                if (item._tipo === "recarga") {
                  return (
                    <tr key={key} className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "rgba(16,185,129,0.04)" }}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs" style={{ color: "var(--fg-muted)" }}>
                          {item.folioFactura ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{formatFecha(item.fecha)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          <Fuel className="w-3 h-3 shrink-0" />{item.tanqueNombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm" style={{ color: "var(--fg-muted)" }}>{item.proveedor ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-semibold text-sm text-emerald-600">+{item.litros.toLocaleString()}</span>
                        <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {item.cuentalitrosInicio != null ? (
                          <span className="font-mono text-xs" style={{ color: "var(--fg-muted)" }}>
                            CL: {item.cuentalitrosInicio.toLocaleString()}
                          </span>
                        ) : <span style={{ color: "var(--fg-muted)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {item.precioLitro != null ? (
                          <span className="text-xs font-mono" style={{ color: "var(--fg-muted)" }}>
                            ${item.precioLitro.toFixed(2)}/L
                          </span>
                        ) : <span style={{ color: "var(--fg-muted)" }}>—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "rgb(16,185,129)" }}>
                          <Fuel className="w-2.5 h-2.5" /> Recarga
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {canEdit && (
                          <div className="flex justify-end">
                            <ActionButtons
                              id={item.id}
                              deletingId={deletingRecargaId}
                              isPending={isPending}
                              onEdit={() => openEditRecarga(item)}
                              onDelete={handleDeleteRecarga}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }

                // ─── Transferencia ────────────────────────────
                if (item._tipo === "transferencia") {
                  return (
                    <tr key={key} className="border-b" style={{ borderColor: "var(--border)", backgroundColor: "rgba(139,92,246,0.04)" }}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>
                          {item.folio != null ? `#${item.folio}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{formatFecha(item.fecha)}</span>
                      </td>
                      <td className="px-4 py-3" colSpan={2}>
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                          {item.origenNombre}
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          {item.destinoNombre}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-semibold text-sm">{item.litros.toLocaleString()}</span>
                        <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell" />
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {item.notas && (
                          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{item.notas}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "rgb(139,92,246)" }}>
                          <ArrowRight className="w-2.5 h-2.5" /> Transf.
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {canEdit && (
                          <div className="flex justify-end">
                            <ActionButtons
                              id={item.id}
                              deletingId={deletingTransfId}
                              isPending={isPending}
                              onEdit={() => openEditTransf(item)}
                              onDelete={handleDeleteTransf}
                            />
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }

                // ─── Carga ────────────────────────────────────
                return (
                  <CargaRow
                    key={key}
                    item={item}
                    canEdit={canEdit}
                    operadores={operadores}
                    obras={obras}
                    onEdit={openEditCarga}
                    onDelete={handleDeleteCarga}
                    isDeleting={deletingCargaId === item.id}
                    isPending={isPending}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: editar carga ────────────────────────────────── */}
      <Dialog open={!!editCarga} onOpenChange={(open) => { if (!open) setEditCarga(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar carga #{editCarga?.folio ?? editCarga?.id}</DialogTitle>
          </DialogHeader>

          {editCarga && (
            <div className="rounded-xl border p-3 grid grid-cols-3 gap-3 text-xs"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "var(--fg-muted)" }}>Unidad</p>
                <p className="font-mono font-bold mt-0.5" style={{ color: "var(--fg)" }}>{editCarga.unidad?.codigo ?? "—"}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "var(--fg-muted)" }}>Origen</p>
                <p className="mt-0.5" style={{ color: "var(--fg)" }}>{editCarga.origen === "campo" ? "Campo" : "Patio"}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "var(--fg-muted)" }}>Tipo diesel</p>
                <p className="mt-0.5" style={{ color: "var(--fg)" }}>{editCarga.tipoDiesel ?? "normal"}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input name="fecha" type="date" value={editCargaForm.fecha} onChange={handleCargaFormChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input name="hora" type="time" value={editCargaForm.hora} onChange={handleCargaFormChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Folio</Label>
                <Input name="folio" type="number" value={editCargaForm.folio} onChange={handleCargaFormChange} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Litros *</Label>
                <Input name="litros" type="number" step="0.5" value={editCargaForm.litros} onChange={handleCargaFormChange}
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
              <Input name="odometroHrs" type="number" step="1" value={editCargaForm.odometroHrs}
                onChange={handleCargaFormChange} className="font-mono" placeholder="Sin registro" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CuentaLT inicio</Label>
                <Input name="cuentaLtInicio" type="number" step="1" value={editCargaForm.cuentaLtInicio}
                  onChange={handleCargaFormChange} className="font-mono" placeholder="—" />
              </div>
              <div className="space-y-1.5">
                <Label>CuentaLT fin</Label>
                <Input name="cuentaLtFin" type="number" step="1" value={editCargaForm.cuentaLtFin}
                  onChange={handleCargaFormChange} className="font-mono" placeholder="—" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operador</Label>
                <Select name="operadorId" value={editCargaForm.operadorId} onChange={handleCargaFormChange}>
                  <option value="">— Ninguno —</option>
                  {operadores.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Obra</Label>
                <Select name="obraId" value={editCargaForm.obraId} onChange={handleCargaFormChange}>
                  <option value="">— Sin obra —</option>
                  {obras.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea name="notas" value={editCargaForm.notas} onChange={handleCargaFormChange}
                placeholder="Observaciones..." rows={2} />
            </div>
            {editCargaError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editCargaError}
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
            <Button size="sm" disabled={isPending} onClick={saveEditCarga}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal: editar recarga ──────────────────────────────── */}
      <Dialog open={!!editRecarga} onOpenChange={(open) => { if (!open) setEditRecarga(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar recarga — {editRecarga?.tanqueNombre}</DialogTitle>
          </DialogHeader>

          {editRecarga && (
            <div className="rounded-xl border px-3 py-2 text-xs flex items-center gap-2"
              style={{ backgroundColor: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.3)" }}>
              <Fuel className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span style={{ color: "var(--fg-muted)" }}>
                Actual: <strong className="font-mono">{editRecarga.litros.toLocaleString()} L</strong>.
                Cambiar litros ajustará el stock del tanque por la diferencia.
              </span>
            </div>
          )}

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input name="fecha" type="date" value={editRecargaForm.fecha} onChange={handleRecargaFormChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Litros *</Label>
                <Input name="litros" type="number" step="1" value={editRecargaForm.litros}
                  onChange={handleRecargaFormChange} className="font-mono font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Proveedor</Label>
                <Input name="proveedor" value={editRecargaForm.proveedor}
                  onChange={handleRecargaFormChange} placeholder="Ej. PEMEX" />
              </div>
              <div className="space-y-1.5">
                <Label>Folio factura</Label>
                <Input name="folioFactura" value={editRecargaForm.folioFactura}
                  onChange={handleRecargaFormChange} className="font-mono" placeholder="—" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio / litro</Label>
                <Input name="precioLitro" type="number" step="0.01" value={editRecargaForm.precioLitro}
                  onChange={handleRecargaFormChange} className="font-mono" placeholder="—" />
              </div>
              <div className="space-y-1.5">
                <Label>CuentaLT inicio</Label>
                <Input name="cuentalitrosInicio" type="number" step="1" value={editRecargaForm.cuentalitrosInicio}
                  onChange={handleRecargaFormChange} className="font-mono" placeholder="—" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea name="notas" value={editRecargaForm.notas} onChange={handleRecargaFormChange}
                placeholder="Observaciones..." rows={2} />
            </div>
            {editRecargaError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editRecargaError}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button size="sm" disabled={isPending} onClick={saveEditRecarga}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal: editar transferencia ───────────────────────── */}
      <Dialog open={!!editTransf} onOpenChange={(open) => { if (!open) setEditTransf(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar transferencia #{editTransf?.folio ?? editTransf?.id}</DialogTitle>
          </DialogHeader>

          {editTransf && (
            <div className="rounded-xl border px-3 py-2 text-xs flex items-center gap-2"
              style={{ backgroundColor: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.3)" }}>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "rgb(139,92,246)" }} />
              <span style={{ color: "var(--fg-muted)" }}>
                {editTransf.origenNombre} → {editTransf.destinoNombre} &nbsp;|&nbsp;
                Actual: <strong className="font-mono">{editTransf.litros.toLocaleString()} L</strong>.
                Cambiar litros ajustará ambos tanques.
              </span>
            </div>
          )}

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input name="fecha" type="date" value={editTransfForm.fecha} onChange={handleTransfFormChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Litros *</Label>
                <Input name="litros" type="number" step="1" value={editTransfForm.litros}
                  onChange={handleTransfFormChange} className="font-mono font-bold" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea name="notas" value={editTransfForm.notas} onChange={handleTransfFormChange}
                placeholder="Observaciones..." rows={2} />
            </div>
            {editTransfError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editTransfError}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button size="sm" disabled={isPending} onClick={saveEditTransf}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
