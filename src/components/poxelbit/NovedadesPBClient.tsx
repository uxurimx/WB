"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Megaphone, Rocket, AlertCircle, Wrench, TrendingUp, CheckCircle2, Plus, X,
} from "lucide-react";
import { createNovedadPBAction } from "@/app/actions/poxelbit";
import type { getNovedadesPBAction, getPBModulosAction } from "@/app/actions/poxelbit";

type Novedad = Awaited<ReturnType<typeof getNovedadesPBAction>>[number];
type Modulo  = { id: number; titulo: string };

const TIPO_CFG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  update:    { label: "Actualización", icon: TrendingUp,   color: "text-blue-400",    bg: "bg-blue-500/10"    },
  milestone: { label: "Hito",          icon: Rocket,       color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  alert:     { label: "Alerta",        icon: AlertCircle,  color: "text-amber-400",   bg: "bg-amber-500/10"   },
  maintenance:{ label: "Mantenimiento",icon: Wrench,       color: "text-slate-400",   bg: "bg-slate-500/10"   },
  release:   { label: "Lanzamiento",   icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

function formatDate(d: Date | string | null) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

export default function NovedadesPBClient({
  novedades,
  modulos,
  isAdmin,
}: {
  novedades: Novedad[];
  modulos: Modulo[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: "", contenido: "", tipo: "update", moduloId: "" });
  const [error, setError] = useState("");
  const [isPending, startTx] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.titulo.trim()) { setError("El título es requerido"); return; }
    if (!form.contenido.trim()) { setError("El contenido es requerido"); return; }
    startTx(async () => {
      try {
        await createNovedadPBAction({
          titulo:   form.titulo.trim(),
          contenido: form.contenido.trim(),
          tipo:     form.tipo,
          moduloId: form.moduloId ? parseInt(form.moduloId) : undefined,
        });
        setForm({ titulo: "", contenido: "", tipo: "update", moduloId: "" });
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al publicar");
      }
    });
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/poxelbit"
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-400 transition-colors"
          style={{ color: "var(--fg-muted)" }}>
          ← PoxelBit
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>PoxelBit</p>
            <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>Novedades</h1>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
              style={showForm
                ? { backgroundColor: "var(--surface-2)", color: "var(--fg)" }
                : { backgroundColor: "rgb(79 70 229)", color: "white" }}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{showForm ? "Cancelar" : "Nueva novedad"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Form (admin) */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="p-5 rounded-2xl border mb-6 space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>Nueva novedad</p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Título *</label>
            <input type="text" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              placeholder="Título de la novedad"
              className="w-full h-9 px-3 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}>
                {Object.entries(TIPO_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Módulo relacionado</label>
              <select value={form.moduloId} onChange={(e) => setForm((p) => ({ ...p, moduloId: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}>
                <option value="">— Ninguno —</option>
                {modulos.map((m) => <option key={m.id} value={m.id}>{m.titulo}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Contenido *</label>
            <textarea value={form.contenido} onChange={(e) => setForm((p) => ({ ...p, contenido: e.target.value }))}
              placeholder="Descripción detallada de la novedad..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </div>
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-60">
              {isPending ? "Publicando..." : "Publicar"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: "var(--fg-muted)" }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      {novedades.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <Megaphone className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "var(--fg-muted)" }} />
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Sin novedades todavía.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {novedades.map((n) => {
            const cfg = TIPO_CFG[n.tipo] ?? TIPO_CFG.update;
            const Icon = cfg.icon;
            return (
              <div key={n.id} className="p-5 rounded-2xl border"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                        <h3 className="font-semibold text-sm mt-0.5" style={{ color: "var(--fg)" }}>{n.titulo}</h3>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: "var(--fg-muted)" }}>
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--fg-muted)" }}>{n.contenido}</p>
                    {n.modulo && (
                      <Link href={`/poxelbit/modulos/${n.modulo.id}`}
                        className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                        {n.modulo.titulo} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
