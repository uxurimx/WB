"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle, Send, ChevronRight, Bug, RefreshCw, HelpCircle,
  DollarSign, Layers, Clock, CheckCircle2, User, Shield,
} from "lucide-react";
import {
  addMensajePBAction,
  updateEstadoTicketPBAction,
} from "@/app/actions/poxelbit";
import type { getTicketPBAction } from "@/app/actions/poxelbit";

type Ticket = NonNullable<Awaited<ReturnType<typeof getTicketPBAction>>>;

const TIPO_CFG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  bug:        { label: "Bug",           icon: Bug,        color: "text-red-400"     },
  change:     { label: "Cambio",        icon: RefreshCw,  color: "text-blue-400"    },
  new_module: { label: "Nuevo módulo",  icon: Layers,     color: "text-indigo-400"  },
  question:   { label: "Pregunta",      icon: HelpCircle, color: "text-amber-400"   },
  payment:    { label: "Pago",          icon: DollarSign, color: "text-emerald-400" },
};

const ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: "Abierto",    color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  in_progress: { label: "En proceso", color: "text-blue-400",    bg: "bg-blue-500/10"    },
  resolved:    { label: "Resuelto",   color: "text-emerald-400", bg: "bg-emerald-500/10" },
  closed:      { label: "Cerrado",    color: "text-slate-400",   bg: "bg-slate-500/10"   },
};

const PRIORIDAD_CFG: Record<string, { label: string; color: string }> = {
  low:    { label: "Baja",    color: "text-slate-400"  },
  medium: { label: "Media",   color: "text-amber-400"  },
  high:   { label: "Alta",    color: "text-orange-400" },
  urgent: { label: "Urgente", color: "text-red-400"    },
};

const ESTADOS_TRANSICION = ["open", "in_progress", "resolved", "closed"] as const;

function formatDate(d: Date | string | null) {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

  const tipoCfg   = TIPO_CFG[ticket.tipo]     ?? TIPO_CFG.question;
  const estadoCfg = ESTADO_CFG[ticket.estado] ?? ESTADO_CFG.open;
  const priorCfg  = PRIORIDAD_CFG[ticket.prioridad] ?? PRIORIDAD_CFG.medium;
  const TipoIcon  = tipoCfg.icon;

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

  function handleEstado(estado: typeof ESTADOS_TRANSICION[number]) {
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
      <div className="mb-6">
        <Link href="/poxelbit/tickets"
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-400 transition-colors"
          style={{ color: "var(--fg-muted)" }}>
          ← Tickets
        </Link>

        {/* Header */}
        <div className="p-5 rounded-2xl border space-y-3"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--surface-2)] shrink-0">
              <TipoIcon className={`w-5 h-5 ${tipoCfg.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono" style={{ color: "var(--fg-muted)" }}>#{ticket.id}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estadoCfg.bg} ${estadoCfg.color}`}>
                  {estadoCfg.label}
                </span>
                <span className={`text-[10px] font-semibold ${priorCfg.color}`}>{priorCfg.label}</span>
              </div>
              <h1 className="font-outfit font-bold text-xl leading-snug" style={{ color: "var(--fg)" }}>
                {ticket.titulo}
              </h1>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                {ticket.creadoPorNombre} · {formatDate(ticket.createdAt)}
                {ticket.modulo && (
                  <> · <Link href={`/poxelbit/modulos/${ticket.modulo.id}`} className="hover:text-indigo-400 transition-colors">{ticket.modulo.titulo}</Link></>
                )}
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div className="p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
            style={{ backgroundColor: "var(--surface-2)", color: "var(--fg)" }}>
            {ticket.descripcion}
          </div>

          {/* Cambio de estado (admin) */}
          {isAdmin && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: "var(--fg-muted)" }}>Estado:</span>
              {ESTADOS_TRANSICION.map((e) => {
                const cfg = ESTADO_CFG[e];
                const active = ticket.estado === e;
                return (
                  <button key={e} onClick={() => handleEstado(e)} disabled={isPending || active}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                      active ? `${cfg.bg} ${cfg.color} border-transparent` : "border-transparent hover:bg-[var(--surface-2)]"
                    }`}
                    style={!active ? { color: "var(--fg-muted)" } : undefined}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mensajes */}
      <div className="space-y-3 mb-4">
        {ticket.mensajes.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: "var(--fg-muted)" }}>
            Sin mensajes aún. Escribe el primero.
          </p>
        ) : (
          ticket.mensajes.map((m) => {
            const isDev = m.autorRol === "developer";
            return (
              <div key={m.id} className={`flex gap-2.5 ${isDev ? "flex-row-reverse" : ""}`}>
                <div className={`p-1.5 rounded-full shrink-0 self-end ${isDev ? "bg-indigo-500/10" : "bg-[var(--surface-2)]"}`}>
                  {isDev
                    ? <Shield className="w-4 h-4 text-indigo-400" />
                    : <User className="w-4 h-4" style={{ color: "var(--fg-muted)" }} />
                  }
                </div>
                <div className={`max-w-[80%] ${isDev ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isDev
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "rounded-tl-sm"
                  }`}
                    style={!isDev ? { backgroundColor: "var(--surface)", color: "var(--fg)", border: "1px solid var(--border)" } : undefined}>
                    {m.contenido}
                  </div>
                  <span className="text-[10px] px-1" style={{ color: "var(--fg-muted)" }}>
                    {m.autorNombre} · {formatDate(m.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Responder */}
      {ticket.estado !== "closed" && (
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
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); } }}
              placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para nueva línea)"
              rows={2}
              className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--fg)" }}
            />
            <button type="submit" disabled={isPending || !texto.trim()}
              className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-40 shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {ticket.estado === "closed" && (
        <div className="text-center py-4 text-sm" style={{ color: "var(--fg-muted)" }}>
          Este ticket está cerrado.
        </div>
      )}
    </div>
  );
}
