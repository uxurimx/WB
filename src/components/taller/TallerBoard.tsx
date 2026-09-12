"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import OrdenNuevaForm from "@/components/taller/OrdenNuevaForm";
import { ESTADO_LABEL, type EstadoOrden } from "@/lib/taller-checklist";
import type { AlertaMantenimiento } from "@/app/actions/mantenimiento";
import { formatFechaHoraMx } from "@/lib/date-utils";

type Orden = {
  id: number;
  fecha: string;
  createdAt: string | Date | null;
  kmHrs: number | null;
  motivo: string | null;
  estado: string;
  abiertoPorNombre?: string | null;
  unidad: { codigo: string } | null;
  operador: { nombre: string } | null;
};

type Unidad = {
  id: number;
  codigo: string;
  tipo: string;
  odometroActual: number | null;
  odometroOffset: number | null;
  operadorDefaultId: number | null;
};

function badgeVariant(estado: string) {
  if (estado === "abierta") return "warning" as const;
  if (estado === "en_proceso") return "default" as const;
  if (estado === "cerrada") return "success" as const;
  return "secondary" as const;
}

export default function TallerBoard({
  ordenes,
  programados,
  unidades,
  operadores,
  initialNueva = false,
  initialUnidadId = "",
  initialPreventivo = null,
}: {
  ordenes: Orden[];
  programados: AlertaMantenimiento[];
  unidades: Unidad[];
  operadores: { id: number; nombre: string }[];
  initialNueva?: boolean;
  initialUnidadId?: string;
  initialPreventivo?: "km" | "hrs" | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"ordenes" | "programados">(initialPreventivo ? "programados" : "ordenes");
  const [modal, setModal] = useState(initialNueva);
  const [prefillUnidad, setPrefillUnidad] = useState(initialUnidadId);
  const [prefillPrev, setPrefillPrev] = useState<"km" | "hrs" | null>(initialPreventivo);
  const [flashId, setFlashId] = useState<number | null>(null);
  const abiertas = ordenes.filter((o) => o.estado === "abierta" || o.estado === "en_proceso").length;

  function openNueva(unidadId = "", preventivo: "km" | "hrs" | null = null) {
    setPrefillUnidad(unidadId);
    setPrefillPrev(preventivo);
    setModal(true);
  }

  function onCreated(id: number) {
    setModal(false);
    setFlashId(id);
    setTab("ordenes");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <button
            type="button"
            onClick={() => setTab("ordenes")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === "ordenes" ? "bg-indigo-600 text-white" : ""}`}
          >
            Órdenes {abiertas > 0 ? `(${abiertas})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setTab("programados")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === "programados" ? "bg-indigo-600 text-white" : ""}`}
          >
            Programados {programados.length > 0 ? `(${programados.length})` : ""}
          </button>
        </div>
        <button
          type="button"
          onClick={() => openNueva()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white"
        >
          <Plus className="w-4 h-4" /> Nueva
        </button>
      </div>

      {tab === "ordenes" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {ordenes.length === 0 && (
            <button
              type="button"
              onClick={() => openNueva()}
              className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-dashed py-12 text-sm"
              style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
            >
              No hay órdenes. Toca para abrir la primera.
            </button>
          )}
          {ordenes.map((o) => (
            <Link
              key={o.id}
              href={`/taller/${o.id}`}
              className={`block rounded-2xl border p-4 hover:border-indigo-400/50 transition-colors ${
                flashId === o.id ? "ring-2 ring-indigo-500" : ""
              }`}
              style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono font-bold">{o.unidad?.codigo ?? "—"}</p>
                <Badge variant={badgeVariant(o.estado)}>
                  {ESTADO_LABEL[o.estado as EstadoOrden] ?? o.estado}
                </Badge>
              </div>
              <p className="text-sm mt-1 line-clamp-2">{o.motivo || "Sin motivo"}</p>
              <p className="text-xs mt-2" style={{ color: "var(--fg-muted)" }}>
                {formatFechaHoraMx(o.fecha, o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt)}
                {o.operador?.nombre ? ` · ${o.operador.nombre}` : ""}
                {o.abiertoPorNombre ? ` · abrió ${o.abiertoPorNombre}` : ""}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          {programados.length === 0 ? (
            <p className="text-sm text-center py-10 px-4" style={{ color: "var(--fg-muted)" }}>
              No hay km/hrs vencidos o próximos, o ya tienen orden abierta.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {programados.map((p) => (
                <li key={`${p.unidadId}-${p.tipoControl}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-mono font-bold text-sm">{p.unidadCodigo}</p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      {p.tipoControl.toUpperCase()} · faltan {Math.round(p.faltante).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={p.estado === "vencido" ? "danger" : "warning"}>
                      {p.estado === "vencido" ? "Vencido" : "Próximo"}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => openNueva(String(p.unidadId), p.tipoControl)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white"
                    >
                      Atender
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={modal} onOpenChange={setModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva orden</DialogTitle>
          </DialogHeader>
          <p className="text-sm -mt-2 mb-2" style={{ color: "var(--fg-muted)" }}>
            Solo los datos de llegada. El checklist y las piezas van después, dentro de la orden.
          </p>
          {modal && (
            <OrdenNuevaForm
              key={`${prefillUnidad}-${prefillPrev}`}
              unidades={unidades}
              operadores={operadores}
              initialUnidadId={prefillUnidad}
              initialPreventivo={prefillPrev}
              onCreated={onCreated}
              onCancel={() => setModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
