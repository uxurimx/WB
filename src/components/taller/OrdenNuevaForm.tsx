"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CHECKLIST_PUNTOS } from "@/lib/taller-checklist";
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
}: {
  unidades: Unidad[];
  operadores: Operador[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const now = getNowLocal();
  const [unidadId, setUnidadId] = useState("");
  const [operadorId, setOperadorId] = useState("");
  const [fecha, setFecha] = useState(now.fecha);
  const [kmHrs, setKmHrs] = useState("");
  const [motivo, setMotivo] = useState("");
  const [quienRecibio, setQuienRecibio] = useState("");
  const [checks, setChecks] = useState<Record<string, { ok: boolean | null; nota: string }>>(
    () => Object.fromEntries(CHECKLIST_PUNTOS.map((p) => [p.clave, { ok: null, nota: "" }])),
  );

  const unidad = useMemo(
    () => unidades.find((u) => String(u.id) === unidadId),
    [unidades, unidadId],
  );

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
          motivo,
          quienRecibio,
          checklist: CHECKLIST_PUNTOS.map((p) => ({
            clave: p.clave,
            ok: checks[p.clave].ok,
            nota: checks[p.clave].nota || null,
          })),
        });
        router.push(`/taller/${res.id}`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo abrir la orden.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="unidad">Unidad</Label>
            <Select id="unidad" value={unidadId} onChange={(e) => onUnidad(e.target.value)} required>
              <option value="">Elegir económico…</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.codigo}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="km">Km / hrs (acumulado)</Label>
            <Input id="km" type="number" value={kmHrs} onChange={(e) => setKmHrs(e.target.value)} placeholder="Se llena al elegir unidad" />
            {unidad && (
              <p className="text-[11px] mt-1" style={{ color: "var(--fg-muted)" }}>
                Hub {unidad.odometroActual ?? "—"} · offset {unidad.odometroOffset ?? 0}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="op">Operador</Label>
            <Select id="op" value={operadorId} onChange={(e) => setOperadorId(e.target.value)}>
              <option value="">—</option>
              {operadores.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="motivo">Motivo de la visita</Label>
          <Input id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. cambio de balatas 2 ejes, un booster" />
        </div>
        <div>
          <Label htmlFor="recibio">Quién recibió</Label>
          <Input id="recibio" value={quienRecibio} onChange={(e) => setQuienRecibio(e.target.value)} placeholder="Ayudante / nombre" />
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>Checklist de ingreso</p>
        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>SI = bien · NO = falla o falta</p>
        <ul className="space-y-2">
          {CHECKLIST_PUNTOS.map((p) => (
            <li key={p.clave} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b pb-2" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm flex-1">{p.label}</span>
              <div className="flex gap-1">
                {([true, false] as const).map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => setChecks((c) => ({ ...c, [p.clave]: { ...c[p.clave], ok: c[p.clave].ok === v ? null : v } }))}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                      checks[p.clave].ok === v
                        ? v ? "bg-emerald-600 text-white border-emerald-600" : "bg-red-600 text-white border-red-600"
                        : "hover:bg-[var(--surface-2)]"
                    }`}
                    style={checks[p.clave].ok !== v ? { borderColor: "var(--border)" } : undefined}
                  >
                    {v ? "SI" : "NO"}
                  </button>
                ))}
              </div>
              {p.clave === "neumaticos" && (
                <Input
                  className="sm:w-48"
                  placeholder="Posición 7,8,9,10 gastados"
                  value={checks[p.clave].nota}
                  onChange={(e) => setChecks((c) => ({ ...c, [p.clave]: { ...c[p.clave], nota: e.target.value } }))}
                />
              )}
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Abrir orden"}
      </button>
    </form>
  );
}
