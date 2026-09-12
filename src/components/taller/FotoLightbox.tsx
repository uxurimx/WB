"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";

export type TallerFoto = { url: string; key: string; alt?: string };

export default function FotoLightbox({ foto }: { foto: TallerFoto }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function show() {
    setZoom(1);
    setOpen(true);
  }

  return (
    <>
      <button type="button" onClick={show} className="relative block" aria-label="Ampliar foto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.url}
          alt={foto.alt ?? "Foto del checklist"}
          className="h-16 w-16 rounded-lg object-cover border"
          style={{ borderColor: "var(--border)" }}
        />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          onClick={() => setOpen(false)}
        >
          <div className="relative flex max-h-full max-w-full flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 self-end">
              <button type="button" onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="rounded-full bg-white/15 p-2 text-white" aria-label="Reducir zoom">
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-12 text-center text-xs font-semibold text-white">{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((z) => Math.min(3, z + 0.5))} className="rounded-full bg-white/15 p-2 text-white" aria-label="Aumentar zoom">
                <Plus className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full bg-white/15 p-2 text-white" aria-label="Cerrar foto">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[82vh] max-w-[92vw] overflow-auto rounded-xl bg-black/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={foto.alt ?? "Foto del checklist"}
                className="max-h-[82vh] max-w-[92vw] object-contain transition-transform duration-150"
                style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
