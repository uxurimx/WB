"use client";

import { useState, useTransition } from "react";
import { setFolioRango } from "@/app/actions/setup";

type Props = {
  initialPatioMin: number;
  initialPatioMax: number;
  initialCampoMin: number;
  initialCampoMax: number;
};

function RangoRow({
  label,
  tipo,
  initialMin,
  initialMax,
}: {
  label: string;
  tipo: "patio" | "campo";
  initialMin: number;
  initialMax: number;
}) {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTx] = useTransition();

  function handleSave() {
    setError("");
    startTx(async () => {
      try {
        await setFolioRango(tipo, min, max);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold" style={{ color: "var(--fg)" }}>{label}</p>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Mín</span>
          <input
            type="number"
            min={0}
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="w-24 px-3 py-1.5 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
            style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Máx</span>
          <input
            type="number"
            min={0}
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="w-24 px-3 py-1.5 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500/40 font-mono"
            style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
          />
        </div>
        <button
          onClick={handleSave}
          disabled={pending}
          className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors"
        >
          {saved ? "Guardado" : pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
        0 = sin límite. El sistema rechazará folios fuera del rango al registrar.
      </p>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function FolioRangoConfig({ initialPatioMin, initialPatioMax, initialCampoMin, initialCampoMax }: Props) {
  return (
    <div className="space-y-5">
      <RangoRow label="Patio" tipo="patio" initialMin={initialPatioMin} initialMax={initialPatioMax} />
      <div className="border-t" style={{ borderColor: "var(--border)" }} />
      <RangoRow label="Campo (NISSAN)" tipo="campo" initialMin={initialCampoMin} initialMax={initialCampoMax} />
    </div>
  );
}
