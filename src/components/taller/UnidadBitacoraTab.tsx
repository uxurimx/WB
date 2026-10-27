"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatFechaHoraMx } from "@/lib/date-utils";
import { parseActividadesTaller, textoActividadesTaller } from "@/lib/taller-actividades";
import FotoLightbox, { type TallerFoto } from "@/components/taller/FotoLightbox";
import type { getIncidenciasTaller, getUreaTaller } from "@/app/actions/taller";
import { etiquetaCategoriaTaller, formatoFolioTaller } from "@/lib/taller-incidencias";

type Orden = {
  id: number;
  folio: number | null;
  fecha: string;
  createdAt: string | Date | null;
  kmHrs: number | null;
  motivo: string | null;
  categoria: string | null;
  estado: string;
  quienAtendio: string | null;
  trabajoRealizado: string | null;
  comentarios: string | null;
  proveedorExterno: string | null;
  operador: { nombre: string } | null;
  refacciones: { precio: number | null; cantidad: number | null; iva: boolean; descripcion?: string }[];
  checklist: { clave: string; fotos: string | null }[];
};
type Incidencia = Awaited<ReturnType<typeof getIncidenciasTaller>>[number];
type Urea = Awaited<ReturnType<typeof getUreaTaller>>[number];
type FiltroExpediente = "historial" | "activos" | "refacciones" | "urea";
type Registro = {
  key: string;
  fecha: string;
  folio: number | null;
  titulo: string;
  categoria: string;
  resolucion: string;
  estado: string;
  operador: string;
  atendio: string;
  lugar: string;
  lectura: string;
  falla: string;
  costo: number;
  ordenId: number | null;
  tipo: "orden" | "incidencia" | "urea";
};

function fotosDeOrden(checklist: Orden["checklist"]): TallerFoto[] {
  return checklist.flatMap((item) => {
    if (!item.fotos) return [];
    try {
      const fotos = JSON.parse(item.fotos) as { url: string; key: string }[];
      return fotos.map((foto) => ({ ...foto, alt: `Foto de ${item.clave}` }));
    } catch {
      return [];
    }
  });
}

function costo(refs: Orden["refacciones"]) {
  return refs.reduce((s, r) => {
    const p = (r.precio ?? 0) * (r.cantidad ?? 1);
    return s + (r.iva ? p * 1.16 : p);
  }, 0);
}

function estadoRegistro(estado: string) {
  if (estado === "terminada") return "Pendiente de cierre";
  if (estado === "cerrada" || estado === "resuelta") return "Cerrada · entregada";
  if (estado === "en_proceso" || estado === "en_revision") return "En reparación";
  if (estado === "cancelada") return "Cancelada";
  return "Abierta";
}

export default function UnidadBitacoraTab({
  ordenes,
  incidencias,
  urea,
  canOpen,
}: {
  unidadId: number;
  ordenes: Orden[];
  incidencias: Incidencia[];
  urea: Urea[];
  canOpen: boolean;
}) {
  const [filtro, setFiltro] = useState<FiltroExpediente>("historial");
  const registros = useMemo(() => {
    const incidenciasConOrden = new Set(incidencias.flatMap((i) => i.orden?.id ? [i.orden.id] : []));
    const filas: Registro[] = ordenes.map((o) => ({
      key: `orden-${o.id}`,
      fecha: o.fecha,
      folio: o.folio,
      titulo: o.motivo || "Orden de servicio",
      categoria: etiquetaCategoriaTaller(o.categoria || "otro"),
      resolucion: textoActividadesTaller(o.trabajoRealizado, o.quienAtendio ?? "") || o.comentarios || "Sin resolución registrada.",
      estado: estadoRegistro(o.estado),
      operador: o.operador?.nombre ?? "—",
      atendio: [...new Set(parseActividadesTaller(o.trabajoRealizado, o.quienAtendio ?? "").map((item) => item.atendio).filter(Boolean))].join(", ") || o.quienAtendio || "—",
      lugar: o.proveedorExterno || "TALLER",
      lectura: o.kmHrs != null ? `${Math.round(o.kmHrs).toLocaleString("es-MX")} km/hrs` : "—",
      falla: o.motivo || "—",
      costo: costo(o.refacciones),
      ordenId: o.id,
      tipo: "orden",
    }));
    for (const i of incidencias) {
      if (i.orden?.id && incidenciasConOrden.has(i.orden.id)) continue;
      filas.push({
        key: `incidencia-${i.id}`,
        fecha: i.fecha,
        folio: i.folio ?? null,
        titulo: i.descripcion || "Incidencia",
        categoria: i.categoria,
        resolucion: i.resolucion || i.observaciones || "Sin observaciones.",
        estado: i.categoria === "urea" || i.categoria === "llanta_danada" ? "Cerrada" : estadoRegistro(i.estado),
        operador: i.operador?.nombre ?? "—",
        atendio: i.atendio ?? "—",
        lugar: i.ubicacion || "—",
        lectura: "—",
        falla: i.descripcion || "—",
        costo: 0,
        ordenId: null,
        tipo: "incidencia",
      });
    }
    for (const r of urea) filas.push({
      key: `urea-${r.id}`,
      fecha: r.fecha,
      folio: null,
      titulo: `${Number(r.litros).toLocaleString("es-MX", { maximumFractionDigits: 1 })} L de urea`,
      categoria: "Urea",
      resolucion: r.observaciones || "Carga registrada.",
      estado: "Cerrada",
      operador: r.operadorNombre ?? "—",
      atendio: "—",
      lugar: "Carga de urea",
      lectura: "—",
      falla: `${Number(r.litros).toLocaleString("es-MX")} L UREA`,
      costo: 0,
      ordenId: null,
      tipo: "urea",
    });
    return filas.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [ordenes, incidencias, urea]);

  const refacciones = ordenes.reduce((total, o) => total + o.refacciones.length, 0);
  const activos = registros.filter((r) => ["Abierta", "En reparación"].includes(r.estado)).length;
  const registrosVisibles = registros.filter((r) => {
    if (filtro === "activos") return ["Abierta", "En reparación"].includes(r.estado);
    if (filtro === "refacciones") return r.tipo === "orden" && (ordenes.find((o) => o.id === r.ordenId)?.refacciones.length ?? 0) > 0;
    if (filtro === "urea") return r.tipo === "urea";
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Expediente completo de esta unidad.</p>
        {canOpen && <Link href="/taller/nueva" className="text-xs font-semibold underline">Nueva orden</Link>}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {([
          ["historial", "Historial completo", registros.length],
          ["activos", "Activos", activos],
          ["refacciones", "Refacciones", refacciones],
          ["urea", "Urea", urea.length],
        ] as [FiltroExpediente, string, number][]).map(([key, label, count]) => <button key={key} type="button" onClick={() => setFiltro(key)} aria-pressed={filtro === key} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filtro === key ? "border-neutral-800 bg-neutral-800 text-white" : ""}`} style={filtro !== key ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}>{label} <span className="opacity-70">{count}</span></button>)}
      </div>

      {registrosVisibles.length ? <div className="divide-y rounded-lg border px-3" style={{ borderColor: "var(--border)" }}>
        {registrosVisibles.map((r) => {
          const orden = r.ordenId ? ordenes.find((o) => o.id === r.ordenId) : undefined;
          const fotos = orden ? fotosDeOrden(orden.checklist) : [];
          return <article key={r.key} className="py-3" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-start gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>{formatFechaHoraMx(r.fecha)} · {r.folio != null ? <span className="text-[#207783]">{formatoFolioTaller(r.folio)} · </span> : null}{r.categoria}</p>
                  {r.ordenId && <Link href={`/taller/${r.ordenId}`} aria-label="Ir a la orden de servicio" title="Ir a la orden de servicio" className="rounded-md p-1.5 text-indigo-600 hover:bg-[var(--surface-2)]"><ExternalLink className="h-4 w-4" /></Link>}
                </div>
                <p className="mt-1 text-sm font-semibold">{r.titulo}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--fg-muted)" }}><span className="font-semibold">Resolución:</span> {r.resolucion}</p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--fg-muted)" }}>{r.operador !== "—" ? `Operador: ${r.operador} · ` : ""}Lugar: {r.lugar}{r.lectura !== "—" ? ` · ${r.lectura}` : ""}{r.costo > 0 ? ` · Refacciones: ${r.costo.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 })}` : ""}</p>
                {fotos.length > 0 && <div className="mt-2 flex gap-2">{fotos.map((foto) => <FotoLightbox key={foto.key} foto={foto} />)}</div>}
              </div>
            </div>
          </article>;
        })}
      </div> : <p className="rounded-xl border py-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>No hay registros en esta vista.</p>}
    </div>
  );
}
