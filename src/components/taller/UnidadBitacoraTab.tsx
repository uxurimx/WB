import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ESTADO_LABEL, type EstadoOrden } from "@/lib/taller-checklist";
import { formatFechaHoraMx } from "@/lib/date-utils";
import FotoLightbox, { type TallerFoto } from "@/components/taller/FotoLightbox";

type Orden = {
  id: number;
  fecha: string;
  createdAt: string | Date | null;
  kmHrs: number | null;
  motivo: string | null;
  estado: string;
  quienAtendio: string | null;
  operador: { nombre: string } | null;
  refacciones: { precio: number | null; cantidad: number | null; iva: boolean }[];
  checklist: { clave: string; fotos: string | null }[];
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

export default function UnidadBitacoraTab({
  ordenes,
  canOpen,
}: {
  unidadId: number;
  ordenes: Orden[];
  canOpen: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Visitas a taller de esta unidad.
        </p>
        {canOpen && (
          <Link href={`/taller/nueva`} className="text-xs font-semibold underline">
            Nueva orden
          </Link>
        )}
      </div>
      {ordenes.length === 0 ? (
        <p className="text-sm py-8 text-center rounded-2xl border" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
          Aún no hay visitas. {canOpen ? "Ábrela desde Taller cuando entre al patio." : ""}
        </p>
      ) : (
        <ul className="space-y-2">
          {ordenes.map((o) => {
            const c = costo(o.refacciones);
            const fotos = fotosDeOrden(o.checklist);
            return (
              <li key={o.id} className="rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <Link
                  href={`/taller/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 hover:bg-[var(--surface-2)]"
                >
                  <div>
                    <p className="text-sm font-medium">{o.motivo || "Sin motivo"}</p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
                      {formatFechaHoraMx(o.fecha, o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt)}
                      {o.kmHrs != null ? ` · ${Math.round(o.kmHrs).toLocaleString("es-MX")} km/hrs` : ""}
                      {o.operador?.nombre ? ` · ${o.operador.nombre}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c > 0 && (
                      <span className="text-xs font-mono">
                        {c.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })}
                      </span>
                    )}
                    <Badge variant={o.estado === "cerrada" ? "success" : o.estado === "abierta" ? "warning" : "secondary"}>
                      {ESTADO_LABEL[o.estado as EstadoOrden] ?? o.estado}
                    </Badge>
                  </div>
                </Link>
                {fotos.length > 0 && (
                  <div className="flex gap-2 border-t px-3 py-2" style={{ borderColor: "var(--border)" }}>
                    {fotos.map((foto) => (
                      <FotoLightbox key={foto.key} foto={foto} />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
