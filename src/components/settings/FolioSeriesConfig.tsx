"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFolioSerie,
  setFolioSerieActiva,
  setFolioSeriePredeterminada,
} from "@/app/actions/folios";
import type { FolioSerieOrigen } from "@/lib/folios";

type Serie = {
  id: number;
  origen: FolioSerieOrigen;
  codigo: string;
  nombre: string;
  folioMin: number;
  folioMax: number;
  folioDigitos: number;
  activa: boolean;
  predeterminada: boolean;
};

function formatRange(serie: Serie) {
  const format = (value: number, fallback: string) => value === 0
    ? fallback
    : String(value).padStart(serie.folioDigitos, "0");
  return `${format(serie.folioMin, "sin mínimo")} – ${format(serie.folioMax, "sin máximo")}`;
}

export default function FolioSeriesConfig({ series }: { series: Serie[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [min, setMin] = useState("0");
  const [max, setMax] = useState("0");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const sharedSeries = series.filter((serie) => serie.origen === "compartida");
  const historicSeries = series.filter((serie) => serie.origen !== "compartida");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await createFolioSerie({
          codigo,
          nombre,
          folioMin: min,
          folioMax: max,
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

  function update(action: () => Promise<unknown>, fallback: string) {
    setError("");
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : fallback);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Serie compartida</h3>
        <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
          Patio, Campo y transferencias usan la misma serie activa. Cada origen sugiere su propio consecutivo, pero no se puede repetir un folio dentro de la misma serie. Escribe el mínimo con ceros iniciales para conservar su ancho, por ejemplo 00001–99999; el folio completo se forma como A00001. Con 0–0 no se agregan ceros y empieza en 1.
        </p>
      </div>

      <div className="space-y-2">
        {sharedSeries.map((serie) => (
          <div key={serie.id} className="rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>
                {serie.codigo} · {serie.nombre}
                {serie.predeterminada && <span className="ml-2 text-xs text-indigo-500">En uso</span>}
                {!serie.activa && <span className="ml-2 text-xs" style={{ color: "var(--fg-muted)" }}>Inactiva</span>}
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--fg-muted)" }}>Rango: {formatRange(serie)}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {serie.activa && !serie.predeterminada && (
                <button type="button" onClick={() => update(() => setFolioSeriePredeterminada(serie.id), "No se pudo cambiar la serie en uso")}
                  disabled={pending} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
                  Usar esta serie
                </button>
              )}
              {!serie.predeterminada && (
                <button type="button" onClick={() => update(() => setFolioSerieActiva(serie.id, !serie.activa), "No se pudo actualizar la serie")}
                  disabled={pending} className="rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
                  style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
                  {serie.activa ? "Desactivar" : "Activar"}
                </button>
              )}
            </div>
          </div>
        ))}
        {sharedSeries.length === 0 && <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Aún no hay series compartidas.</p>}
      </div>

      <form onSubmit={handleCreate} className="rounded-xl border p-4 space-y-3"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Agregar serie</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="space-y-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Serie (mínimo 1 carácter)
            <input value={codigo} onChange={(e) => setCodigo(e.target.value)} required maxLength={20}
              placeholder="A, AA, 2026-" className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </label>
          <label className="space-y-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Nombre del bloque
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={80}
              placeholder="Bloque físico actual" className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </label>
          <label className="space-y-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Folio mínimo (0 = sin límite)
            <input type="text" inputMode="numeric" pattern="[0-9]{1,5}" maxLength={5} value={min} onChange={(e) => setMin(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </label>
          <label className="space-y-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Folio máximo (0 = sin límite)
            <input type="text" inputMode="numeric" pattern="[0-9]{1,5}" maxLength={5} value={max} onChange={(e) => setMax(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50">
            {pending ? "Guardando…" : "Crear y usar"}
          </button>
          {saved && <span className="text-xs text-emerald-600">Serie creada y compartida con Patio y Campo.</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      </form>

      {historicSeries.length > 0 && (
        <div className="border-t pt-5 space-y-2" style={{ borderColor: "var(--border)" }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Series históricas</h3>
            <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
              Se conservan para identificar los registros anteriores y no aparecen al capturar nuevas cargas.
            </p>
          </div>
          {historicSeries.map((serie) => (
            <div key={serie.id} className="rounded-xl border p-3"
              style={{ backgroundColor: "var(--bg)", borderColor: "var(--border)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                {serie.codigo} · {serie.nombre}
                <span className="ml-2 text-xs font-normal" style={{ color: "var(--fg-muted)" }}>
                  {serie.origen === "campo" ? "Campo" : "Patio y transferencias"}
                </span>
              </p>
              <p className="text-xs mt-1 font-mono" style={{ color: "var(--fg-muted)" }}>Rango: {formatRange(serie)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
