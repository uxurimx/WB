"use client";

import { useState, useTransition } from "react";
import { CheckCircle, Fuel, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCargaCampo } from "@/app/actions/cargas";

type Unidad = { id: number; codigo: string; nombre: string | null; tipo: string };
type Operador = { id: number; nombre: string };
type Obra = { id: number; nombre: string };

function getNow() {
  const now = new Date();
  return {
    fecha: now.toISOString().split("T")[0],
    hora: now.toTimeString().slice(0, 5),
  };
}

export default function FormCargaCampo({
  unidades,
  operadores,
  obras,
  saldoNissan,
}: {
  unidades: Unidad[];
  operadores: Operador[];
  obras: Obra[];
  saldoNissan: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<{ litros: number; unidad: string } | null>(null);
  const [error, setError] = useState("");

  const { fecha: fechaInit, hora: horaInit } = getNow();

  const [form, setForm] = useState({
    fecha: fechaInit,
    hora: horaInit,
    folioNissan: "",
    unidadId: "",
    litros: "",
    odometroHrs: "",
    obraId: "",
    operadorId: "",
    tipoDiesel: "normal",
    notas: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.folioNissan) { setError("El folio NISSAN es requerido"); return; }
    if (!form.unidadId) { setError("Selecciona una unidad"); return; }
    if (!form.litros || parseFloat(form.litros) <= 0) { setError("Ingresa los litros"); return; }

    const unidadSel = unidades.find(u => u.id === parseInt(form.unidadId));

    startTransition(async () => {
      try {
        await createCargaCampo({
          fecha: form.fecha,
          hora: form.hora,
          folioNissan: parseInt(form.folioNissan),
          unidadId: parseInt(form.unidadId),
          litros: parseFloat(form.litros),
          odometroHrs: form.odometroHrs ? parseFloat(form.odometroHrs) : undefined,
          obraId: form.obraId ? parseInt(form.obraId) : undefined,
          operadorId: form.operadorId ? parseInt(form.operadorId) : undefined,
          tipoDiesel: form.tipoDiesel,
          notas: form.notas || undefined,
        });

        setSuccess({ litros: parseFloat(form.litros), unidad: unidadSel?.codigo ?? "" });
        const { fecha, hora } = getNow();
        setForm((prev) => ({
          ...prev,
          fecha,
          hora,
          unidadId: "",
          litros: "",
          odometroHrs: "",
          notas: "",
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const litrosNum = parseFloat(form.litros) || 0;
  const saldoDespues = saldoNissan - litrosNum;

  return (
    <div className="max-w-lg w-full mx-auto">
      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border mb-6 animate-fade-in"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              Carga registrada — {success.unidad}
            </p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              {success.litros} L en campo
            </p>
          </div>
          <button onClick={() => setSuccess(null)}
            className="ml-auto text-xs px-2 py-1 rounded-lg hover:bg-[var(--surface-2)]"
            style={{ color: "var(--fg-muted)" }}>
            ×
          </button>
        </div>
      )}

      {/* Saldo NISSAN */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-6"
        style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
        <Fuel className="w-5 h-5 text-violet-500 shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
            Saldo NISSAN
          </p>
          <p className="font-mono font-bold text-xl" style={{ color: "var(--fg)" }}>
            {saldoNissan > 0 ? `${saldoNissan.toLocaleString()} L` : "Sin datos"}
          </p>
        </div>
        {litrosNum > 0 && (
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Después</p>
            <p className={`font-mono font-bold text-lg ${saldoDespues < 100 ? "text-red-500" : "text-emerald-500"}`}>
              {saldoDespues.toLocaleString()} L
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Folio NISSAN */}
        <div className="space-y-1.5">
          <Label htmlFor="folioNissan">Folio NISSAN *</Label>
          <Input id="folioNissan" name="folioNissan" type="number"
            value={form.folioNissan} onChange={handleChange}
            placeholder="11773" className="font-mono text-lg h-12" />
          <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
            Número del ticket físico de la NISSAN
          </p>
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
              .filter((u) => u.tipo === "camion")
              .map((u) => (
                <option key={u.id} value={u.id}>{u.codigo}</option>
              ))}
            <optgroup label="Maquinaria">
              {unidades
                .filter((u) => u.tipo === "maquina" || u.tipo === "otro")
                .map((u) => (
                  <option key={u.id} value={u.id}>{u.codigo} — {u.nombre}</option>
                ))}
            </optgroup>
          </Select>
        </div>

        {/* Litros */}
        <div className="space-y-1.5">
          <Label htmlFor="litros">Litros *</Label>
          <div className="relative">
            <Input id="litros" name="litros" type="number" step="0.5" min="1"
              value={form.litros} onChange={handleChange}
              placeholder="0"
              className="text-3xl font-bold font-mono h-16 pr-12 text-right" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: "var(--fg-muted)" }}>L</span>
          </div>
        </div>

        {/* HRS/KM */}
        <div className="space-y-1.5">
          <Label htmlFor="odometroHrs">Odómetro / Horas *</Label>
          <Input id="odometroHrs" name="odometroHrs" type="number" step="1"
            value={form.odometroHrs} onChange={handleChange}
            placeholder="29982" className="font-mono" />
        </div>

        {/* Obra y Operador */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="obraId">Obra</Label>
            <Select id="obraId" name="obraId" value={form.obraId} onChange={handleChange}>
              <option value="">— Sin obra —</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="operadorId">Operador</Label>
            <Select id="operadorId" name="operadorId" value={form.operadorId} onChange={handleChange}>
              <option value="">— Ninguno —</option>
              {operadores.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Tipo diesel */}
        <div className="space-y-1.5">
          <Label htmlFor="tipoDiesel">Origen del diesel</Label>
          <Select id="tipoDiesel" name="tipoDiesel" value={form.tipoDiesel} onChange={handleChange}>
            <option value="normal">Taller (normal)</option>
            <option value="amigo">Amigo (verde)</option>
            <option value="oxxogas">OxxoGas (rojo)</option>
          </Select>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas</Label>
          <Textarea id="notas" name="notas" value={form.notas} onChange={handleChange}
            placeholder="Observaciones..." rows={2} />
        </div>

        {error && (
          <p className="text-sm flex items-center gap-1.5 text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" size="xl" className="w-full" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar Carga en Campo"}
        </Button>
      </form>
    </div>
  );
}
