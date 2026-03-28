"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Fuel, Clock, Hash, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createCargaPatio } from "@/app/actions/cargas";
import { cn } from "@/lib/utils";

type Unidad = { id: number; codigo: string; nombre: string | null; tipo: string };
type Operador = { id: number; nombre: string; tipo: string };

function getNow() {
  const now = new Date();
  const fecha = now.toISOString().split("T")[0];
  const hora = now.toTimeString().slice(0, 5);
  return { fecha, hora };
}

export default function FormCargaPatio({
  unidades,
  operadores,
  siguienteFolio,
  stockActual,
  ultimaCuentaLt,
}: {
  unidades: Unidad[];
  operadores: Operador[];
  siguienteFolio: number;
  stockActual: number;
  ultimaCuentaLt?: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<{ folio: number; litros: number } | null>(null);
  const [error, setError] = useState("");

  const { fecha: fechaInit, hora: horaInit } = getNow();

  const [form, setForm] = useState({
    fecha: fechaInit,
    hora: horaInit,
    unidadId: "",
    litros: "",
    odometroHrs: "",
    cuentaLtInicio: ultimaCuentaLt != null ? String(ultimaCuentaLt) : "",
    cuentaLtFin: "",
    operadorId: "",
    tipoDiesel: "normal",
    notas: "",
  });

  // Auto-calcular cuenta LT fin cuando cambian litros o inicio
  useEffect(() => {
    const inicio = parseFloat(form.cuentaLtInicio);
    const litros = parseFloat(form.litros);
    if (!isNaN(inicio) && !isNaN(litros) && litros > 0) {
      setForm((prev) => ({ ...prev, cuentaLtFin: String(inicio + litros) }));
    }
  }, [form.cuentaLtInicio, form.litros]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.unidadId) { setError("Selecciona una unidad"); return; }
    if (!form.litros || parseFloat(form.litros) <= 0) { setError("Ingresa los litros"); return; }

    const litros = parseFloat(form.litros);

    startTransition(async () => {
      try {
        const result = await createCargaPatio({
          fecha: form.fecha,
          hora: form.hora,
          unidadId: parseInt(form.unidadId),
          litros,
          odometroHrs: form.odometroHrs ? parseFloat(form.odometroHrs) : undefined,
          cuentaLtInicio: form.cuentaLtInicio ? parseFloat(form.cuentaLtInicio) : undefined,
          cuentaLtFin: form.cuentaLtFin ? parseFloat(form.cuentaLtFin) : undefined,
          operadorId: form.operadorId ? parseInt(form.operadorId) : undefined,
          tipoDiesel: form.tipoDiesel,
          notas: form.notas || undefined,
        });

        setSuccess({ folio: result.folio, litros });
        // Reset para siguiente carga — cuentaLtInicio toma el fin de la carga que se acaba de registrar
        const nextCuentaLt = form.cuentaLtFin;
        const { fecha, hora } = getNow();
        setForm((prev) => ({
          ...prev,
          fecha,
          hora,
          unidadId: "",
          litros: "",
          odometroHrs: "",
          cuentaLtInicio: nextCuentaLt,
          cuentaLtFin: "",
          notas: "",
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const litrosNum = parseFloat(form.litros) || 0;
  const stockDespues = stockActual - litrosNum;

  return (
    <div className="max-w-lg w-full mx-auto">
      {/* Success toast */}
      {success && (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl border mb-6 animate-fade-in"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              Carga registrada — Folio {success.folio}
            </p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              {success.litros} L despachados correctamente
            </p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-xs px-2 py-1 rounded-lg hover:bg-[var(--surface-2)]"
            style={{ color: "var(--fg-muted)" }}
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Folio y hora — info automática */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <Hash className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                Folio
              </p>
              <p className="font-mono font-bold text-lg" style={{ color: "var(--fg)" }}>
                {siguienteFolio}
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
          >
            <Fuel className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                Stock Taller
              </p>
              <p className={cn("font-mono font-bold text-lg", stockDespues < 500 ? "text-red-500" : "text-emerald-500")}>
                {stockActual > 0 ? `${stockActual.toLocaleString()} L` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Fecha y hora */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" name="fecha" type="date" value={form.fecha} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hora">Hora</Label>
            <Input id="hora" name="hora" type="time" value={form.hora} onChange={handleChange} />
          </div>
        </div>

        {/* Unidad */}
        <div className="space-y-1.5">
          <Label htmlFor="unidadId">Unidad *</Label>
          <Select id="unidadId" name="unidadId" value={form.unidadId} onChange={handleChange}
            className="text-base h-12">
            <option value="">— Seleccionar unidad —</option>
            {unidades
              .filter((u) => u.tipo === "camion" || u.tipo === "nissan")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.codigo}{u.nombre && u.nombre !== u.codigo ? ` — ${u.nombre}` : ""}
                </option>
              ))}
            <optgroup label="Maquinaria">
              {unidades
                .filter((u) => u.tipo === "maquina" || u.tipo === "otro")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.codigo}{u.nombre && u.nombre !== u.codigo ? ` — ${u.nombre}` : ""}
                  </option>
                ))}
            </optgroup>
          </Select>
        </div>

        {/* Litros — campo principal, grande */}
        <div className="space-y-1.5">
          <Label htmlFor="litros">Litros *</Label>
          <div className="relative">
            <Input
              id="litros" name="litros" type="number" step="0.5" min="1"
              value={form.litros} onChange={handleChange}
              placeholder="0"
              className="text-3xl font-bold font-mono h-16 pr-12 text-right"
              style={{ color: "var(--fg)" }}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: "var(--fg-muted)" }}>
              L
            </span>
          </div>
          {litrosNum > 0 && stockDespues >= 0 && (
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Stock después: <span className={cn("font-semibold font-mono", stockDespues < 500 ? "text-amber-500" : "text-emerald-500")}>
                {stockDespues.toLocaleString()} L
              </span>
            </p>
          )}
          {litrosNum > 0 && stockDespues < 0 && (
            <p className="text-xs flex items-center gap-1 text-red-500">
              <AlertCircle className="w-3 h-3" /> Supera el stock disponible
            </p>
          )}
        </div>

        {/* Odómetro */}
        <div className="space-y-1.5">
          <Label htmlFor="odometroHrs">Odómetro / Horas</Label>
          <Input id="odometroHrs" name="odometroHrs" type="number" step="1"
            value={form.odometroHrs} onChange={handleChange} placeholder="476767" />
        </div>

        {/* Cuentalitros */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cuentaLtInicio">
              Cuenta LT Inicio
              {ultimaCuentaLt != null && (
                <span className="ml-1.5 font-normal text-xs" style={{ color: "var(--fg-muted)" }}>
                  (anterior: {ultimaCuentaLt.toLocaleString()})
                </span>
              )}
            </Label>
            <Input id="cuentaLtInicio" name="cuentaLtInicio" type="number" step="1"
              value={form.cuentaLtInicio} onChange={handleChange} placeholder="2460100" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cuentaLtFin">Cuenta LT Fin</Label>
            <Input id="cuentaLtFin" name="cuentaLtFin" type="number" step="1"
              value={form.cuentaLtFin} onChange={handleChange} placeholder="2460200" className="font-mono" />
            <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Auto-calculado</p>
          </div>
        </div>

        {/* Operador y tipo diesel */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="operadorId">Operador</Label>
            <Select id="operadorId" name="operadorId" value={form.operadorId} onChange={handleChange}>
              <option value="">— Ninguno —</option>
              {operadores.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tipoDiesel">Tipo Diesel</Label>
            <Select id="tipoDiesel" name="tipoDiesel" value={form.tipoDiesel} onChange={handleChange}>
              <option value="normal">Normal</option>
              <option value="amigo">Amigo (Verde)</option>
              <option value="oxxogas">OxxoGas (Rojo)</option>
            </Select>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas</Label>
          <Textarea id="notas" name="notas" value={form.notas} onChange={handleChange}
            placeholder="Observaciones opcionales..." rows={2} />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm flex items-center gap-1.5 text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}

        {/* Submit */}
        <Button type="submit" size="xl" className="w-full" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar Carga"}
        </Button>
      </form>
    </div>
  );
}
