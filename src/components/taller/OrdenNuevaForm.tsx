"use client";

import { useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { crearOrdenTaller } from "@/app/actions/taller";
import { getNowLocal } from "@/lib/date-utils";

type Unidad = {
  id: number;
  codigo: string;
  tipo: string;
  odometroActual: number | null;
  odometroOffset: number | null;
  operadorDefaultId: number | null;
};
type Operador = { id: number; nombre: string };

export default function OrdenNuevaForm({
  unidades,
  operadores,
  initialUnidadId = "",
  initialPreventivo = null,
  onCreated,
  onCancel,
}: {
  unidades: Unidad[];
  operadores: Operador[];
  initialUnidadId?: string;
  initialPreventivo?: "km" | "hrs" | null;
  onCreated: (id: number) => void;
  onCancel?: () => void;
}) {
  const seed = unidades.find((u) => String(u.id) === initialUnidadId);
  const now = getNowLocal();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [unidadId, setUnidadId] = useState(initialUnidadId);
  const [operadorId, setOperadorId] = useState(seed?.operadorDefaultId ? String(seed.operadorDefaultId) : "");
  const [fecha, setFecha] = useState(now.fecha);
  const [kmHrs, setKmHrs] = useState(() => {
    if (!seed) return "";
    const acum = (seed.odometroActual ?? 0) + (seed.odometroOffset ?? 0);
    return acum > 0 ? String(Math.round(acum)) : "";
  });
  const [motivo, setMotivo] = useState(initialPreventivo ? `Servicio programado (${initialPreventivo})` : "");
  const [quienRecibio, setQuienRecibio] = useState("");

  const unidad = useMemo(() => unidades.find((u) => String(u.id) === unidadId), [unidades, unidadId]);

  function onUnidad(id: string) {
    setUnidadId(id);
    const u = unidades.find((x) => String(x.id) === id);
    if (!u) return;
    const acum = (u.odometroActual ?? 0) + (u.odometroOffset ?? 0);
    setKmHrs(acum > 0 ? String(Math.round(acum)) : "");
    if (u.operadorDefaultId) setOperadorId(String(u.operadorDefaultId));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!unidadId) {
      setError("Elige la unidad.");
      return;
    }
    start(async () => {
      try {
        const res = await crearOrdenTaller({
          unidadId: Number(unidadId),
          operadorId: operadorId ? Number(operadorId) : null,
          fecha,
          kmHrs: kmHrs ? Number(kmHrs) : null,
          motivo: motivo || (initialPreventivo ? `Servicio programado (${initialPreventivo})` : ""),
          quienRecibio,
          esPreventivo: Boolean(initialPreventivo),
          tipoControlPreventivo: initialPreventivo,
        });
        onCreated(res.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo abrir la orden.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="unidad">Unidad</Label>
        <Select id="unidad" value={unidadId} onChange={(e) => onUnidad(e.target.value)} required>
          <option value="">Elegir económico…</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>{u.codigo}</option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="fecha">Fecha</Label>
          <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="km">Km / hrs</Label>
          <Input id="km" type="number" inputMode="decimal" value={kmHrs} onChange={(e) => setKmHrs(e.target.value)} />
          {unidad && (
            <p className="text-[11px] mt-1" style={{ color: "var(--fg-muted)" }}>
              Se sugiere el acumulado de la unidad
            </p>
          )}
        </div>
      </div>
      <div>
        <Label htmlFor="op">Operador que la trajo</Label>
        <Select id="op" value={operadorId} onChange={(e) => setOperadorId(e.target.value)}>
          <option value="">—</option>
          {operadores.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="motivo">¿Por qué entra?</Label>
        <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Balatas, booster, falla…" />
      </div>
      <div>
        <Label htmlFor="recibio">Quién recibe en taller</Label>
        <Input id="recibio" value={quienRecibio} onChange={(e) => setQuienRecibio(e.target.value)} placeholder="Tu nombre" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: "var(--border)" }}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={pending} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white disabled:opacity-50">
          {pending ? "Guardando…" : "Crear orden"}
        </button>
      </div>
    </form>
  );
}
