"use client";

import { Fuel, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
      style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
    >
      <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
        <Fuel className="w-10 h-10 text-indigo-500" />
      </div>

      <h1 className="font-outfit font-bold text-3xl mb-2">Sin conexión</h1>
      <p className="text-sm mb-1" style={{ color: "var(--fg-muted)" }}>
        WB Diesel Control requiere conexión a internet.
      </p>
      <p className="text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
        Verifica tu red y vuelve a intentarlo.
      </p>

      <div
        className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm"
        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
      >
        <WifiOff className="w-4 h-4" />
        Sin conexión
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-4 text-sm font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
      >
        Reintentar →
      </button>
    </div>
  );
}
