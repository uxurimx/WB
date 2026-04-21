"use client";

import { useState, useTransition } from "react";
import { PlusCircle, Power, PowerOff, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createUnidad, updateUnidad, toggleUnidadActivo, deleteUnidad } from "@/app/actions/catalogo";
import CatalogoDetalleModal from "./CatalogoDetalleModal";

type Unidad = {
  id: number;
  codigo: string;
  nombre: string | null;
  tipo: string;
  modelo: string | null;
  capacidadTanque: number | null;
  rendimientoReferencia: number | null;
  activo: boolean;
};

const TIPO_LABELS: Record<string, string> = {
  camion: "Camión",
  maquina: "Maquinaria",
  nissan: "NISSAN",
  otro: "Otro",
};

const TIPO_VARIANT: Record<string, "default" | "success" | "warning" | "secondary"> = {
  camion: "default",
  maquina: "warning",
  nissan: "success",
  otro: "secondary",
};

export default function UnidadesTable({
  unidades,
  canEdit = false,
}: {
  unidades: Unidad[];
  canEdit?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    codigo: "",
    nombre: "",
    tipo: "camion",
    modelo: "",
    capacidadTanque: "",
    rendimientoReferencia: "",
  });
  const [error, setError] = useState("");

  // Edit state
  type EditForm = { codigo: string; nombre: string; tipo: string; modelo: string; capacidadTanque: string; rendimientoReferencia: string };
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ codigo: "", nombre: "", tipo: "camion", modelo: "", capacidadTanque: "", rendimientoReferencia: "" });
  const [editError, setEditError] = useState("");

  // Delete confirm state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.codigo.trim()) { setError("El código es requerido"); return; }
    if (!form.tipo) { setError("El tipo es requerido"); return; }

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
      } catch {
        setError("Error al guardar. ¿El código ya existe?");
      }
    });
  }

  function handleToggle(id: number, activo: boolean) {
    startTransition(() => toggleUnidadActivo(id, !activo));
  }

  function startEdit(u: Unidad) {
    setEditingId(u.id);
    setEditError("");
    setDeleteError("");
    setDeletingId(null);
    setEditForm({
      codigo: u.codigo,
      nombre: u.nombre ?? "",
      tipo: u.tipo,
      modelo: u.modelo ?? "",
      capacidadTanque: u.capacidadTanque ? String(u.capacidadTanque) : "",
      rendimientoReferencia: u.rendimientoReferencia ? String(u.rendimientoReferencia) : "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

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
        await deleteUnidad(id);
        setDeletingId(null);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex justify-end">
        <Button
          variant={showForm ? "secondary" : "default"}
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusCircle className="w-4 h-4" />
          {showForm ? "Cancelar" : "Nueva Unidad"}
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>
            Nueva Unidad
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" name="codigo" value={form.codigo} onChange={handleChange}
                placeholder="CA12, EX01, R02..." className="uppercase" />
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
              <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Nombre descriptivo" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" name="modelo" value={form.modelo} onChange={handleChange}
                placeholder="Komatsu PC88, CAT 308..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="capacidadTanque">Cap. Tanque (L)</Label>
              <Input id="capacidadTanque" name="capacidadTanque" type="number" value={form.capacidadTanque}
                onChange={handleChange} placeholder="300" />
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar Unidad"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {deleteError && (
        <p className="text-sm text-red-500 px-1">{deleteError}</p>
      )}

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead>Código</TableHead>
              <TableHead>Nombre / Modelo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Cap. L</TableHead>
              <TableHead className="text-right">Rend. Ref.</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {unidades.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10" style={{ color: "var(--fg-muted)" }}>
                  Sin unidades. Agrega la primera o usa "Seed WB" en Configuración.
                </TableCell>
              </TableRow>
            )}
            {unidades.map((u) => {
              const isEditing = editingId === u.id;
              const isDeleting = deletingId === u.id;

              if (isEditing) {
                return (
                  <TableRow key={u.id} style={{ backgroundColor: "var(--surface)" }}>
                    <TableCell>
                      <Input
                        value={editForm.codigo}
                        onChange={(e) => setEditForm((p) => ({ ...p, codigo: e.target.value }))}
                        className="h-8 font-mono font-bold text-sm uppercase w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Input
                          value={editForm.nombre}
                          onChange={(e) => setEditForm((p) => ({ ...p, nombre: e.target.value }))}
                          placeholder="Nombre"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={editForm.modelo}
                          onChange={(e) => setEditForm((p) => ({ ...p, modelo: e.target.value }))}
                          placeholder="Modelo"
                          className="h-8 text-sm"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={editForm.tipo}
                        onChange={(e) => setEditForm((p) => ({ ...p, tipo: e.target.value }))}
                        className="h-8 text-sm"
                      >
                        <option value="camion">Camión</option>
                        <option value="maquina">Maquinaria</option>
                        <option value="nissan">NISSAN</option>
                        <option value="otro">Otro</option>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editForm.capacidadTanque}
                        onChange={(e) => setEditForm((p) => ({ ...p, capacidadTanque: e.target.value }))}
                        className="h-8 font-mono text-sm text-right w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={editForm.rendimientoReferencia}
                        onChange={(e) => setEditForm((p) => ({ ...p, rendimientoReferencia: e.target.value }))}
                        className="h-8 font-mono text-sm text-right w-20"
                      />
                    </TableCell>
                    <TableCell colSpan={2}>
                      <div className="flex items-center gap-1.5">
                        {editError && <span className="text-xs text-red-500">{editError}</span>}
                        <button
                          onClick={() => saveEdit(u.id)}
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
                <TableRow key={u.id}>
                  <TableCell>
                    <span className="font-mono font-bold text-sm">{u.codigo}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{u.nombre ?? u.codigo}</span>
                    {u.modelo && (
                      <span className="ml-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>
                        · {u.modelo}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={TIPO_VARIANT[u.tipo] ?? "secondary"}>
                      {TIPO_LABELS[u.tipo] ?? u.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {u.capacidadTanque ? `${u.capacidadTanque}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {u.rendimientoReferencia
                      ? `${u.rendimientoReferencia} ${u.tipo === "maquina" ? "L/Hr" : "km/L"}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={u.activo ? "success" : "secondary"}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5 justify-end">
                      {isDeleting ? (
                        <>
                          <span className="text-xs text-red-500 mr-1">¿Eliminar?</span>
                          <button
                            onClick={() => confirmDelete(u.id)}
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
                          <CatalogoDetalleModal tipo="unidad" id={u.id} nombre={u.codigo} />
                          <button
                            onClick={() => handleToggle(u.id, u.activo)}
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                            title={u.activo ? "Desactivar" : "Activar"}
                          >
                            {u.activo
                              ? <PowerOff className="w-4 h-4 text-red-400" />
                              : <Power className="w-4 h-4 text-emerald-400" />
                            }
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => startEdit(u)}
                                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4 text-indigo-400" />
                              </button>
                              <button
                                onClick={() => { setDeletingId(u.id); setDeleteError(""); }}
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
