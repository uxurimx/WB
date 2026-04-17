"use client";

import { useState, useTransition } from "react";
import { Settings2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { updateTanque } from "@/app/actions/tanques";

export type TanqueInfo = {
  id: number;
  nombre: string;
  litros: number;
  max: number;
  cuentalitros: number;
  ajustePorcentaje: number;
  ultimaActualizacion: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EditarTanqueModal({ tanque }: { tanque: TanqueInfo }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    nombre:           tanque.nombre,
    capacidadMax:     String(tanque.max),
    ajustePorcentaje: String(tanque.ajustePorcentaje),
  });

  function handleOpen() {
    setForm({
      nombre:           tanque.nombre,
      capacidadMax:     String(tanque.max),
      ajustePorcentaje: String(tanque.ajustePorcentaje),
    });
    setError("");
    setSuccess(false);
    setOpen(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const capacidadMax = parseFloat(form.capacidadMax);
    if (!capacidadMax || capacidadMax <= 0) {
      setError("La capacidad debe ser mayor a 0");
      return;
    }
    if (!form.nombre.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        await updateTanque(tanque.id, {
          nombre:           form.nombre.trim(),
          capacidadMax,
          ajustePorcentaje: parseFloat(form.ajustePorcentaje) || 0,
        });
        setSuccess(true);
        setTimeout(() => setOpen(false), 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="p-1 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
        title="Editar tanque"
      >
        <Settings2 className="w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar tanque — {tanque.nombre}</DialogTitle>
            <DialogDescription>
              Modifica nombre, capacidad máxima y porcentaje de merma.
            </DialogDescription>
          </DialogHeader>

          {/* Info de sólo lectura */}
          <div
            className="rounded-xl border p-3 space-y-1.5"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--fg-muted)" }}>
              Estado actual
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <InfoRow label="Stock" value={`${tanque.litros.toLocaleString()} L`} />
              <InfoRow label="Cuentalitros" value={tanque.cuentalitros.toLocaleString()} />
              <InfoRow label="Capacidad" value={`${tanque.max.toLocaleString()} L`} />
              <InfoRow label="Merma actual" value={`${tanque.ajustePorcentaje}%`} />
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: "var(--fg-muted)" }}>
              Última actualización: {formatDate(tanque.ultimaActualizacion)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 mt-1">
            <div className="space-y-1.5">
              <Label htmlFor="et-nombre">Nombre del tanque</Label>
              <Input
                id="et-nombre"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Taller"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="et-cap">Capacidad máx. (L)</Label>
                <Input
                  id="et-cap"
                  name="capacidadMax"
                  type="number"
                  step="100"
                  min="1"
                  value={form.capacidadMax}
                  onChange={handleChange}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="et-ajuste">
                  Merma{" "}
                  <span className="font-normal opacity-60">(%)</span>
                </Label>
                <Input
                  id="et-ajuste"
                  name="ajustePorcentaje"
                  type="number"
                  step="0.5"
                  min="0"
                  max="10"
                  value={form.ajustePorcentaje}
                  onChange={handleChange}
                  className="font-mono"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && (
              <p className="text-sm text-emerald-500 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Guardado
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>{label}</span>
      <p className="text-xs font-semibold font-mono" style={{ color: "var(--fg)" }}>{value}</p>
    </div>
  );
}
