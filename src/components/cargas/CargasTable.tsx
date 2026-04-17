"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, AlertCircle, ArrowRight, Fuel } from "lucide-react";
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
type Obra = { id: number; nombre: string };

const ORIGEN_LABEL: Record<string, string> = { patio: "Patio", campo: "Campo" };
const ORIGEN_VARIANT: Record<string, "default" | "warning"> = { patio: "default", campo: "warning" };

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });
}

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

  const [editCarga, setEditCarga] = useState<CargaItem | null>(null);
  const [editForm, setEditForm] = useState({
    fecha: "", hora: "", folio: "", litros: "", odometroHrs: "",
    operadorId: "", obraId: "", tipoDiesel: "normal", notas: "",
  });
  const [editError, setEditError] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function openEdit(c: CargaItem) {
    setEditCarga(c);
    setEditError("");
    setEditForm({
      fecha: c.fecha,
      hora: c.hora?.slice(0, 5) ?? "",
      folio: c.folio ? String(c.folio) : "",
      litros: String(c.litros),
      odometroHrs: c.odometroHrs != null ? String(c.odometroHrs) : "",
      operadorId: c.operadorId ? String(c.operadorId) : "",
      obraId: c.obraId ? String(c.obraId) : "",
      tipoDiesel: c.tipoDiesel ?? "normal",
      notas: c.notas ?? "",
    });
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setEditForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEdit() {
    if (!editCarga) return;
    if (!editForm.litros || parseFloat(editForm.litros) <= 0) {
      setEditError("Los litros deben ser mayores a 0"); return;
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
              <TableHead>Folio/Ref</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Unidad / Tanque</TableHead>
              <TableHead>Operador / Prov.</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Obra / Info</TableHead>
              {canEdit && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-16" style={{ color: "var(--fg-muted)" }}>
                  Sin registros.
                </TableCell>
              </TableRow>
            )}

            {items.map((item) => {
              const key = `${item._tipo}-${item.id}`;

              // ─── Recarga row ──────────────────────────────────────
              if (item._tipo === "recarga") {
                return (
                  <TableRow key={key} style={{ backgroundColor: "rgba(16, 185, 129, 0.04)" }}>
                    <TableCell>
                      <span className="font-mono text-xs" style={{ color: "var(--fg-muted)" }}>
                        {item.folioFactura ? item.folioFactura : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatFecha(item.fecha)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <Fuel className="w-3 h-3 shrink-0" />
                        {item.tanqueNombre}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                        {item.proveedor ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-semibold text-sm text-emerald-600">
                        +{item.litros.toLocaleString()}
                      </span>
                      <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: "rgba(16,185,129,0.15)", color: "rgb(16,185,129)" }}>
                        <Fuel className="w-2.5 h-2.5" /> Recarga
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
                        {item.precioLitro != null ? `$${item.precioLitro.toFixed(2)}/L` : "—"}
                        {item.cuentalitrosInicio != null && (
                          <span className="ml-1.5 font-mono">CL:{item.cuentalitrosInicio.toLocaleString()}</span>
                        )}
                      </span>
                    </TableCell>
                    {canEdit && <TableCell />}
                  </TableRow>
                );
              }

              // ─── Transferencia row ────────────────────────────────
              if (item._tipo === "transferencia") {
                return (
                  <TableRow key={key} style={{ backgroundColor: "rgba(139, 92, 246, 0.04)" }}>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold" style={{ color: "var(--fg-muted)" }}>
                        {item.folio != null ? `#${item.folio}` : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatFecha(item.fecha)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--fg-muted)" }}>
                        {item.origenNombre}
                        <ArrowRight className="w-3 h-3 shrink-0" />
                        {item.destinoNombre}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>—</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono font-semibold text-sm">{item.litros.toLocaleString()}</span>
                      <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: "rgba(139, 92, 246, 0.15)", color: "rgb(139, 92, 246)" }}>
                        <ArrowRight className="w-2.5 h-2.5" /> Transferencia
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{item.notas ?? "—"}</span>
                    </TableCell>
                    {canEdit && <TableCell />}
                  </TableRow>
                );
              }

              // ─── Carga row ────────────────────────────────────────
              const deletingKey = `carga-${item.id}`;
              const isDeleting = deletingId === deletingKey;

              return (
                <TableRow key={key}>
                  <TableCell>
                    <span className="font-mono text-sm font-semibold">{item.folio ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatFecha(item.fecha)}</span>
                    {item.hora && (
                      <span className="ml-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>
                        {item.hora.slice(0, 5)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-bold text-sm">{item.unidad?.codigo ?? "—"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{item.operador?.nombre ?? "—"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-semibold text-sm">{item.litros.toLocaleString()}</span>
                    <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ORIGEN_VARIANT[item.origen] ?? "secondary"}>
                      {ORIGEN_LABEL[item.origen] ?? item.origen}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                      {item.obra?.nombre ?? "—"}
                    </span>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-0.5 justify-end">
                        {isDeleting ? (
                          <>
                            <span className="text-xs text-red-500 mr-1">¿Eliminar?</span>
                            <button onClick={() => confirmDelete(item.id)} disabled={isPending}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors">
                              Sí
                            </button>
                            <button onClick={() => setDeletingId(null)}
                              className="px-2 py-1 rounded-lg text-xs hover:bg-[var(--surface-2)] transition-colors ml-1"
                              style={{ color: "var(--fg-muted)" }}>No</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors" title="Editar">
                              <Pencil className="w-4 h-4 text-indigo-400" />
                            </button>
                            <button onClick={() => { setDeletingId(deletingKey); setDeleteError(""); }}
                              className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors" title="Eliminar">
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
                <Input name="folio" type="number" value={editForm.folio} onChange={handleEditChange} className="font-mono" />
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
                onChange={handleEditChange} className="font-mono"
                placeholder={editForm.odometroHrs ? undefined : "Sin registro"} />
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
