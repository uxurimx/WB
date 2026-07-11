"use client";

import { useState, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { ajustarStockTanque } from "@/app/actions/tanques";

export default function AjustarStockModal({
  tanqueId,
  tanqueNombre,
  litrosActuales,
  capacidadMax,
  onSuccess,
}: {
  tanqueId: number;
  tanqueNombre: string;
  litrosActuales: number;
  capacidadMax: number;
  onSuccess?: (nuevosLitros: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [litros, setLitros] = useState("");
  const [notas, setNotas] = useState("");

  function handleOpen() {
    setLitros(String(Math.round(litrosActuales)));
    setNotas("");
    setError("");
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(litros);
    if (isNaN(val) || val < 0) { setError("Ingresa un valor válido (≥ 0)"); return; }
    if (val > capacidadMax) { setError(`Supera la capacidad máxima (${capacidadMax.toLocaleString()} L)`); return; }
    setError("");

    startTransition(async () => {
      try {
        await ajustarStockTanque(tanqueId, val, notas || undefined);
        onSuccess?.(val);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={handleOpen} className="shrink-0">
        <SlidersHorizontal className="w-3.5 h-3.5" /> Ajustar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajuste de inventario — {tanqueNombre}</DialogTitle>
            <DialogDescription>
              Mide físicamente el tanque e ingresa el nivel real. Esto crea
              un punto de ancla nuevo para la conciliación automática.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className="p-3 rounded-xl text-sm"
              style={{ backgroundColor: "var(--surface-2)" }}
            >
              <span style={{ color: "var(--fg-muted)" }}>Sistema dice actualmente: </span>
              <span className="font-mono font-bold" style={{ color: "var(--fg)" }}>
                {litrosActuales.toLocaleString()} L
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aj-litros">Litros medidos físicamente *</Label>
              <Input
                id="aj-litros"
                type="number"
                step="1"
                min="0"
                max={capacidadMax}
                value={litros}
                onChange={(e) => setLitros(e.target.value)}
                placeholder="Ej: 3200"
                className="font-mono font-bold text-lg"
                autoFocus
              />
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                Capacidad máxima: {capacidadMax.toLocaleString()} L
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="aj-notas">
                Motivo <span className="font-normal opacity-60">(opc.)</span>
              </Label>
              <Input
                id="aj-notas"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Medición con regla de nivel"
              />
            </div>

            {litros && !isNaN(parseFloat(litros)) && (
              <div
                className="p-3 rounded-xl text-sm flex items-center justify-between"
                style={{ backgroundColor: "var(--surface-2)" }}
              >
                <span style={{ color: "var(--fg-muted)" }}>Diferencia:</span>
                <span
                  className="font-mono font-semibold"
                  style={{
                    color: Math.abs(parseFloat(litros) - litrosActuales) > 50
                      ? "rgb(234 179 8)"
                      : "var(--fg)",
                  }}
                >
                  {(parseFloat(litros) - litrosActuales) >= 0 ? "+" : ""}
                  {(parseFloat(litros) - litrosActuales).toFixed(0)} L
                </span>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">Cancelar</Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Guardando..." : "Confirmar ajuste"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
