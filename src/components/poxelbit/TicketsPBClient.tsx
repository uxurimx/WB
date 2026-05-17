"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Search, X, AlertCircle, Clock, CheckCircle2,
  TicketCheck, ChevronRight, Bug, RefreshCw, HelpCircle, DollarSign, Layers,
} from "lucide-react";
import { createTicketPBAction } from "@/app/actions/poxelbit";
import type { getTicketsPBAction, getPBModulosAction } from "@/app/actions/poxelbit";

type Ticket = Awaited<ReturnType<typeof getTicketsPBAction>>[number];
type Modulo = { id: number; titulo: string };

const TIPO_CFG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  bug:        { label: "Bug",           icon: Bug,        color: "text-red-400"    },
  change:     { label: "Cambio",        icon: RefreshCw,  color: "text-blue-400"   },
  new_module: { label: "Nuevo módulo",  icon: Layers,     color: "text-indigo-400" },
  question:   { label: "Pregunta",      icon: HelpCircle, color: "text-amber-400"  },
  payment:    { label: "Pago",          icon: DollarSign, color: "text-emerald-400"},
};

const ESTADO_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open:        { label: "Abierto",       color: "text-indigo-400",  icon: Clock        },
  in_progress: { label: "En proceso",    color: "text-blue-400",    icon: RefreshCw    },
  resolved:    { label: "Resuelto",      color: "text-emerald-400", icon: CheckCircle2 },
  closed:      { label: "Cerrado",       color: "text-slate-400",   icon: CheckCircle2 },
};

const PRIORIDAD_CFG: Record<string, { label: string; color: string }> = {
  low:    { label: "Baja",    color: "text-slate-400"   },
  medium: { label: "Media",   color: "text-amber-400"   },
  high:   { label: "Alta",    color: "text-orange-400"  },
  urgent: { label: "Urgente", color: "text-red-400"     },
};

export default function TicketsPBClient({
  tickets,
  modulos,
  isAdmin,
}: {
  tickets: Ticket[];
  modulos: Modulo[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroTipo,   setFiltroTipo]   = useState("todos");
  const [form, setForm] = useState({
    titulo: "", descripcion: "", tipo: "bug", prioridad: "medium", moduloId: "",
  });
  const [error, setError] = useState("");
  const [isPending, startTx] = useTransition();

  const filtrados = tickets.filter((t) => {
    if (filtroEstado !== "todos" && t.estado !== filtroEstado) return false;
    if (filtroTipo   !== "todos" && t.tipo   !== filtroTipo)   return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q);
    }
    return true;
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.titulo.trim()) { setError("El título es requerido"); return; }
    if (!form.descripcion.trim()) { setError("La descripción es requerida"); return; }
    startTx(async () => {
      try {
        await createTicketPBAction({
          titulo:      form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          tipo:        form.tipo,
          prioridad:   form.prioridad,
          moduloId:    form.moduloId ? parseInt(form.moduloId) : undefined,
        });
        setForm({ titulo: "", descripcion: "", tipo: "bug", prioridad: "medium", moduloId: "" });
        setShowForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear ticket");
      }
    });
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/poxelbit" className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-400 transition-colors" style={{ color: "var(--fg-muted)" }}>
          ← PoxelBit
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>PoxelBit</p>
            <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>Tickets</h1>
          </div>
          <button onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
            style={showForm
              ? { backgroundColor: "var(--surface-2)", color: "var(--fg)" }
              : { backgroundColor: "rgb(79 70 229)", color: "white" }}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{showForm ? "Cancelar" : "Nuevo ticket"}</span>
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border mb-6 space-y-4"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-outfit font-bold text-sm" style={{ color: "var(--fg)" }}>Nuevo ticket</p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Título *</label>
            <input type="text" value={form.titulo} onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              placeholder="Describe brevemente el problema o solicitud"
              className="w-full h-9 px-3 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}>
                {Object.entries(TIPO_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Prioridad</label>
              <select value={form.prioridad} onChange={(e) => setForm((p) => ({ ...p, prioridad: e.target.value }))}
                className="w-full h-9 px-2.5 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}>
                {Object.entries(PRIORIDAD_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
            <label className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Descripción *</label>
            <textarea value={form.descripcion} onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
              placeholder="Describe el problema con detalle: qué esperabas que pasara, qué pasó en realidad, pasos para reproducirlo..."
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
              {isPending ? "Enviando..." : "Enviar ticket"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm transition-colors hover:bg-[var(--surface-2)]"
              style={{ color: "var(--fg-muted)" }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--fg-muted)" }} />
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tickets..."
            className="w-full pl-9 pr-8 h-9 rounded-lg border text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
          {busqueda && (
            <button onClick={() => setBusqueda("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5" style={{ color: "var(--fg-muted)" }} />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {["todos", "open", "in_progress", "resolved", "closed"].map((e) => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${
                filtroEstado === e ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : ""
              }`}
              style={filtroEstado !== e ? { borderColor: "var(--border)", color: "var(--fg-muted)", backgroundColor: "var(--surface)" } : undefined}>
              {e === "todos" ? "Todos" : ESTADO_CFG[e]?.label ?? e}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <TicketCheck className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: "var(--fg-muted)" }} />
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            {tickets.length === 0 ? "Sin tickets. ¡Todo en orden!" : "Sin resultados"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((t) => {
            const tipoCfg     = TIPO_CFG[t.tipo]     ?? TIPO_CFG.question;
            const estadoCfg   = ESTADO_CFG[t.estado]  ?? ESTADO_CFG.open;
            const priorCfg    = PRIORIDAD_CFG[t.prioridad] ?? PRIORIDAD_CFG.medium;
            const TipoIcon    = tipoCfg.icon;
            const EstadoIcon  = estadoCfg.icon;

            return (
              <Link key={t.id} href={`/poxelbit/tickets/${t.id}`}
                className="flex items-center gap-3 p-4 rounded-2xl border group transition-colors hover:border-indigo-500/30"
                style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="p-2 rounded-lg bg-[var(--surface-2)] shrink-0">
                  <TipoIcon className={`w-4 h-4 ${tipoCfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--fg)" }}>{t.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[10px] font-semibold ${estadoCfg.color}`}>{estadoCfg.label}</span>
                    <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>·</span>
                    <span className={`text-[10px] font-semibold ${priorCfg.color}`}>{priorCfg.label}</span>
                    {t.modulo && (
                      <>
                        <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>·</span>
                        <span className="text-[10px] truncate max-w-[120px]" style={{ color: "var(--fg-muted)" }}>{t.modulo.titulo}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono" style={{ color: "var(--fg-muted)" }}>
                    #{t.id}
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
