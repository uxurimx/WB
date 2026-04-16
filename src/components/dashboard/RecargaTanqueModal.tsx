"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { addRecargaTanque } from "@/app/actions/tanques";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function RecargaTanqueModal({
  tanqueId,
  cuentalitrosActual = 0,
}: {
  tanqueId: number;
  cuentalitrosActual?: number;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    fecha:              todayStr(),
    litros:             "",
    cuentalitrosInicio: "",  // A2: lectura ANTES de que llegue la pipa
    cuentalitrosNuevo:  "",  // lectura DESPUÉS de la descarga
    proveedor:          "",
    folioFactura:       "",
    precioLitro:        "",
    notas:              "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleOpen() {
    setForm((prev) => ({
      ...prev,
      fecha: todayStr(),
      // Pre-llenar con el último valor del cuentalitros almacenado
      cuentalitrosNuevo: cuentalitrosActual > 0 ? String(cuentalitrosActual) : "",
    }));
    setError("");
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const litros = parseFloat(form.litros);
    if (!litros || litros <= 0) {
      setError("Ingresa los litros recibidos");
      return;
    }
    setError("");

    startTransition(async () => {
      try {
        await addRecargaTanque({
          tanqueId,
          fecha:              form.fecha,
          litros,
          cuentalitrosInicio: form.cuentalitrosInicio ? parseFloat(form.cuentalitrosInicio) : undefined,
          cuentalitrosNuevo:  form.cuentalitrosNuevo  ? parseFloat(form.cuentalitrosNuevo)  : undefined,
          proveedor:          form.proveedor    || undefined,
          folioFactura:       form.folioFactura || undefined,
          precioLitro:        form.precioLitro  ? parseFloat(form.precioLitro) : undefined,
          notas:              form.notas        || undefined,
        });
        setOpen(false);
        setForm({
          fecha:              todayStr(),
          litros:             "",
          cuentalitrosInicio: "",
          cuentalitrosNuevo:  "",
          proveedor:          "",
          folioFactura:       "",
          precioLitro:        "",
          notas:              "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
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
        <Plus className="w-3.5 h-3.5" /> Recargar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recarga Tanque Taller</DialogTitle>
            <DialogDescription>
              Registra el diesel recibido. El stock se actualizará de
              inmediato.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="r-fecha">Fecha</Label>
                <Input
                  id="r-fecha"
                  name="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-litros">Litros recibidos *</Label>
                <Input
                  id="r-litros"
                  name="litros"
                  type="number"
                  step="1"
                  min="1"
                  value={form.litros}
                  onChange={handleChange}
                  placeholder="5000"
                  className="font-mono font-bold text-lg"
                />
              </div>
            </div>

            {/* A2: Cuentalitros ANTES — punto ancla del proveedor */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="r-cuentalitros-inicio">
                  Cuentalitros al llegar
                  <span className="font-normal opacity-60 ml-1 text-[10px]">(antes de descargar)</span>
                </Label>
                <Input
                  id="r-cuentalitros-inicio"
                  name="cuentalitrosInicio"
                  type="number"
                  step="1"
                  value={form.cuentalitrosInicio}
                  onChange={handleChange}
                  placeholder={String(cuentalitrosActual)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-cuentalitros">
                  Cuentalitros al terminar
                  <span className="font-normal opacity-60 ml-1 text-[10px]">(tras descarga)</span>
                </Label>
                <Input
                  id="r-cuentalitros"
                  name="cuentalitrosNuevo"
                  type="number"
                  step="1"
                  value={form.cuentalitrosNuevo}
                  onChange={handleChange}
                  placeholder={form.cuentalitrosInicio ? String(parseFloat(form.cuentalitrosInicio || "0") + parseFloat(form.litros || "0")) : ""}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="r-proveedor">
                  Proveedor{" "}
                  <span className="font-normal opacity-60">(opc.)</span>
                </Label>
                <Input
                  id="r-proveedor"
                  name="proveedor"
                  value={form.proveedor}
                  onChange={handleChange}
                  placeholder="PEMEX"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-precio">
                  $/L{" "}
                  <span className="font-normal opacity-60">(opc.)</span>
                </Label>
                <Input
                  id="r-precio"
                  name="precioLitro"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precioLitro}
                  onChange={handleChange}
                  placeholder="24.50"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-folio">
                Folio factura{" "}
                <span className="font-normal opacity-60">(opc.)</span>
              </Label>
              <Input
                id="r-folio"
                name="folioFactura"
                value={form.folioFactura}
                onChange={handleChange}
                placeholder="FAC-001234"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Guardando..." : "Registrar recarga"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
