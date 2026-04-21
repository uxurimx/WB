"use client";

import { useState, useTransition } from "react";
import { PlusCircle, Power, PowerOff, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createOperador, updateOperador, toggleOperadorActivo, deleteOperador } from "@/app/actions/catalogo";
import CatalogoDetalleModal from "./CatalogoDetalleModal";

type Operador = {
  id: number;
  nombre: string;
  tipo: string;
  telefono: string | null;
  activo: boolean;
};

const TIPO_LABELS: Record<string, string> = {
  chofer: "Chofer",
  maquinista: "Maquinista",
  taller: "Taller",
};

export default function OperadoresTable({
  operadores,
  canEdit = false,
}: {
  operadores: Operador[];
  canEdit?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({ nombre: "", tipo: "chofer", telefono: "" });
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ nombre: string; tipo: string; telefono: string }>({ nombre: "", tipo: "chofer", telefono: "" });
  const [editError, setEditError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }
    startTransition(async () => {
      try {
        await createOperador({
          nombre: form.nombre.trim(),
          tipo: form.tipo,
          telefono: form.telefono.trim() || undefined,
        });
        setForm({ nombre: "", tipo: "chofer", telefono: "" });
        setShowForm(false);
      } catch {
        setError("Error al guardar");
      }
    });
  }

  function startEdit(o: Operador) {
    setEditingId(o.id);
    setEditError("");
    setDeleteError("");
    setDeletingId(null);
    setEditForm({ nombre: o.nombre, tipo: o.tipo, telefono: o.telefono ?? "" });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  function saveEdit(id: number) {
    if (!editForm.nombre.trim()) { setEditError("El nombre es requerido"); return; }
    startTransition(async () => {
      try {
        await updateOperador(id, {
          nombre: editForm.nombre.trim(),
          tipo: editForm.tipo,
          telefono: editForm.telefono.trim() || null,
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
        await deleteOperador(id);
        setDeletingId(null);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
        setDeletingId(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant={showForm ? "secondary" : "default"} size="sm" onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="w-4 h-4" />
          {showForm ? "Cancelar" : "Nuevo Operador"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>Nuevo Operador</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Juan Pérez" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select id="tipo" name="tipo" value={form.tipo} onChange={handleChange}>
                <option value="chofer">Chofer</option>
                <option value="maquinista">Maquinista</option>
                <option value="taller">Taller</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={form.telefono} onChange={handleChange}
                placeholder="812 345 6789" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}

      {deleteError && <p className="text-sm text-red-500 px-1">{deleteError}</p>}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {operadores.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10" style={{ color: "var(--fg-muted)" }}>
                  Sin operadores registrados.
                </TableCell>
              </TableRow>
            )}
            {operadores.map((o) => {
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
                      <Select
                        value={editForm.tipo}
                        onChange={(e) => setEditForm((p) => ({ ...p, tipo: e.target.value }))}
                        className="h-8 text-sm"
                      >
                        <option value="chofer">Chofer</option>
                        <option value="maquinista">Maquinista</option>
                        <option value="taller">Taller</option>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editForm.telefono}
                        onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value }))}
                        className="h-8 text-sm"
                        placeholder="Teléfono"
                      />
                    </TableCell>
                    <TableCell colSpan={2}>
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
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-sm">{o.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{TIPO_LABELS[o.tipo] ?? o.tipo}</Badge>
                  </TableCell>
                  <TableCell className="text-sm" style={{ color: "var(--fg-muted)" }}>
                    {o.telefono ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={o.activo ? "success" : "secondary"}>
                      {o.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5 justify-end">
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
                          <CatalogoDetalleModal tipo="operador" id={o.id} nombre={o.nombre} />
                          <button
                            onClick={() => startTransition(() => toggleOperadorActivo(o.id, !o.activo))}
                            className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                            title={o.activo ? "Desactivar" : "Activar"}
                          >
                            {o.activo
                              ? <PowerOff className="w-4 h-4 text-red-400" />
                              : <Power className="w-4 h-4 text-emerald-400" />}
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
