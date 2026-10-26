"use client";

import { useRef, useState } from "react";
import { Camera, Check, Plus, X } from "lucide-react";
import { CHECKLIST_PUNTOS } from "@/lib/taller-checklist";
import { useUploadThing } from "@/lib/uploadthing";
import FotoLightbox from "@/components/taller/FotoLightbox";

export type RespuestaChecklist = "si" | "no" | "na" | null;

export type CheckState = {
  respuesta: RespuestaChecklist;
  ok: boolean | null;
  nota: string;
  extras: string[];
  fotos: { url: string; key: string }[];
};

export function parseChecklistRow(row?: { ok: boolean | null; respuesta?: string | null; nota: string | null; fotos?: string | null }): CheckState {
  const extras: string[] = [];
  let nota = row?.nota ?? "";
  if (nota.includes("\n---\n")) {
    const parts = nota.split("\n---\n");
    nota = parts[0] ?? "";
    extras.push(...parts.slice(1).filter(Boolean));
  }
  let fotos: { url: string; key: string }[] = [];
  if (row?.fotos) {
    try { fotos = JSON.parse(row.fotos); } catch { fotos = []; }
  }
  const respuesta = row?.respuesta === "si" || row?.respuesta === "no" || row?.respuesta === "na"
    ? row.respuesta
    : row?.ok === true ? "si" : row?.ok === false ? "no" : null;
  return { respuesta, ok: respuesta === "si" ? true : respuesta === "no" ? false : null, nota, extras, fotos };
}

export function serializeCheck(c: CheckState): { respuesta: RespuestaChecklist; ok: boolean | null; nota: string; fotos: { url: string; key: string }[] } {
  const nota = [c.nota, ...c.extras].filter((t) => t.trim()).join("\n---\n");
  return { respuesta: c.respuesta, ok: c.ok, nota, fotos: c.fotos };
}

export default function ChecklistIngreso({
  value,
  onChange,
  locked,
}: {
  value: Record<string, CheckState>;
  onChange: (next: Record<string, CheckState>) => void;
  locked: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingClave = useRef<string | null>(null);
  const { startUpload } = useUploadThing("tallerFoto", {
    onUploadError: () => setUploading(null),
  });

  const si = CHECKLIST_PUNTOS.filter((p) => value[p.clave]?.respuesta === "si").length;
  const no = CHECKLIST_PUNTOS.filter((p) => value[p.clave]?.respuesta === "no").length;
  const na = CHECKLIST_PUNTOS.filter((p) => value[p.clave]?.respuesta === "na").length;
  const pendientes = CHECKLIST_PUNTOS.length - si - no - na;

  function patch(clave: string, partial: Partial<CheckState>) {
    onChange({ ...value, [clave]: { ...value[clave], ...partial } });
  }

  function setRespuesta(clave: string, respuesta: Exclude<RespuestaChecklist, null>) {
    patch(clave, { respuesta, ok: respuesta === "si" ? true : respuesta === "no" ? false : null });
    if (respuesta === "no") setOpen(clave);
    else if (open === clave) setOpen(null);
  }

  function markAllGood() {
    const next = { ...value };
    for (const punto of CHECKLIST_PUNTOS) {
      next[punto.clave] = { ...next[punto.clave], respuesta: "si", ok: true };
    }
    onChange(next);
  }

  async function onFiles(clave: string, files: FileList | null) {
    if (!files?.length || locked) return;
    setUploading(clave);
    const uploaded = await startUpload(Array.from(files));
    setUploading(null);
    if (!uploaded?.length) return;
    const fotos = [
      ...value[clave].fotos,
      ...uploaded.map((f) => ({
        url: ("ufsUrl" in f && typeof f.ufsUrl === "string" ? f.ufsUrl : f.url) as string,
        key: f.key,
      })),
    ].slice(0, 6);
    patch(clave, { fotos });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide">Checklist de ingreso · unidad</p>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--fg-muted)" }}>
            {si} SI · {no} NO · {na} N/A · {pendientes} sin marcar
          </p>
        </div>
        {!locked && <button type="button" onClick={markAllGood} className="rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold" style={{ borderColor: "var(--border)" }}>
          Marcar todo en buen estado
        </button>}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const clave = pendingClave.current;
          pendingClave.current = null;
          if (clave) void onFiles(clave, e.target.files);
          e.target.value = "";
        }}
      />

      <ul className="space-y-1.5">
        {CHECKLIST_PUNTOS.map((p) => {
          const c = value[p.clave];
          const expanded = c.respuesta === "no" || open === p.clave;
          const tieneDetalle = Boolean(c.nota || c.extras.some((item) => item.trim()) || c.fotos.length);
          const opciones = [
            { value: "si" as const, label: "SI" },
            { value: "no" as const, label: "NO" },
            { value: "na" as const, label: "N/A" },
          ];
          return (
            <li key={p.clave} onClick={(event) => {
              if ((event.target as HTMLElement).closest("button, textarea, input, a")) return;
              setOpen(expanded ? null : p.clave);
            }} className="cursor-pointer rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="flex items-center gap-2">
                <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : p.clave)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-xs font-semibold">{p.label}</p>
                  {p.hint && <p className="truncate text-[10px] leading-tight" style={{ color: "var(--fg-muted)" }}>{p.hint}</p>}
                </button>
                <div className="flex shrink-0 gap-1">
                  {opciones.map((opcion) => {
                    const active = c.respuesta === opcion.value;
                    return <button
                      key={opcion.value}
                      type="button"
                      disabled={locked}
                      aria-pressed={active}
                      onClick={() => setRespuesta(p.clave, opcion.value)}
                      className={`min-w-10 rounded-md border px-2 py-1.5 text-[11px] font-bold ${active ? "border-indigo-600 bg-indigo-600 text-white" : ""}`}
                      style={active ? undefined : { borderColor: "var(--border)", color: "var(--fg-muted)" }}
                    >{opcion.label}</button>;
                  })}
                </div>
              </div>

              {expanded && (
                <div className="mt-2 space-y-2 border-t pt-2" style={{ borderColor: "var(--border)" }}>
                  <textarea
                    disabled={locked}
                    rows={2}
                    placeholder={c.respuesta === "no" ? "Describe qué detectaste o la falla" : "Anotación opcional"}
                    value={c.nota}
                    onChange={(e) => patch(p.clave, { nota: e.target.value })}
                    className="w-full rounded-md border px-2.5 py-2 text-xs"
                    style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
                  />
                  {c.extras.map((nota, index) => (
                    <div key={index} className="flex gap-1.5">
                      <textarea
                        disabled={locked}
                        rows={2}
                        value={nota}
                        onChange={(e) => {
                          const extras = [...c.extras];
                          extras[index] = e.target.value;
                          patch(p.clave, { extras });
                        }}
                        className="w-full rounded-md border px-2.5 py-2 text-xs"
                        style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
                      />
                      {!locked && <button type="button" aria-label="Quitar nota" onClick={() => patch(p.clave, { extras: c.extras.filter((_, i) => i !== index) })}><X className="h-4 w-4" style={{ color: "var(--fg-muted)" }} /></button>}
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center gap-2">
                    {!locked && <button type="button" className="inline-flex items-center gap-1 text-[10px] font-semibold" onClick={() => patch(p.clave, { extras: [...c.extras, ""] })}><Plus className="h-3 w-3" />Otra nota</button>}
                    {c.fotos.map((foto) => <div key={foto.key} className="relative">
                      <FotoLightbox foto={{ ...foto, alt: p.label }} />
                      {!locked && <button type="button" aria-label="Quitar foto" className="absolute -right-1 -top-1 rounded-full bg-black/70 p-0.5" onClick={(e) => { e.preventDefault(); patch(p.clave, { fotos: c.fotos.filter((item) => item.key !== foto.key) }); }}><X className="h-3 w-3 text-white" /></button>}
                    </div>)}
                    {!locked && c.fotos.length < 6 && <button
                      type="button"
                      disabled={uploading === p.clave}
                      onClick={() => { pendingClave.current = p.clave; fileRef.current?.click(); }}
                      className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-1.5 text-[10px] font-semibold"
                      style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                    ><Camera className="h-3.5 w-3.5" />{uploading === p.clave ? "Subiendo…" : "Foto"}</button>}
                    {c.respuesta === "no" && tieneDetalle && <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-indigo-600"><Check className="h-3 w-3" />Falla documentada</span>}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
