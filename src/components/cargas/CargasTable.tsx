"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Check, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { updateCarga, deleteCarga } from "@/app/actions/cargas";

type Carga = {
  id: number;
  fecha: string;
  hora: string | null;
  folio: number | null;
  litros: number;
  odometroHrs: number | null;
  origen: string;
  tipoDiesel: string | null;
  notas: string | null;
  operadorId: number | null;
  obraId: number | null;
  unidad: { codigo: string } | null;
  operador: { nombre: string } | null;
  obra: { nombre: string } | null;
};

type Operador = { id: number; nombre: string };
type Obra = { id: number; nombre: string };

const ORIGEN_LABEL: Record<string, string> = { patio: "Patio", campo: "Campo" };
const ORIGEN_VARIANT: Record<string, "default" | "warning"> = { patio: "default", campo: "warning" };
const DIESEL_LABEL: Record<string, string> = { normal: "Normal", amigo: "Amigo", oxxogas: "OxxoGas" };
const DIESEL_VARIANT: Record<string, "default" | "success" | "danger"> = {
  normal: "default", amigo: "success", oxxogas: "danger",
};

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default function CargasTable({
  cargas,
  operadores,
  obras,
  canEdit,
}: {
  cargas: Carga[];
  operadores: Operador[];
  obras: Obra[];
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  // Edit state
  const [editCarga, setEditCarga] = useState<Carga | null>(null);
  const [editForm, setEditForm] = useState({
    fecha: "",
    hora: "",
    folio: "",
    litros: "",
    odometroHrs: "",
    operadorId: "",
    obraId: "",
    tipoDiesel: "normal",
    notas: "",
  });
  const [editError, setEditError] = useState("");

  // Delete state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function openEdit(c: Carga) {
    setEditCarga(c);
    setEditError("");
    setEditForm({
      fecha: c.fecha,
      hora: c.hora?.slice(0, 5) ?? "",
      folio: c.folio ? String(c.folio) : "",
      litros: String(c.litros),
      odometroHrs: c.odometroHrs ? String(c.odometroHrs) : "",
      operadorId: c.operadorId ? String(c.operadorId) : "",
      obraId: c.obraId ? String(c.obraId) : "",
      tipoDiesel: c.tipoDiesel ?? "normal",
      notas: c.notas ?? "",
    });
  }

  function handleEditChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEdit() {
    if (!editCarga) return;
    if (!editForm.litros || parseFloat(editForm.litros) <= 0) {
      setEditError("Los litros deben ser mayores a 0");
      return;
    }
    startTransition(async () => {
      try {
        await updateCarga(editCarga.id, {
          fecha: editForm.fecha,
          hora: editForm.hora || undefined,
          folio: editForm.folio ? parseInt(editForm.folio) : undefined,
          litros: parseFloat(editForm.litros),
          odometroHrs: editForm.odometroHrs ? parseFloat(editForm.odometroHrs) : null,
          operadorId: editForm.operadorId ? parseInt(editForm.operadorId) : null,
          obraId: editForm.obraId ? parseInt(editForm.obraId) : null,
          tipoDiesel: editForm.tipoDiesel,
          notas: editForm.notas || null,
        });
        setEditCarga(null);
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function confirmDelete(id: number) {
    setDeleteError("");
    startTransition(async () => {
      try {
        await deleteCarga(id);
        setDeletingId(null);
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
        setDeletingId(null);
      }
    });
  }

  return (
    <>
      {deleteError && (
        <p className="text-sm text-red-500 flex items-center gap-1.5 mb-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {deleteError}
        </p>
      )}

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Obra</TableHead>
              <TableHead>Diesel</TableHead>
              {canEdit && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargas.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 9 : 8} className="text-center py-16" style={{ color: "var(--fg-muted)" }}>
                  Sin cargas registradas.
                </TableCell>
              </TableRow>
            )}
            {cargas.map((c) => {
              const isDeleting = deletingId === c.id;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="font-mono text-sm font-semibold">{c.folio ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatFecha(c.fecha)}</span>
                    {c.hora && (
                      <span className="ml-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>
                        {c.hora.slice(0, 5)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-sm">{c.unidad?.codigo ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{c.operador?.nombre ?? "—"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-semibold text-sm">{c.litros.toLocaleString()}</span>
                    <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ORIGEN_VARIANT[c.origen] ?? "secondary"}>
                      {ORIGEN_LABEL[c.origen] ?? c.origen}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                      {c.obra?.nombre ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {c.tipoDiesel && c.tipoDiesel !== "normal" ? (
                      <Badge variant={DIESEL_VARIANT[c.tipoDiesel] ?? "secondary"}>
                        {DIESEL_LABEL[c.tipoDiesel] ?? c.tipoDiesel}
                      </Badge>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Normal</span>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-0.5 justify-end">
                        {isDeleting ? (
                          <>
                            <span className="text-xs text-red-500 mr-1">¿Eliminar?</span>
                            <button
                              onClick={() => confirmDelete(c.id)}
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
                              onClick={() => openEdit(c)}
                              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4 text-indigo-400" />
                            </button>
                            <button
                              onClick={() => { setDeletingId(c.id); setDeleteError(""); }}
                              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editCarga} onOpenChange={(open) => { if (!open) setEditCarga(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar carga #{editCarga?.folio ?? editCarga?.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
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
                <Input name="folio" type="number" value={editForm.folio} onChange={handleEditChange}
                  className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Litros *</Label>
                <Input name="litros" type="number" step="0.5" value={editForm.litros} onChange={handleEditChange}
                  className="font-mono font-bold" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Odómetro / Horas</Label>
              <Input name="odometroHrs" type="number" step="1" value={editForm.odometroHrs}
                onChange={handleEditChange} className="font-mono" placeholder="—" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operador</Label>
                <Select name="operadorId" value={editForm.operadorId} onChange={handleEditChange}>
                  <option value="">— Ninguno —</option>
                  {operadores.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Obra</Label>
                <Select name="obraId" value={editForm.obraId} onChange={handleEditChange}>
                  <option value="">— Sin obra —</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de diesel</Label>
              <Select name="tipoDiesel" value={editForm.tipoDiesel} onChange={handleEditChange}>
                <option value="normal">Normal</option>
                <option value="amigo">Amigo (verde)</option>
                <option value="oxxogas">OxxoGas (rojo)</option>
              </Select>
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
              Nota: cambiar los litros ajusta automáticamente el stock del tanque.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button size="sm" disabled={isPending} onClick={saveEdit}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
