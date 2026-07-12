"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle, Send, Bug, RefreshCw, HelpCircle,
  DollarSign, Layers, Clock, CheckCircle2, User, Shield, Sparkles,
} from "lucide-react";
import {
  addMensajePBAction,
  updateEstadoTicketPBAction,
} from "@/app/actions/poxelbit";
import type { getTicketPBAction } from "@/app/actions/poxelbit";

type Ticket = NonNullable<Awaited<ReturnType<typeof getTicketPBAction>>>;

const TIPO_CFG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  bug:        { label: "Bug",          icon: Bug,        color: "text-red-400",     bg: "bg-red-500/10"     },
  change:     { label: "Cambio",       icon: RefreshCw,  color: "text-blue-400",    bg: "bg-blue-500/10"    },
  new_module: { label: "Nuevo módulo", icon: Layers,     color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  question:   { label: "Pregunta",     icon: HelpCircle, color: "text-amber-400",   bg: "bg-amber-500/10"   },
  payment:    { label: "Pago",         icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
};

const ESTADOS_STEPS = [
  { key: "open",        label: "Abierto",    icon: Clock        },
  { key: "in_progress", label: "En proceso", icon: RefreshCw    },
  { key: "resolved",    label: "Resuelto",   icon: CheckCircle2 },
  { key: "closed",      label: "Cerrado",    icon: CheckCircle2 },
] as const;

const PRIORIDAD_CFG: Record<string, { label: string; color: string; bg: string }> = {
  low:    { label: "Baja",    color: "text-slate-400",  bg: "bg-slate-500/10"  },
  medium: { label: "Media",   color: "text-amber-400",  bg: "bg-amber-500/10"  },
  high:   { label: "Alta",    color: "text-orange-400", bg: "bg-orange-500/10" },
  urgent: { label: "Urgente", color: "text-red-400",    bg: "bg-red-500/10"    },
};

function formatDate(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// Renderiza **negrita** en mensajes del sistema
function MsgContent({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
          : part
      )}
    </span>
  );
}

// Timeline de estado
function StatusTimeline({ current }: { current: string }) {
  const idx = ESTADOS_STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-0">
      {ESTADOS_STEPS.map((step, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const pending = i > idx;
        const Icon    = step.icon;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                active  ? "border-indigo-500 bg-indigo-500/20" :
                done    ? "border-emerald-500 bg-emerald-500/20" :
                          "border-[var(--border)] bg-[var(--surface-2)]"
              }`}>
                <Icon className={`w-3.5 h-3.5 ${
                  active ? "text-indigo-400" : done ? "text-emerald-400" : "text-[var(--fg-muted)]"
                }`} />
              </div>
              <span className={`text-[9px] font-semibold whitespace-nowrap ${
                active ? "text-indigo-400" : done ? "text-emerald-400" : "text-[var(--fg-muted)]"
              }`}>
                {step.label}
              </span>
            </div>
            {i < ESTADOS_STEPS.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-10 mb-4 mx-0.5 transition-colors ${
                i < idx ? "bg-emerald-500/40" : "bg-[var(--border)]"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TicketThreadPB({
  ticket,
  isAdmin,
}: {
  ticket: Ticket;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTx] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.mensajes]);

  const tipoCfg  = TIPO_CFG[ticket.tipo]     ?? TIPO_CFG.question;
  const priorCfg = PRIORIDAD_CFG[ticket.prioridad] ?? PRIORIDAD_CFG.medium;
  const TipoIcon = tipoCfg.icon;
  const isResolved = ticket.estado === "resolved";
  const isClosed   = ticket.estado === "closed";

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = texto.trim();
    if (!trimmed) return;
    setError("");
    startTx(async () => {
      try {
        await addMensajePBAction(ticket.id, trimmed);
        setTexto("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al enviar");
      }
    });
  }

  function handleEstado(estado: typeof ESTADOS_STEPS[number]["key"]) {
    startTx(async () => {
      try {
        await updateEstadoTicketPBAction(ticket.id, estado);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cambiar estado");
      }
    });
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      {/* Breadcrumb */}
      <Link href="/poxelbit/tickets"
        className="inline-flex items-center gap-1.5 text-xs font-semibold mb-5 hover:text-indigo-400 transition-colors"
        style={{ color: "var(--fg-muted)" }}>
        ← Tickets
      </Link>

      {/* Ticket header card */}
      <div className="rounded-2xl border overflow-hidden mb-6"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>

        {/* Color stripe por prioridad */}
        <div className={`h-1 w-full ${
          ticket.prioridad === "urgent" ? "bg-red-500" :
          ticket.prioridad === "high"   ? "bg-orange-500" :
          ticket.prioridad === "medium" ? "bg-amber-500" : "bg-slate-500"
        }`} />

        <div className="p-5 space-y-4">
          {/* Título + meta */}
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${tipoCfg.bg}`}>
              <TipoIcon className={`w-5 h-5 ${tipoCfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                  style={{ color: "var(--fg-muted)", borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
                  #{ticket.id}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipoCfg.bg} ${tipoCfg.color}`}>
                  {tipoCfg.label}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorCfg.bg} ${priorCfg.color}`}>
                  {priorCfg.label}
                </span>
              </div>
              <h1 className="font-outfit font-bold text-xl leading-snug" style={{ color: "var(--fg)" }}>
                {ticket.titulo}
              </h1>
              <p className="text-xs mt-1.5" style={{ color: "var(--fg-muted)" }}>
                {ticket.creadoPorNombre} · {formatDate(ticket.createdAt)}
                {ticket.modulo && (
                  <> · <Link href={`/poxelbit/modulos/${ticket.modulo.id}`}
                    className="hover:text-indigo-400 transition-colors underline underline-offset-2">
                    {ticket.modulo.titulo}
                  </Link></>
                )}
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div className="p-3.5 rounded-xl text-sm leading-relaxed"
            style={{ backgroundColor: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }}>
            <MsgContent text={ticket.descripcion} />
          </div>

          {/* Timeline */}
          <div className="flex items-center justify-center pt-1 pb-1 overflow-x-auto">
            <StatusTimeline current={ticket.estado} />
          </div>

          {/* Cambio de estado (admin) */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
                Cambiar estado:
              </span>
              {ESTADOS_STEPS.map((step) => {
                const active = ticket.estado === step.key;
                return (
                  <button key={step.key} onClick={() => handleEstado(step.key)}
                    disabled={isPending || active}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                      active
                        ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-400"
                        : "hover:bg-[var(--surface-2)] border-transparent"
                    }`}
                    style={!active ? { color: "var(--fg-muted)" } : undefined}>
                    {step.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Banner de resuelto */}
      {(isResolved || isClosed) && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-5 bg-emerald-500/10 border border-emerald-500/25">
          <div className="p-2 rounded-xl bg-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">
              {isClosed ? "Ticket cerrado" : "Ticket resuelto — puedes confirmar o escribir si tienes dudas"}
            </p>
            {ticket.resueltaAt && (
              <p className="text-xs text-emerald-400/70">{formatDate(ticket.resueltaAt)}</p>
            )}
          </div>
        </div>
      )}

      {/* Thread de mensajes */}
      <div className="space-y-4 mb-4">
        {ticket.mensajes.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: "var(--fg-muted)" }}>
            Sin mensajes aún. Escribe el primero abajo.
          </p>
        ) : (
          ticket.mensajes.map((m) => {
            const isDev = m.autorRol === "developer";
            return (
              <div key={m.id} className={`flex gap-2.5 ${isDev ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 self-end flex items-center justify-center ${
                  isDev ? "bg-indigo-600" : "bg-[var(--surface-2)] border"
                }`} style={!isDev ? { borderColor: "var(--border)" } : undefined}>
                  {isDev
                    ? <Shield className="w-4 h-4 text-white" />
                    : <User className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
                  }
                </div>

                {/* Burbuja */}
                <div className={`max-w-[82%] flex flex-col gap-1 ${isDev ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-3 text-sm leading-relaxed ${
                    isDev
                      ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-sm shadow-indigo-500/20"
                      : "rounded-2xl rounded-tl-sm"
                  }`}
                    style={!isDev ? {
                      backgroundColor: "var(--surface)",
                      color: "var(--fg)",
                      border: "1px solid var(--border)",
                    } : undefined}>
                    <MsgContent text={m.contenido} />
                  </div>
                  <div className={`flex items-center gap-1.5 px-1 ${isDev ? "flex-row-reverse" : ""}`}>
                    <span className="text-[10px] font-semibold" style={{ color: "var(--fg-muted)" }}>
                      {isDev ? (
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-400" /> Soporte
                        </span>
                      ) : m.autorNombre}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                      · {formatDate(m.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input de respuesta */}
      {!isClosed ? (
        <form onSubmit={handleSend}
          className="sticky bottom-4 p-3 rounded-2xl border"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1 mb-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
          <div className="flex gap-2">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); }
              }}
              placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
              rows={2}
              className="flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
            />
            <button type="submit" disabled={isPending || !texto.trim()}
              className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-40 shrink-0 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 text-sm rounded-2xl border"
          style={{ color: "var(--fg-muted)", borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          Ticket cerrado ·{" "}
          <Link href="/poxelbit/tickets" className="text-indigo-400 hover:underline">
            Ver todos los tickets
          </Link>
        </div>
      )}
    </div>
  );
}
