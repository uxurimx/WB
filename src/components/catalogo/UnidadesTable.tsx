"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Plus, Power, PowerOff, Pencil, Trash2, Check, X, Search, SlidersHorizontal,
  TrendingUp, TrendingDown, Minus, Fuel, Gauge, AlertTriangle, ArrowUpDown,
  ChevronUp, ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createUnidad, updateUnidad, toggleUnidadActivo, deleteUnidad } from "@/app/actions/catalogo";
import CatalogoDetalleModal from "./CatalogoDetalleModal";

type UltimoPeriodo = {
  nombre: string;
  rendimientoActual:    number | null;
  rendimientoReferencia: number | null;
  diferencia:           number | null;
  dentroDeTolerancia:   boolean | null;
};

type Unidad = {
  id: number;
  codigo: string;
  nombre: string | null;
  tipo: string;
  modelo: string | null;
  capacidadTanque: number | null;
  rendimientoReferencia: number | null;
  activo: boolean;
  totalLitros: number;
  totalCargas: number;
  ultimaFecha: string | null;
  ultimoPeriodo: UltimoPeriodo | null;
};

const TIPO_LABELS: Record<string, string> = {
  camion: "Camión", maquina: "Maquinaria", nissan: "NISSAN", otro: "Otro",
};
const TIPO_VARIANT: Record<string, "default" | "success" | "warning" | "secondary"> = {
  camion: "default", maquina: "warning", nissan: "success", otro: "secondary",
};

type SortCol = "codigo" | "tipo" | "totalLitros" | "totalCargas" | "ultimoRendimiento" | "ultimaDiferencia";

function fmtNum(n: number | null | undefined, d = 0) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
}

// ── Mini-dashboard ─────────────────────────────────────────────
function UnidadesDashboard({ unidades }: { unidades: Unidad[] }) {
  const activas    = unidades.filter((u) => u.activo);
  const totalLitros = unidades.reduce((s, u) => s + u.totalLitros, 0);

  const conRend = unidades.filter(
    (u) =>
      u.ultimoPeriodo !== null &&
      u.ultimoPeriodo.rendimientoActual !== null &&
      u.ultimoPeriodo.rendimientoReferencia !== null
  );
  const fueraTolerancia = conRend.filter((u) => u.ultimoPeriodo?.dentroDeTolerancia === false).length;

  // Mejor: mayor diferencia positiva (camiones) o negativa (maquinas)
  // Simplificado: mayor % de mejora relativa (diferencia/referencia * 100)
  let mejor: Unidad | null = null;
  let peor:  Unidad | null = null;
  let mejorPct = -Infinity;
  let peorPct  = Infinity;

  for (const u of conRend) {
    const rend = u.ultimoPeriodo!;
    if (rend.rendimientoReferencia === null || rend.diferencia === null) continue;
    const pct = (rend.diferencia / rend.rendimientoReferencia) * 100;
    const esCamion = u.tipo === "camion";
    // Camion: mayor km/L = mejor → pct positivo = mejor
    // Maquina: menor L/Hr = mejor → pct negativo = mejor
    const score = esCamion ? pct : -pct;
    if (score > mejorPct) { mejorPct = score; mejor = u; }
    if (score < peorPct)  { peorPct  = score; peor  = u; }
  }

  const masCombustible = [...unidades].sort((a, b) => b.totalLitros - a.totalLitros)[0];

  const cards = [
    {
      label: "Flota activa",
      value: `${activas.length} / ${unidades.length}`,
      sub:   `${unidades.filter((u) => !u.activo).length} inactivas`,
      color: "indigo",
      icon:  Fuel,
    },
    {
      label: "Combustible total",
      value: `${(totalLitros / 1000).toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kL`,
      sub:   `${totalLitros.toLocaleString()} L históricos`,
      color: "blue",
      icon:  Gauge,
    },
    {
      label: "Mejor rendimiento",
      value: mejor ? mejor.codigo : "—",
      sub:   mejor && mejor.ultimoPeriodo?.diferencia !== null
        ? `${mejor.ultimoPeriodo!.diferencia! >= 0 ? "+" : ""}${fmtNum(mejor.ultimoPeriodo!.diferencia, 2)} vs ref · ${mejor.ultimoPeriodo!.nombre}`
        : "Sin datos de período",
      color: "emerald",
      icon:  TrendingUp,
    },
    {
      label: "Requieren atención",
      value: fueraTolerancia > 0 ? String(fueraTolerancia) : "✓ OK",
      sub:   fueraTolerancia > 0
        ? `fuera de tolerancia${peor ? ` · peor: ${peor.codigo}` : ""}`
        : "Todas dentro de tolerancia",
      color: fueraTolerancia > 0 ? "red" : "emerald",
      icon:  fueraTolerancia > 0 ? AlertTriangle : TrendingUp,
    },
  ];

  const colorMap: Record<string, string> = {
    indigo:  "text-indigo-500",
    blue:    "text-blue-500",
    emerald: "text-emerald-500",
    red:     "text-red-500",
  };
  const bgMap: Record<string, string> = {
    indigo:  "bg-indigo-500/8 border-indigo-500/20",
    blue:    "bg-blue-500/8 border-blue-500/20",
    emerald: "bg-emerald-500/8 border-emerald-500/20",
    red:     "bg-red-500/8 border-red-500/20",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {cards.map(({ label, value, sub, color, icon: Icon }) => (
        <div
          key={label}
          className={`p-4 rounded-2xl border ${bgMap[color]}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-3.5 h-3.5 ${colorMap[color]}`} />
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
              {label}
            </p>
          </div>
          <p className={`font-outfit font-bold text-2xl ${colorMap[color]}`}>{value}</p>
          <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--fg-muted)" }}>{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Tabla principal ────────────────────────────────────────────
export default function UnidadesTable({
  unidades,
  canEdit = false,
}: {
  unidades: Unidad[];
  canEdit?: boolean;
}) {
  const [showForm, setShowForm]       = useState(false);
  const [isPending, startTransition]  = useTransition();
  const [form, setForm] = useState({
    codigo: "", nombre: "", tipo: "camion", modelo: "", capacidadTanque: "", rendimientoReferencia: "",
  });
  const [error, setError] = useState("");

  type EditForm = { codigo: string; nombre: string; tipo: string; modelo: string; capacidadTanque: string; rendimientoReferencia: string };
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editForm, setEditForm]     = useState<EditForm>({ codigo: "", nombre: "", tipo: "camion", modelo: "", capacidadTanque: "", rendimientoReferencia: "" });
  const [editError, setEditError]   = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const [selectedUnit, setSelectedUnit] = useState<{ id: number; nombre: string } | null>(null);

  const [busqueda,     setBusqueda]     = useState("");
  const [tipoFiltro,   setTipoFiltro]   = useState<string>("todos");
  const [estadoFiltro, setEstadoFiltro] = useState<"todos" | "activo" | "inactivo">("todos");
  const [rendFiltro,   setRendFiltro]   = useState<"todos" | "ok" | "fuera" | "sin">("todos");
  const [sortCol,      setSortCol]      = useState<SortCol>("codigo");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("asc");
  const [showFilters,  setShowFilters]  = useState(false);

  const hasActiveFilters = tipoFiltro !== "todos" || estadoFiltro !== "todos" || rendFiltro !== "todos";

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  }

  const unidadesFiltradas = useMemo(() => {
    return unidades
      .filter((u) => {
        if (tipoFiltro !== "todos" && u.tipo !== tipoFiltro) return false;
        if (estadoFiltro === "activo"   && !u.activo) return false;
        if (estadoFiltro === "inactivo" && u.activo)  return false;
        if (rendFiltro === "ok")    { if (u.ultimoPeriodo?.dentroDeTolerancia !== true)  return false; }
        if (rendFiltro === "fuera") { if (u.ultimoPeriodo?.dentroDeTolerancia !== false) return false; }
        if (rendFiltro === "sin")   { if (u.ultimoPeriodo !== null) return false; }
        if (busqueda) {
          const q = busqueda.toLowerCase();
          return u.codigo.toLowerCase().includes(q) ||
                 (u.nombre ?? "").toLowerCase().includes(q) ||
                 (u.modelo ?? "").toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        const mul = sortDir === "asc" ? 1 : -1;
        switch (sortCol) {
          case "codigo":           return mul * a.codigo.localeCompare(b.codigo);
          case "tipo":             return mul * a.tipo.localeCompare(b.tipo);
          case "totalLitros":      return mul * (a.totalLitros - b.totalLitros);
          case "totalCargas":      return mul * (a.totalCargas - b.totalCargas);
          case "ultimoRendimiento": return mul * ((a.ultimoPeriodo?.rendimientoActual ?? -1) - (b.ultimoPeriodo?.rendimientoActual ?? -1));
          case "ultimaDiferencia": return mul * ((a.ultimoPeriodo?.diferencia ?? -9999) - (b.ultimoPeriodo?.diferencia ?? -9999));
          default: return 0;
        }
      });
  }, [unidades, busqueda, tipoFiltro, estadoFiltro, rendFiltro, sortCol, sortDir]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.codigo.trim()) { setError("El código es requerido"); return; }
    startTransition(async () => {
      try {
        await createUnidad({
          codigo: form.codigo.trim().toUpperCase(),
          nombre: form.nombre.trim() || undefined,
          tipo: form.tipo,
          modelo: form.modelo.trim() || undefined,
          capacidadTanque: form.capacidadTanque ? parseFloat(form.capacidadTanque) : undefined,
          rendimientoReferencia: form.rendimientoReferencia ? parseFloat(form.rendimientoReferencia) : undefined,
        });
        setForm({ codigo: "", nombre: "", tipo: "camion", modelo: "", capacidadTanque: "", rendimientoReferencia: "" });
        setShowForm(false);
      } catch { setError("Error al guardar. ¿El código ya existe?"); }
    });
  }

  function handleToggle(id: number, activo: boolean) {
    startTransition(() => toggleUnidadActivo(id, !activo));
  }

  function startEdit(u: Unidad) {
    setEditingId(u.id);
    setEditError(""); setDeleteError(""); setDeletingId(null);
    setEditForm({
      codigo: u.codigo, nombre: u.nombre ?? "", tipo: u.tipo, modelo: u.modelo ?? "",
      capacidadTanque: u.capacidadTanque ? String(u.capacidadTanque) : "",
      rendimientoReferencia: u.rendimientoReferencia ? String(u.rendimientoReferencia) : "",
    });
  }

  function cancelEdit() { setEditingId(null); setEditError(""); }

  function saveEdit(id: number) {
    if (!editForm.codigo.trim()) { setEditError("El código es requerido"); return; }
    startTransition(async () => {
      try {
        await updateUnidad(id, {
          codigo: editForm.codigo.trim().toUpperCase(),
          nombre: editForm.nombre.trim() || null,
          tipo: editForm.tipo,
          modelo: editForm.modelo.trim() || null,
          capacidadTanque: editForm.capacidadTanque ? parseFloat(editForm.capacidadTanque) : null,
          rendimientoReferencia: editForm.rendimientoReferencia ? parseFloat(editForm.rendimientoReferencia) : null,
        });
        setEditingId(null); setEditError("");
      } catch { setEditError("Error al guardar"); }
    });
  }

  function confirmDelete(id: number) {
    setDeleteError("");
    startTransition(async () => {
      try {
        await deleteUnidad(id);
        setDeletingId(null);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
        setDeletingId(null);
      }
    });
  }

  function SortBtn({ col, label, align = "left" }: { col: SortCol; label: string; align?: "left" | "right" }) {
    const active = sortCol === col;
    const Icon = active ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ArrowUpDown;
    return (
      <button type="button" onClick={() => toggleSort(col)}
        className={`flex items-center gap-1 group font-semibold text-xs uppercase tracking-wider w-full ${align === "right" ? "justify-end" : ""}`}
        style={{ color: active ? "var(--fg)" : "var(--fg-muted)" }}>
        {align === "right" && <Icon className={`w-3 h-3 ${active ? "text-indigo-400" : "opacity-30 group-hover:opacity-60"}`} />}
        {label}
        {align !== "right" && <Icon className={`w-3 h-3 ${active ? "text-indigo-400" : "opacity-30 group-hover:opacity-60"}`} />}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mini-dashboard */}
      <UnidadesDashboard unidades={unidades} />

      {/* Modal de detalle */}
      {selectedUnit && (
        <CatalogoDetalleModal
          tipo="unidad"
          id={selectedUnit.id}
          nombre={selectedUnit.nombre}
          open={true}
          onOpenChange={(v) => { if (!v) setSelectedUnit(null); }}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--fg-muted)" }} />
          <input
            type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar código, nombre, modelo..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/30"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
              style={{ color: "var(--fg-muted)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button type="button" onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all shrink-0 ${
            hasActiveFilters ? "border-indigo-500/50 bg-indigo-500/5" : "hover:bg-[var(--surface-2)]"
          }`}
          style={hasActiveFilters ? { color: "var(--fg)" } : { borderColor: "var(--border)", color: "var(--fg-muted)" }}>
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilters && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
        </button>

        {canEdit && (
          <button type="button" onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold shrink-0 transition-colors"
            style={showForm
              ? { backgroundColor: "var(--surface-2)", color: "var(--fg)" }
              : { backgroundColor: "rgb(79 70 229)", color: "white" }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{showForm ? "Cancelar" : "Nueva"}</span>
          </button>
        )}
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="flex flex-wrap gap-x-5 gap-y-3 px-4 py-3 rounded-xl border"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          {/* Tipo */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold shrink-0" style={{ color: "var(--fg-muted)" }}>Tipo</span>
            {(["todos", "camion", "maquina", "nissan", "otro"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTipoFiltro(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  tipoFiltro === t ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-[var(--surface-2)]"
                }`}
                style={tipoFiltro !== t ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}>
                {t === "todos" ? "Todos" : TIPO_LABELS[t] ?? t}
              </button>
            ))}
          </div>
          {/* Estado */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold shrink-0" style={{ color: "var(--fg-muted)" }}>Estado</span>
            {(["todos", "activo", "inactivo"] as const).map((e) => (
              <button key={e} type="button" onClick={() => setEstadoFiltro(e)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  estadoFiltro === e ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-[var(--surface-2)]"
                }`}
                style={estadoFiltro !== e ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}>
                {e === "todos" ? "Todos" : e === "activo" ? "Activos" : "Inactivos"}
              </button>
            ))}
          </div>
          {/* Rendimiento */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold shrink-0" style={{ color: "var(--fg-muted)" }}>Rendimiento</span>
            {([
              ["todos", "Todos"], ["ok", "OK"], ["fuera", "Fuera"], ["sin", "Sin datos"],
            ] as const).map(([val, label]) => (
              <button key={val} type="button" onClick={() => setRendFiltro(val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  rendFiltro === val ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-[var(--surface-2)]"
                }`}
                style={rendFiltro !== val ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>Nueva Unidad</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" name="codigo" value={form.codigo} onChange={handleChange} placeholder="CA12, EX01, R02..." className="uppercase" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select id="tipo" name="tipo" value={form.tipo} onChange={handleChange}>
                <option value="camion">Camión</option>
                <option value="maquina">Maquinaria</option>
                <option value="nissan">NISSAN</option>
                <option value="otro">Otro</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre descriptivo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" name="modelo" value={form.modelo} onChange={handleChange} placeholder="Komatsu PC88, CAT 308..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacidadTanque">Cap. Tanque (L)</Label>
              <Input id="capacidadTanque" name="capacidadTanque" type="number" value={form.capacidadTanque} onChange={handleChange} placeholder="300" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rendimientoReferencia">
                Rend. Referencia {form.tipo === "maquina" ? "(L/Hr)" : "(km/L)"}
              </Label>
              <Input id="rendimientoReferencia" name="rendimientoReferencia" type="number" step="0.01"
                value={form.rendimientoReferencia} onChange={handleChange} placeholder="2.8" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60">
              {isPending ? "Guardando..." : "Guardar Unidad"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm hover:bg-[var(--surface-2)] transition-colors"
              style={{ color: "var(--fg-muted)" }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {deleteError && <p className="text-sm text-red-500 px-1">{deleteError}</p>}

      {unidadesFiltradas.length < unidades.length && (
        <p className="text-xs px-1" style={{ color: "var(--fg-muted)" }}>
          Mostrando {unidadesFiltradas.length} de {unidades.length} unidades
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead><SortBtn col="codigo" label="Código" /></TableHead>
              <TableHead className="hidden md:table-cell">Nombre / Modelo</TableHead>
              <TableHead><SortBtn col="tipo" label="Tipo" /></TableHead>
              <TableHead className="hidden sm:table-cell text-right">
                <SortBtn col="totalLitros" label="Litros" align="right" />
              </TableHead>
              <TableHead className="hidden sm:table-cell text-right">
                <SortBtn col="totalCargas" label="Cargas" align="right" />
              </TableHead>
              <TableHead className="hidden lg:table-cell text-right">
                <SortBtn col="ultimoRendimiento" label="Últ. Rend." align="right" />
              </TableHead>
              <TableHead className="hidden lg:table-cell text-right">
                <SortBtn col="ultimaDiferencia" label="Δ Ref" align="right" />
              </TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {unidadesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10" style={{ color: "var(--fg-muted)" }}>
                  {busqueda || hasActiveFilters
                    ? "Sin resultados para esa búsqueda."
                    : "Sin unidades. Agrega la primera o usa \"Seed WB\" en Configuración."}
                </TableCell>
              </TableRow>
            )}

            {unidadesFiltradas.map((u) => {
              const isEditing  = editingId === u.id;
              const isDeleting = deletingId === u.id;
              const esCamion   = u.tipo === "camion";
              const unidadKm   = esCamion ? "km/L" : "L/Hr";
              const rend       = u.ultimoPeriodo;

              if (isEditing) {
                return (
                  <TableRow key={u.id} style={{ backgroundColor: "var(--surface)" }}>
                    <TableCell>
                      <Input value={editForm.codigo}
                        onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))}
                        className="h-8 font-mono font-bold text-sm uppercase w-24" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex gap-1.5">
                        <Input value={editForm.nombre}
                          onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                          placeholder="Nombre" className="h-8 text-sm" />
                        <Input value={editForm.modelo}
                          onChange={(e) => setEditForm((p) => ({ ...p, modelo: e.target.value }))}
                          placeholder="Modelo" className="h-8 text-sm" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={editForm.tipo}
                        onChange={(e) => setEditForm((p) => ({ ...p, tipo: e.target.value }))}
                        className="h-8 text-sm">
                        <option value="camion">Camión</option>
                        <option value="maquina">Maquinaria</option>
                        <option value="nissan">NISSAN</option>
                        <option value="otro">Otro</option>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" />
                    <TableCell className="hidden sm:table-cell" />
                    <TableCell className="hidden lg:table-cell" />
                    <TableCell className="hidden lg:table-cell" />
                    <TableCell colSpan={2}>
                      <div className="flex items-center gap-1.5">
                        {editError && <span className="text-xs text-red-500">{editError}</span>}
                        <button onClick={() => saveEdit(u.id)} disabled={isPending}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                          <Check className="w-4 h-4 text-emerald-500" />
                        </button>
                        <button onClick={cancelEdit}
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                          <X className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow
                  key={u.id}
                  className="cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
                  onClick={() => setSelectedUnit({ id: u.id, nombre: u.codigo })}
                >
                  {/* Código */}
                  <TableCell>
                    <span className="font-mono font-bold text-sm">{u.codigo}</span>
                  </TableCell>

                  {/* Nombre/Modelo */}
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">{u.nombre ?? u.codigo}</span>
                    {u.modelo && (
                      <span className="ml-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>· {u.modelo}</span>
                    )}
                  </TableCell>

                  {/* Tipo */}
                  <TableCell>
                    <Badge variant={TIPO_VARIANT[u.tipo] ?? "secondary"}>
                      {TIPO_LABELS[u.tipo] ?? u.tipo}
                    </Badge>
                  </TableCell>

                  {/* Litros totales */}
                  <TableCell className="hidden sm:table-cell text-right font-mono text-sm">
                    {u.totalLitros > 0 ? (
                      <span style={{ color: "var(--fg)" }}>{u.totalLitros.toLocaleString()} L</span>
                    ) : (
                      <span style={{ color: "var(--fg-muted)" }}>—</span>
                    )}
                  </TableCell>

                  {/* Total cargas */}
                  <TableCell className="hidden sm:table-cell text-right font-mono text-sm" style={{ color: "var(--fg-muted)" }}>
                    {u.totalCargas > 0 ? u.totalCargas : "—"}
                  </TableCell>

                  {/* Último rendimiento */}
                  <TableCell className="hidden lg:table-cell text-right">
                    {rend?.rendimientoActual !== null && rend?.rendimientoActual !== undefined ? (
                      <span className="font-mono text-sm font-semibold" style={{ color: "var(--fg)" }}>
                        {fmtNum(rend.rendimientoActual, 2)}{" "}
                        <span className="text-xs font-normal" style={{ color: "var(--fg-muted)" }}>{unidadKm}</span>
                      </span>
                    ) : (
                      <span className="text-sm" style={{ color: "var(--fg-muted)" }}>—</span>
                    )}
                  </TableCell>

                  {/* Δ Referencia */}
                  <TableCell className="hidden lg:table-cell text-right">
                    {rend?.diferencia !== null && rend?.diferencia !== undefined ? (() => {
                      const d   = rend.diferencia!;
                      const ok  = rend.dentroDeTolerancia;
                      const pos = d > 0;
                      const esMejora = esCamion ? pos : !pos;
                      const color = ok
                        ? "text-emerald-500"
                        : ok === false ? "text-red-500" : "text-amber-500";
                      const Icon = d === 0 ? Minus : esMejora ? TrendingUp : TrendingDown;
                      return (
                        <div className={`flex items-center justify-end gap-1 text-xs font-semibold ${color}`}>
                          <Icon className="w-3 h-3" />
                          {pos ? "+" : ""}{fmtNum(d, 2)}
                        </div>
                      );
                    })() : (
                      <span className="text-sm" style={{ color: "var(--fg-muted)" }}>—</span>
                    )}
                  </TableCell>

                  {/* Estado */}
                  <TableCell className="text-center">
                    <Badge variant={u.activo ? "success" : "secondary"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <div className="flex items-center gap-0.5 justify-end" onClick={(e) => e.stopPropagation()}>
                      {isDeleting ? (
                        <>
                          <span className="text-xs text-red-500 mr-1">¿Eliminar?</span>
                          <button onClick={() => confirmDelete(u.id)} disabled={isPending}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors">
                            Sí
                          </button>
                          <button onClick={() => setDeletingId(null)}
                            className="px-2 py-1 rounded-lg text-xs hover:bg-[var(--surface-2)] transition-colors ml-1"
                            style={{ color: "var(--fg-muted)" }}>
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleToggle(u.id, u.activo)}
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                            title={u.activo ? "Desactivar" : "Activar"}>
                            {u.activo
                              ? <PowerOff className="w-4 h-4 text-red-400" />
                              : <Power className="w-4 h-4 text-emerald-400" />}
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={() => startEdit(u)}
                                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors" title="Editar">
                                <Pencil className="w-4 h-4 text-indigo-400" />
                              </button>
                              <button onClick={() => { setDeletingId(u.id); setDeleteError(""); }}
                                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors" title="Eliminar">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
