"use client";

import { useState, useTransition } from "react";
import { Plus, CheckCircle, XCircle, Pencil, Trash2, Check, X, Search, SlidersHorizontal, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { MobileList, MobileRow, MobileStatStrip, MobileStickyToolbar } from "@/components/ui/mobile-list";
import { useRouter } from "next/navigation";
import { createObra, updateObra, toggleObraActiva, deleteObra } from "@/app/actions/catalogo";

type Obra = {
  id: number;
  nombre: string;
  cliente: string | null;
  activo: boolean;
  fechaInicio: string | null;
  fechaFin: string | null;
  totalLitros: number;
  totalCargas: number;
  ultimaFecha: string | null;
  unidades: number;
  precioLitro: number | null;
  costoEstimado: number | null;
};

function fmtL(n: number) {
  return `${Math.round(n).toLocaleString("es-MX")} L`;
}
function fmtMxn(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}
function fmtDia(fecha: string | null) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.slice(0, 10).split("-");
  return `${d}/${m}/${y.slice(2)}`;
}

export default function ObrasTable({
  obras,
  canEdit = false,
}: {
  obras: Obra[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ nombre: "", cliente: "", fechaInicio: "" });
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ nombre: string; cliente: string; fechaInicio: string }>({
    nombre: "", cliente: "", fechaInicio: "",
  });
  const [editError, setEditError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  // Búsqueda / filtro / orden
  const [busqueda,     setBusqueda]     = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"todos" | "activo" | "inactivo">("todos");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("desc");
  const [sortCol,      setSortCol]      = useState<"nombre" | "litros">("litros");
  const [showFilters,  setShowFilters]  = useState(false);

  const hasActiveFilters = estadoFiltro !== "todos";

  const obrasFiltradas = obras
    .filter((o) => {
      if (estadoFiltro === "activo"   && !o.activo) return false;
      if (estadoFiltro === "inactivo" && o.activo)  return false;
      if (busqueda) {
        const q = busqueda.toLowerCase();
        return o.nombre.toLowerCase().includes(q) || (o.cliente ?? "").toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortCol === "litros") return dir * (a.totalLitros - b.totalLitros);
      return dir * a.nombre.localeCompare(b.nombre);
    });

  const litrosTotales = obras.reduce((s, o) => s + o.totalLitros, 0);
  const costoTotal = obras.reduce((s, o) => s + (o.costoEstimado ?? 0), 0);
  const conConsumo = obras.filter((o) => o.totalLitros > 0).length;
  const precioLitro = obras.find((o) => o.precioLitro != null)?.precioLitro ?? null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
    startTransition(async () => {
      try {
        await createObra({
          nombre: form.nombre.trim(),
          cliente: form.cliente.trim() || undefined,
          fechaInicio: form.fechaInicio || undefined,
        });
        setForm({ nombre: "", cliente: "", fechaInicio: "" });
        setShowForm(false);
      } catch {
        setError("Error al guardar");
      }
    });
  }

  function startEdit(o: Obra) {
    setEditingId(o.id);
    setEditError("");
    setDeleteError("");
    setDeletingId(null);
    setEditForm({ nombre: o.nombre, cliente: o.cliente ?? "", fechaInicio: o.fechaInicio ?? "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  function saveEdit(id: number) {
    if (!editForm.nombre.trim()) { setEditError("El nombre es requerido"); return; }
    startTransition(async () => {
      try {
        await updateObra(id, {
          nombre: editForm.nombre.trim(),
          cliente: editForm.cliente.trim() || null,
          fechaInicio: editForm.fechaInicio || null,
        });
        setEditingId(null);
        setEditError("");
      } catch {
        setEditError("Error al guardar");
      }
    });
  }

  function confirmDelete(id: number) {
    setDeleteError("");
    startTransition(async () => {
      try {
        await deleteObra(id);
        setDeletingId(null);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Toolbar compacto */}
      <MobileStickyToolbar>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--fg-muted)" }} />
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar obra, cliente..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/30"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }} />
          {busqueda && (
            <button type="button" onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
              style={{ color: "var(--fg-muted)" }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          title="Filtros y orden"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all shrink-0 ${
            hasActiveFilters ? "border-indigo-500/50 bg-indigo-500/5" : "hover:bg-[var(--surface-2)]"
          }`}
          style={hasActiveFilters ? { color: "var(--fg)" } : { borderColor: "var(--border)", color: "var(--fg-muted)" }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {hasActiveFilters && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
        </button>

        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold shrink-0 transition-colors"
            style={{ backgroundColor: "rgb(79 70 229)", color: "white" }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva</span>
          </button>
        )}
      </div>
      </MobileStickyToolbar>

      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
            <DialogDescription>Estado y orden de las obras.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold shrink-0" style={{ color: "var(--fg-muted)" }}>Estado</span>
            {(["todos", "activo", "inactivo"] as const).map((e) => (
              <button key={e} type="button" onClick={() => setEstadoFiltro(e)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  estadoFiltro === e ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-[var(--surface-2)]"
                }`}
                style={estadoFiltro !== e ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}>
                {e === "todos" ? "Todas" : e === "activo" ? "Activas" : "Terminadas"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold shrink-0" style={{ color: "var(--fg-muted)" }}>Orden</span>
            <button type="button" onClick={() => {
              if (sortCol === "litros") {
                setSortDir((d) => d === "desc" ? "asc" : "desc");
              } else {
                setSortCol("litros");
                setSortDir("desc");
              }
            }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold border hover:bg-[var(--surface-2)] transition-colors"
              style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
              {sortCol === "litros"
                ? (sortDir === "desc" ? "Más diesel" : "Menos diesel")
                : (sortDir === "asc" ? "A → Z" : "Z → A")}
            </button>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={(o) => { if (!o) setShowForm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva obra</DialogTitle>
            <DialogDescription>Nombre, cliente y fecha de inicio.</DialogDescription>
          </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Incasa, Roble..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cliente">Cliente</Label>
              <Input id="cliente" name="cliente" value={form.cliente} onChange={handleChange}
                placeholder="Nombre del cliente" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fechaInicio">Fecha inicio</Label>
              <Input id="fechaInicio" name="fechaInicio" type="date" value={form.fechaInicio}
                onChange={handleChange} />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <DialogFooter>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm hover:bg-[var(--surface-2)] transition-colors"
              style={{ color: "var(--fg-muted)" }}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60">
              {isPending ? "Guardando..." : "Guardar"}
            </button>
          </DialogFooter>
        </form>
        </DialogContent>
      </Dialog>

      {deleteError && <p className="text-sm text-red-500 px-1">{deleteError}</p>}

      <MobileStatStrip
        items={[
          { key: "diesel", label: "Diesel", value: fmtL(litrosTotales) },
          { key: "costo", label: "Costo", value: costoTotal > 0 ? fmtMxn(costoTotal) : "—" },
          { key: "consumo", label: "Con consumo", value: String(conConsumo) },
          {
            key: "precio",
            label: precioLitro != null ? `${fmtMxn(precioLitro)}/L` : "Precio",
            value: precioLitro != null ? "última recarga" : "sin precio",
          },
        ]}
      />

      <div className="hidden md:grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Diesel campo", value: fmtL(litrosTotales) },
          { label: "Costo est.", value: costoTotal > 0 ? fmtMxn(costoTotal) : "—" },
          { label: "Con consumo", value: String(conConsumo) },
          { label: precioLitro != null ? `a ${fmtMxn(precioLitro)}/L` : "Precio pipa", value: precioLitro != null ? "última recarga" : "sin precio" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border px-3 py-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{k.label}</p>
            <p className="font-outfit font-bold text-lg mt-0.5" style={{ color: "var(--fg)" }}>{k.value}</p>
          </div>
        ))}
      </div>

      <MobileList
        empty={obrasFiltradas.length === 0 ? (
          <p className="text-center py-10 text-sm" style={{ color: "var(--fg-muted)" }}>
            {busqueda || estadoFiltro !== "todos"
              ? "Sin resultados para esa búsqueda."
              : "Sin obras registradas."}
          </p>
        ) : undefined}
      >
        {obrasFiltradas.map((o) => (
          <MobileRow key={o.id} onClick={() => router.push(`/catalogo/obras/${o.id}`)}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: "var(--fg)" }}>{o.nombre}</p>
                <p className="text-[11px] truncate" style={{ color: "var(--fg-muted)" }}>{o.cliente ?? "sin cliente"}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={o.activo ? "success" : "secondary"}>
                  {o.activo ? "Activa" : "Terminada"}
                </Badge>
                <ChevronRight className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
              </div>
            </div>
            <div className="mt-1.5 flex items-baseline gap-3 text-sm">
              <span className="font-mono font-semibold tabular-nums" style={{ color: "var(--fg)" }}>
                {fmtL(o.totalLitros)}
              </span>
              <span className="font-mono text-[13px] tabular-nums" style={{ color: "var(--fg-muted)" }}>
                {o.costoEstimado != null && o.totalLitros > 0 ? fmtMxn(o.costoEstimado) : "—"}
              </span>
              <span className="ml-auto text-[11px] tabular-nums" style={{ color: "var(--fg-muted)" }}>
                {o.totalCargas} c.{o.unidades > 0 ? ` · ${o.unidades} u.` : ""}
              </span>
            </div>
          </MobileRow>
        ))}
      </MobileList>

      <div className="hidden md:block rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead>Obra</TableHead>
              <TableHead className="hidden sm:table-cell">Cliente</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead className="hidden md:table-cell text-right">Costo</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Cargas</TableHead>
              <TableHead className="hidden lg:table-cell">Última</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {obrasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10" style={{ color: "var(--fg-muted)" }}>
                  {busqueda || estadoFiltro !== "todos"
                    ? "Sin resultados para esa búsqueda."
                    : "Sin obras registradas."}
                </TableCell>
              </TableRow>
            )}
            {obrasFiltradas.map((o) => {
              const isEditing = editingId === o.id;
              const isDeleting = deletingId === o.id;

              if (isEditing) {
                return (
                  <TableRow key={o.id} style={{ backgroundColor: "var(--surface)" }}>
                    <TableCell>
                      <Input
                        value={editForm.nombre}
                        onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="Nombre"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editForm.cliente}
                        onChange={(e) => setEditForm((p) => ({ ...p, cliente: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="Cliente"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={editForm.fechaInicio}
                        onChange={(e) => setEditForm((p) => ({ ...p, fechaInicio: e.target.value }))}
                        className="h-8 text-sm font-mono"
                      />
                    </TableCell>
                    <TableCell colSpan={5}>
                      <div className="flex items-center gap-1.5">
                        {editError && <span className="text-xs text-red-500">{editError}</span>}
                        <button
                          onClick={() => saveEdit(o.id)}
                          disabled={isPending}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                          title="Guardar"
                        >
                          <Check className="w-4 h-4 text-emerald-500" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              return (
                <TableRow
                  key={o.id}
                  className="cursor-pointer hover:bg-[var(--surface-2)]"
                  onClick={() => router.push(`/catalogo/obras/${o.id}`)}
                >
                  <TableCell>
                    <p className="font-medium text-sm">{o.nombre}</p>
                    <p className="text-[11px] sm:hidden" style={{ color: "var(--fg-muted)" }}>{o.cliente ?? "sin cliente"}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm" style={{ color: "var(--fg-muted)" }}>{o.cliente ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmtL(o.totalLitros)}</TableCell>
                  <TableCell className="hidden md:table-cell text-right text-sm" style={{ color: "var(--fg-muted)" }}>
                    {o.costoEstimado != null && o.totalLitros > 0 ? fmtMxn(o.costoEstimado) : "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right text-sm" style={{ color: "var(--fg-muted)" }}>
                    {o.totalCargas}
                    {o.unidades > 0 && <span className="ml-1 text-[11px]">· {o.unidades} u.</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm font-mono" style={{ color: "var(--fg-muted)" }}>
                    {fmtDia(o.ultimaFecha)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={o.activo ? "success" : "secondary"}>
                      {o.activo ? "Activa" : "Terminada"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5 justify-end" onClick={(e) => e.stopPropagation()}>
                      {isDeleting ? (
                        <>
                          <span className="text-xs text-red-500 mr-1">¿Eliminar?</span>
                          <button
                            onClick={() => confirmDelete(o.id)}
                            disabled={isPending}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-2 py-1 rounded-lg text-xs hover:bg-[var(--surface-2)] transition-colors ml-1"
                            style={{ color: "var(--fg-muted)" }}
                          >
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startTransition(() => toggleObraActiva(o.id, !o.activo))}
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                            title={o.activo ? "Cerrar obra" : "Reactivar obra"}
                          >
                            {o.activo
                              ? <XCircle className="w-4 h-4 text-red-400" />
                              : <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => startEdit(o)}
                                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4 text-indigo-400" />
                              </button>
                              <button
                                onClick={() => { setDeletingId(o.id); setDeleteError(""); }}
                                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                                title="Eliminar"
                              >
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
