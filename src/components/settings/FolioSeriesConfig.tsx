"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFolioSerie,
  setFolioSerieActiva,
  setFolioSeriePredeterminada,
} from "@/app/actions/folios";
import type { FolioOrigen } from "@/lib/folios";

type Serie = {
  id: number;
  origen: FolioOrigen;
  codigo: string;
  nombre: string;
  folioMin: number;
  folioMax: number;
  activa: boolean;
  predeterminada: boolean;
};

function SeriesOrigenPanel({ origen, label, rows }: { origen: FolioOrigen; label: string; rows: Serie[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("0");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await createFolioSerie({
          origen,
          codigo,
          nombre,
          folioMin: Number(min),
          folioMax: Number(max),
        });
        setCodigo("");
        setNombre("");
        setMin("0");
        setMax("0");
        setSaved(true);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo crear la serie");
      }
    });
  }

  function activate(id: number) {
    setError("");
    startTransition(async () => {
      try {
        await setFolioSeriePredeterminada(id);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo activar la serie");
      }
    });
  }

  function toggleActive(serie: Serie) {
    setError("");
    startTransition(async () => {
      try {
        await setFolioSerieActiva(serie.id, !serie.activa);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo actualizar la serie");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{label}</h3>
        <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
          La serie predeterminada se asigna automáticamente. Las series activas también aparecen para elegir al capturar.
        </p>
      </div>

      <div className="space-y-2">
        {rows.map((serie) => (
          <div key={serie.id} className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>
                {serie.codigo} · {serie.nombre}
                {serie.predeterminada && <span className="ml-2 text-xs text-indigo-500">Predeterminada</span>}
                {!serie.activa && <span className="ml-2 text-xs" style={{ color: "var(--fg-muted)" }}>Inactiva</span>}
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--fg-muted)" }}>
                Rango: {serie.folioMin || "sin mínimo"} – {serie.folioMax || "sin máximo"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {serie.activa && !serie.predeterminada && (
                <button type="button" onClick={() => activate(serie.id)} disabled={pending}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-indigo-500/10 disabled:opacity-50"
                  style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
                  Usar por defecto
                </button>
              )}
              {!serie.predeterminada && (
                <button type="button" onClick={() => toggleActive(serie)} disabled={pending}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-[var(--surface-2)] disabled:opacity-50"
                  style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
                  {serie.activa ? "Desactivar" : "Activar"}
                </button>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm" style={{ color: "var(--fg-muted)" }}>No hay series configuradas.</p>}
      </div>

      <form onSubmit={handleCreate} className="rounded-xl border p-4 space-y-3"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Agregar bloque físico</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Código corto (se imprime en el ticket)
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} required maxLength={20}
              placeholder="2026-B" className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </label>
          <label className="space-y-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Nombre del bloque
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={80}
              placeholder="Bloque mayo 2026" className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </label>
          <label className="space-y-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Folio mínimo (0 = sin límite)
            <input type="number" min={0} max={99999} value={min} onChange={(e) => setMin(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </label>
          <label className="space-y-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Folio máximo (0 = sin límite)
            <input type="number" min={0} max={99999} value={max} onChange={(e) => setMax(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50">
            {pending ? "Guardando…" : "Crear y usar"}
          </button>
          {saved && <span className="text-xs text-emerald-600">Serie creada y predeterminada.</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </form>
    </div>
  );
}

export default function FolioSeriesConfig({ series }: { series: Serie[] }) {
  return (
    <div className="space-y-6">
      <SeriesOrigenPanel origen="patio" label="Patio y transferencias" rows={series.filter((serie) => serie.origen === "patio")} />
      <div className="border-t" style={{ borderColor: "var(--border)" }} />
      <SeriesOrigenPanel origen="campo" label="Campo (NISSAN)" rows={series.filter((serie) => serie.origen === "campo")} />
    </div>
  );
}
