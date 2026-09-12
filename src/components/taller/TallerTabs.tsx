"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import TallerLista from "@/components/taller/TallerLista";
import type { AlertaMantenimiento } from "@/app/actions/mantenimiento";

type Orden = Parameters<typeof TallerLista>[0]["ordenes"][number];

export default function TallerTabs({
  ordenes,
  programados,
}: {
  ordenes: Orden[];
  programados: AlertaMantenimiento[];
}) {
  const [tab, setTab] = useState<"ordenes" | "programados">("ordenes");
  const abiertas = ordenes.filter((o) => o.estado === "abierta" || o.estado === "en_proceso").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-xl border w-fit" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
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

      {tab === "ordenes" ? (
        <TallerLista ordenes={ordenes} />
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          {programados.length === 0 ? (
            <p className="text-sm text-center py-10 px-4" style={{ color: "var(--fg-muted)" }}>
              No hay servicios de km/hrs vencidos o próximos, o ya tienen una orden abierta.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
              {programados.map((p) => (
                <li key={`${p.unidadId}-${p.tipoControl}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-mono font-bold text-sm">{p.unidadCodigo}</p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      {p.tipoControl.toUpperCase()} · falta {Math.round(p.faltante).toLocaleString("es-MX")} {p.tipoControl === "hrs" ? "hrs" : "km"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={p.estado === "vencido" ? "danger" : "warning"}>
                      {p.estado === "vencido" ? "Vencido" : "Próximo"}
                    </Badge>
                    <Link
                      href={`/taller/nueva?unidadId=${p.unidadId}&preventivo=${p.tipoControl}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white"
                    >
                      Atender
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
