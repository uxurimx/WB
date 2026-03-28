"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Hash } from "lucide-react";
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
import { transferirEntreTanques } from "@/app/actions/tanques";
import { getSiguienteFolioPublic } from "@/app/actions/cargas";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function TransferirNissanModal({
  tanqueOrigenId,
  tanqueDestinoId,
  litrosDisponibles,
}: {
  tanqueOrigenId: number;
  tanqueDestinoId: number;
  litrosDisponibles: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [folioPreview, setFolioPreview] = useState<number | null>(null);

  const [form, setForm] = useState({ fecha: todayStr(), litros: "", notas: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleOpen() {
    setForm({ fecha: todayStr(), litros: "", notas: "" });
    setError("");
    setSuccess("");
    setFolioPreview(null);
    setOpen(true);
    // Obtener el folio que se asignará a esta transferencia
    startTransition(async () => {
      const folio = await getSiguienteFolioPublic();
      setFolioPreview(folio);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const litros = parseFloat(form.litros);
    if (!litros || litros <= 0) {
      setError("Ingresa los litros a transferir");
      return;
    }
    if (litros > litrosDisponibles) {
      setError(`Solo hay ${litrosDisponibles.toFixed(0)} L disponibles en Taller`);
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        const res = await transferirEntreTanques({
          tanqueOrigenId,
          tanqueDestinoId,
          litros,
          fecha: form.fecha,
          notas: form.notas || undefined,
        });
        setSuccess(
          `Folio #${res.folio} · ${litros.toLocaleString()} L transferidos → NISSAN. ` +
          `Taller: ${res.origen.litrosActuales.toFixed(0)} L | ` +
          `NISSAN: ${res.destino.litrosActuales.toFixed(0)} L`
        );
        setForm({ fecha: todayStr(), litros: "", notas: "" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al transferir");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleOpen}
        className="shrink-0"
      >
        <ArrowRight className="w-3.5 h-3.5" /> Cargar NISSAN
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Cargar NISSAN desde Taller
              {folioPreview !== null && (
                <span className="flex items-center gap-1 text-sm font-normal px-2 py-0.5 rounded-lg"
                  style={{ backgroundColor: "var(--surface-2)", color: "var(--fg-muted)" }}>
                  <Hash className="w-3.5 h-3.5" />
                  Folio {folioPreview}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Resta del tanque Taller y suma al NISSAN.{" "}
              <span className="font-semibold">
                Disponible: {litrosDisponibles.toLocaleString()} L
              </span>
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="space-y-4">
              <p className="text-sm text-emerald-500">{success}</p>
              <DialogFooter>
                <Button type="button" size="sm" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="t-fecha">Fecha</Label>
                  <Input
                    id="t-fecha"
                    name="fecha"
                    type="date"
                    value={form.fecha}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="t-litros">Litros *</Label>
                  <Input
                    id="t-litros"
                    name="litros"
                    type="number"
                    step="1"
                    min="1"
                    max={litrosDisponibles}
                    value={form.litros}
                    onChange={handleChange}
                    placeholder="500"
                    className="font-mono font-bold text-lg"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="t-notas">
                  Notas <span className="font-normal opacity-60">(opc.)</span>
                </Label>
                <Input
                  id="t-notas"
                  name="notas"
                  value={form.notas}
                  onChange={handleChange}
                  placeholder="Viaje a obra norte"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" size="sm">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Transfiriendo..." : "Confirmar transferencia"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
