"use client";

import { useState, useTransition } from "react";
import { setAlertaDias } from "@/app/actions/setup";

export default function AlertasConfig({ initialDias }: { initialDias: number }) {
  const [dias, setDias]     = useState(initialDias);
  const [saved, setSaved]   = useState(false);
  const [pending, startTx]  = useTransition();

  function handleSave() {
    startTx(async () => {
      await setAlertaDias(dias);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={1}
        max={90}
        value={dias}
        onChange={(e) => setDias(Number(e.target.value))}
        className="w-20 px-3 py-1.5 text-sm rounded-lg border outline-none focus:ring-2 focus:ring-amber-500/40"
        style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
      />
      <span className="text-sm" style={{ color: "var(--fg-muted)" }}>días</span>
      <button
        onClick={handleSave}
        disabled={pending}
        className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60 transition-colors"
      >
        {saved ? "Guardado" : pending ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}
