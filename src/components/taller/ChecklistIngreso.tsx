"use client";

import { useRef, useState } from "react";
import { Camera, Plus, X } from "lucide-react";
import { CHECKLIST_PUNTOS } from "@/lib/taller-checklist";
import { useUploadThing } from "@/lib/uploadthing";
import FotoLightbox from "@/components/taller/FotoLightbox";

export type CheckState = {
  ok: boolean | null;
  nota: string;
  extras: string[];
  fotos: { url: string; key: string }[];
};

export function parseChecklistRow(row?: { ok: boolean | null; nota: string | null; fotos?: string | null }): CheckState {
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
  return { ok: row?.ok ?? null, nota, extras, fotos };
}

export function serializeCheck(c: CheckState): { nota: string; fotos: { url: string; key: string }[] } {
  const nota = [c.nota, ...c.extras].filter((t) => t.trim()).join("\n---\n");
  return { nota, fotos: c.fotos };
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

  const bien = CHECKLIST_PUNTOS.filter((p) => value[p.clave]?.ok === true).length;
  const falla = CHECKLIST_PUNTOS.filter((p) => value[p.clave]?.ok === false).length;
  const falta = CHECKLIST_PUNTOS.length - bien - falla;

  function patch(clave: string, partial: Partial<CheckState>) {
    onChange({ ...value, [clave]: { ...value[clave], ...partial } });
  }

  function setOk(clave: string, ok: boolean) {
    const next = value[clave].ok === ok ? null : ok;
    patch(clave, { ok: next });
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
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-sm">Cómo llegó</p>
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            {bien} bien · {falla} con falla · {falta} sin marcar
          </p>
        </div>
        {!locked && falta > 0 && (
          <button
            type="button"
            className="text-xs font-semibold text-indigo-500"
            onClick={() => {
              const next = { ...value };
              for (const p of CHECKLIST_PUNTOS) {
                if (next[p.clave].ok == null) next[p.clave] = { ...next[p.clave], ok: true };
              }
              onChange(next);
            }}
          >
            Marcar el resto bien
          </button>
        )}
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

      <ul className="space-y-2">
        {CHECKLIST_PUNTOS.map((p) => {
          const c = value[p.clave];
          const expanded = open === p.clave;
          const tieneDetalle = Boolean(c.nota || c.extras.length || c.fotos.length);
          return (
            <li key={p.clave} className="rounded-2xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="flex items-start justify-between gap-2">
                <button type="button" className="text-left flex-1 min-w-0" onClick={() => setOpen(open === p.clave ? null : p.clave)}>
                  <p className="text-sm font-semibold">{p.label}</p>
                  <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
                    {expanded ? (p.hint || "") : tieneDetalle ? `${c.fotos.length ? `${c.fotos.length} foto${c.fotos.length === 1 ? "" : "s"}` : "con notas"}` : (p.hint || "Toca para nota o foto")}
                  </p>
                </button>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => setOk(p.clave, true)}
                    className={`h-10 min-w-14 rounded-xl text-sm font-semibold ${
                      c.ok === true ? "bg-indigo-600 text-white" : "border"
                    }`}
                    style={c.ok === true ? undefined : { borderColor: "var(--border)", color: "var(--fg-muted)" }}
                  >
                    Bien
                  </button>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => setOk(p.clave, false)}
                    className={`h-10 min-w-14 rounded-xl text-sm font-semibold ${
                      c.ok === false ? "bg-[var(--surface-2)] text-[var(--fg)] border-2 border-indigo-500" : "border"
                    }`}
                    style={c.ok === false ? undefined : { borderColor: "var(--border)", color: "var(--fg-muted)" }}
                  >
                    Falla
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="mt-3 space-y-2">
                  {p.hint && (
                    <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{p.hint}</p>
                  )}
                  <textarea
                    disabled={locked}
                    rows={2}
                    placeholder={p.clave === "neumaticos" ? "Posición 7,8,9,10 gastados…" : "Qué viste"}
                    value={c.nota}
                    onChange={(e) => patch(p.clave, { nota: e.target.value })}
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
                  />
                  {c.extras.map((n, i) => (
                    <div key={i} className="flex gap-2">
                      <textarea
                        disabled={locked}
                        rows={2}
                        value={n}
                        onChange={(e) => {
                          const extras = [...c.extras];
                          extras[i] = e.target.value;
                          patch(p.clave, { extras });
                        }}
                        className="w-full rounded-xl border px-3 py-2 text-sm"
                        style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
                      />
                      {!locked && (
                        <button type="button" onClick={() => patch(p.clave, { extras: c.extras.filter((_, j) => j !== i) })}>
                          <X className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
                        </button>
                      )}
                    </div>
                  ))}
                  {!locked && (
                    <button
                      type="button"
                      className="text-xs font-semibold flex items-center gap-1"
                      onClick={() => patch(p.clave, { extras: [...c.extras, ""] })}
                    >
                      <Plus className="w-3.5 h-3.5" /> Otra nota
                    </button>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {c.fotos.map((f) => (
                      <div key={f.key} className="relative">
                        <FotoLightbox foto={{ ...f, alt: p.label }} />
                        {!locked && (
                          <button
                            type="button"
                            className="absolute -top-1 -right-1 bg-black/70 rounded-full p-0.5"
                            onClick={(e) => {
                              e.preventDefault();
                              patch(p.clave, { fotos: c.fotos.filter((x) => x.key !== f.key) });
                            }}
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        )}
                      </div>
                    ))}
                    {!locked && c.fotos.length < 6 && (
                      <button
                        type="button"
                        disabled={uploading === p.clave}
                        onClick={() => {
                          pendingClave.current = p.clave;
                          fileRef.current?.click();
                        }}
                        className="h-16 w-16 rounded-lg border border-dashed flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold"
                        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                      >
                        <Camera className="w-4 h-4" />
                        {uploading === p.clave ? "…" : "Foto"}
                      </button>
                    )}
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
