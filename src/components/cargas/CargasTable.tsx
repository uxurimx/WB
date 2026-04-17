"use client";

import { useState, useTransition } from "react";
import {
  Pencil, Trash2, AlertCircle, ArrowRight, Fuel,
  ChevronDown, ChevronUp, Gauge, Hash, MapPin, User, Clock,
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
      {/* Fila principal */}
      <tr
        className="border-b transition-colors hover:bg-[rgba(0,0,0,0.02)] cursor-pointer"
        style={{ borderColor: "var(--border)" }}
        onClick={() => hasDetails && setExpanded((v) => !v)}
      >
        {/* Folio */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {item.folio ?? "—"}
          </span>
        </td>
        {/* Fecha */}
        <td className="px-4 py-3 whitespace-nowrap">
          <p className="text-sm" style={{ color: "var(--fg)" }}>{formatFecha(item.fecha)}</p>
          {item.hora && (
            <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{item.hora.slice(0, 5)}</p>
          )}
        </td>
        {/* Unidad */}
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono font-bold text-sm" style={{ color: "var(--fg)" }}>
            {item.unidad?.codigo ?? "—"}
          </span>
        </td>
        {/* Operador */}
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
            {item.operador?.nombre ?? "—"}
          </span>
        </td>
        {/* Litros */}
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <span className="font-mono font-semibold text-sm" style={{ color: "var(--fg)" }}>
            {item.litros.toLocaleString()}
          </span>
          <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
        </td>
        {/* Odómetro — visible en md+ */}
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
        {/* CuentaLT */}
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
        {/* Origen */}
        <td className="px-4 py-3 whitespace-nowrap">
          <Badge variant={item.origen === "campo" ? "warning" : "default"}>
            {item.origen === "campo" ? "Campo" : "Patio"}
          </Badge>
        </td>
        {/* Expander + acciones */}
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1 justify-end">
            {hasDetails && (
              <span style={{ color: "var(--fg-muted)" }}>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            )}
            {canEdit && (
              <>
                {isDeleting ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-red-500">¿Eliminar?</span>
                    <button onClick={() => onDelete(item.id)} disabled={isPending}
                      className="px-2 py-0.5 rounded text-xs font-semibold bg-red-600 text-white">Sí</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => onEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-indigo-400" />
                    </button>
                    <button onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </td>
      </tr>

      {/* Fila expandida con detalles */}
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
              {/* Operador — visible en detail para mobile */}
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

  const [editCarga, setEditCarga]   = useState<CargaItem | null>(null);
  const [editForm, setEditForm]     = useState({
    fecha: "", hora: "", folio: "", litros: "", odometroHrs: "",
    cuentaLtInicio: "", cuentaLtFin: "",
    operadorId: "", obraId: "", notas: "",
  });
  const [editError, setEditError]   = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function openEdit(c: CargaItem) {
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
          fecha:          editForm.fecha,
          hora:           editForm.hora || undefined,
          folio:          editForm.folio ? parseInt(editForm.folio) : undefined,
          litros:         parseFloat(editForm.litros),
          odometroHrs:    editForm.odometroHrs ? parseFloat(editForm.odometroHrs) : null,
          cuentaLtInicio: editForm.cuentaLtInicio ? parseFloat(editForm.cuentaLtInicio) : null,
          cuentaLtFin:    editForm.cuentaLtFin ? parseFloat(editForm.cuentaLtFin) : null,
          operadorId:     editForm.operadorId ? parseInt(editForm.operadorId) : null,
          obraId:         editForm.obraId ? parseInt(editForm.obraId) : null,
          notas:          editForm.notas || null,
        });
        setEditCarga(null);
      } catch (err) {
        setEditError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleDeleteClick(id: number) {
    if (deletingId === id) {
      // Segunda vez = confirmar
      startTransition(async () => {
        try {
          await deleteCarga(id);
          setDeletingId(null);
        } catch (err) {
          setDeleteError(err instanceof Error ? err.message : "Error al eliminar");
          setDeletingId(null);
        }
      });
    } else {
      setDeletingId(id);
      setDeleteError("");
    }
  }

  return (
    <>
      {deleteError && (
        <p className="text-sm text-red-500 flex items-center gap-1.5 mb-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {deleteError}
        </p>
      )}

      {/* Tabla — scroll horizontal en móvil */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr style={{ backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--fg-muted)" }}>Folio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--fg-muted)" }}>Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--fg-muted)" }}>Unidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden sm:table-cell"
                  style={{ color: "var(--fg-muted)" }}>Operador</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--fg-muted)" }}>Litros</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell"
                  style={{ color: "var(--fg-muted)" }}>Odóm./HRS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell"
                  style={{ color: "var(--fg-muted)" }}>CuentaLT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--fg-muted)" }}>Tipo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-sm" style={{ color: "var(--fg-muted)" }}>
                    Sin registros.
                  </td>
                </tr>
              )}

              {items.map((item) => {
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
                      <td className="px-4 py-3" />
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
                      <td className="px-4 py-3 hidden lg:table-cell" />
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "rgb(139,92,246)" }}>
                          <ArrowRight className="w-2.5 h-2.5" /> Transf.
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.notas && (
                          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{item.notas}</span>
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
                    onEdit={openEdit}
                    onDelete={handleDeleteClick}
                    isDeleting={deletingId === item.id}
                    isPending={isPending}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      <Dialog open={!!editCarga} onOpenChange={(open) => { if (!open) setEditCarga(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar carga #{editCarga?.folio ?? editCarga?.id}</DialogTitle>
          </DialogHeader>

          {/* Info de sólo lectura */}
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
                onChange={handleEditChange} className="font-mono"
                placeholder="Sin registro" />
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
                  {operadores.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Obra</Label>
                <Select name="obraId" value={editForm.obraId} onChange={handleEditChange}>
                  <option value="">— Sin obra —</option>
                  {obras.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
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
            <Button size="sm" disabled={isPending} onClick={saveEdit}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
