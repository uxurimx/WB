"use client";

import { useState, useTransition } from "react";
import { PlusCircle, CheckCircle, XCircle, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createObra, updateObra, toggleObraActiva, deleteObra } from "@/app/actions/catalogo";
import CatalogoDetalleModal from "./CatalogoDetalleModal";

type Obra = {
  id: number;
  nombre: string;
  cliente: string | null;
  activo: boolean;
  fechaInicio: string | null;
  fechaFin: string | null;
};

export default function ObrasTable({
  obras,
  canEdit = false,
}: {
  obras: Obra[];
  canEdit?: boolean;
}) {
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant={showForm ? "secondary" : "default"} size="sm" onClick={() => setShowForm(!showForm)}>
          <PlusCircle className="w-4 h-4" />
          {showForm ? "Cancelar" : "Nueva Obra"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>Nueva Obra</p>
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
              <TableHead>Obra</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {obras.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10" style={{ color: "var(--fg-muted)" }}>
                  Sin obras registradas.
                </TableCell>
              </TableRow>
            )}
            {obras.map((o) => {
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
                  <TableCell className="text-sm" style={{ color: "var(--fg-muted)" }}>{o.cliente ?? "—"}</TableCell>
                  <TableCell className="text-sm font-mono" style={{ color: "var(--fg-muted)" }}>
                    {o.fechaInicio ?? "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={o.activo ? "success" : "secondary"}>
                      {o.activo ? "Activa" : "Terminada"}
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
                          <CatalogoDetalleModal tipo="obra" id={o.id} nombre={o.nombre} />
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
