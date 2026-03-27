"use client";

import { useState, useTransition } from "react";
import { Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cerrarPeriodo } from "@/app/actions/rendimientos";

type Props = {
  periodoId: number;
  periodoNombre: string;
  totalCargas: number;
};

type Result = { rendimientosCreados: number };

export default function CerrarPeriodoModal({
  periodoId,
  periodoNombre,
  totalCargas,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  function handleConfirm() {
    setError("");
    startTransition(async () => {
      try {
        const res = await cerrarPeriodo(periodoId);
        setResult({ rendimientosCreados: res.rendimientosCreados });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cerrar");
      }
    });
  }

  function handleClose() {
    setOpen(false);
    if (result) {
      router.refresh();
      setResult(null);
    }
    setError("");
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Lock className="w-3.5 h-3.5" /> Cerrar período
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          {!result ? (
            <>
              <DialogHeader>
                <DialogTitle>Cerrar período</DialogTitle>
                <DialogDescription>
                  {periodoNombre}
                </DialogDescription>
              </DialogHeader>

              <div
                className="flex items-start gap-3 p-4 rounded-xl border"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm" style={{ color: "var(--fg)" }}>
                  <p className="font-semibold mb-1">Esta acción es permanente.</p>
                  <p style={{ color: "var(--fg-muted)" }}>
                    Se calcularán los rendimientos de {totalCargas} carga
                    {totalCargas !== 1 ? "s" : ""} y el período no podrá
                    reabrirse.
                  </p>
                </div>
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
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirm}
                  disabled={isPending}
                >
                  {isPending ? "Calculando..." : "Confirmar cierre"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Período cerrado</DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-3 py-4">
                <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>
                    ¡Listo! Rendimientos calculados.
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>
                    {result.rendimientosCreados} unidad
                    {result.rendimientosCreados !== 1 ? "es" : ""} procesada
                    {result.rendimientosCreados !== 1 ? "s" : ""}.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" size="sm" onClick={handleClose}>
                  Ver rendimientos
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
