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
import { getSiguienteFolioPatioPublic } from "@/app/actions/cargas";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TransferirNissanModal({
  tanqueOrigenId,
  tanqueDestinoId,
  litrosDisponibles,
  cuentalitrosTaller,
  onTransferComplete,
}: {
  tanqueOrigenId: number;
  tanqueDestinoId: number;
  litrosDisponibles: number;
  cuentalitrosTaller?: number;
  onTransferComplete?: (origenLitros: number, destinoLitros: number, origenCuentalitros: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fecha: todayStr(), litros: "", notas: "", folio: "",
    cuentaLtInicio: cuentalitrosTaller != null ? String(cuentalitrosTaller) : "",
    cuentaLtFin: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const cuentaLtFin = (() => {
    const inicio = parseFloat(form.cuentaLtInicio);
    const litros = parseFloat(form.litros);
    if (!isNaN(inicio) && !isNaN(litros) && litros > 0) {
      return String(inicio + litros);
    }
    return "";
  })();

  function handleOpen() {
    setForm({
      fecha: todayStr(), litros: "", notas: "", folio: "",
      cuentaLtInicio: cuentalitrosTaller != null ? String(cuentalitrosTaller) : "",
      cuentaLtFin: "",
    });
    setError("");
    setSuccess("");
    setOpen(true);
    startTransition(async () => {
      const siguiente = await getSiguienteFolioPatioPublic();
      setForm((prev) => ({ ...prev, folio: String(siguiente) }));
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const folioNum = parseInt(form.folio);
    if (!form.folio || isNaN(folioNum) || folioNum <= 0) {
      setError("El folio del ticket es requerido");
      return;
    }
    if (folioNum > 99999) {
      setError("El folio no puede tener más de 5 dígitos");
      return;
    }
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
        const inicioVal = form.cuentaLtInicio !== "" ? parseFloat(form.cuentaLtInicio) : undefined;
        const res = await transferirEntreTanques({
          tanqueOrigenId,
          tanqueDestinoId,
          litros,
          folio: folioNum,
          fecha: form.fecha,
          notas: form.notas || undefined,
          cuentalitrosOrigen: inicioVal !== undefined && !isNaN(inicioVal) ? inicioVal : undefined,
        });
        onTransferComplete?.(res.origen.litrosActuales, res.destino.litrosActuales, res.origen.cuentalitros);
        setSuccess(
          `Folio #${res.folio} · ${litros.toLocaleString()} L transferidos → NISSAN. ` +
          `Taller: ${res.origen.litrosActuales.toFixed(0)} L | ` +
          `NISSAN: ${res.destino.litrosActuales.toFixed(0)} L`
        );
        setForm({ fecha: todayStr(), litros: "", notas: "", folio: "", cuentaLtInicio: "", cuentaLtFin: "" });
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
            <DialogTitle>Cargar NISSAN desde Taller</DialogTitle>
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
              {/* Folio del ticket físico */}
              <div className="space-y-1.5">
                <Label htmlFor="t-folio">Folio del ticket *</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: "var(--fg-muted)" }} />
                  <Input
                    id="t-folio"
                    name="folio"
                    type="number"
                    step="1"
                    min="1"
                    max={99999}
                    value={form.folio}
                    onChange={handleChange}
                    placeholder="00000"
                    className="font-mono font-bold text-xl h-12 pl-9"
                    autoFocus
                    required
                  />
                </div>
                <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                  Número del ticket físico (máx. 5 dígitos)
                </p>
              </div>

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
                  />
                </div>
              </div>

              {/* Cuentalitros Taller */}
              <div className="rounded-xl border p-3 space-y-3"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                  Cuentalitros Taller (bomba)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="t-cuentaLtInicio">
                      Inicio
                      {cuentalitrosTaller != null && cuentalitrosTaller > 0 && (
                        <span className="ml-1 font-normal text-[10px]" style={{ color: "var(--fg-muted)" }}>
                          (actual: {cuentalitrosTaller.toLocaleString()})
                        </span>
                      )}
                    </Label>
                    <Input
                      id="t-cuentaLtInicio"
                      name="cuentaLtInicio"
                      type="number"
                      step="1"
                      min="0"
                      value={form.cuentaLtInicio}
                      onChange={handleChange}
                      placeholder={cuentalitrosTaller != null ? String(cuentalitrosTaller) : "0"}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="t-cuentaLtFin">Fin</Label>
                    <Input
                      id="t-cuentaLtFin"
                      name="cuentaLtFin"
                      type="number"
                      step="1"
                      value={cuentaLtFin}
                      readOnly
                      placeholder="Auto-calculado"
                      className="font-mono"
                      style={{ backgroundColor: "var(--surface)" }}
                    />
                    <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Inicio + litros</p>
                  </div>
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
