export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { unidades } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/server-guard";
import { getCatalogoCargas, getOperadores, getObras } from "@/app/actions/catalogo";
import { getRendimientosUnidad } from "@/app/actions/rendimientos";
import { getArchivosUnidad } from "@/app/actions/archivos";
import { getAuditLogCargasUnidad } from "@/app/actions/cargas";
import {
  getEventosMantenimientoUnidad,
  getResumenMantenimientoUnidad,
} from "@/app/actions/mantenimiento";
import { getOdometroResetsUnidad } from "@/app/actions/cargas";
import { getOrdenesUnidad } from "@/app/actions/taller";
import { Badge } from "@/components/ui/badge";
import CatalogoDetalleClient from "@/components/catalogo/CatalogoDetalleClient";
import { CatalogDetalleHeader } from "@/components/ui/mobile-list";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];
const TIPO_LABELS: Record<string, string> = {
  camion: "Camión", maquina: "Maquinaria", nissan: "NISSAN", otro: "Otro",
};
const TIPO_VARIANT: Record<string, "default" | "success" | "warning" | "secondary"> = {
  camion: "default", maquina: "warning", nissan: "success", otro: "secondary",
};

export default async function UnidadDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("catalogo");
  const { id } = await params;
  const unidadId = parseInt(id);
  if (isNaN(unidadId)) notFound();

  const [unidad, clerkUser] = await Promise.all([
    db.query.unidades.findFirst({ where: eq(unidades.id, unidadId) }),
    currentUser(),
  ]);
  if (!unidad) notFound();

  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);
  const canManageMaintenance = canEdit;

  const [cargas, rends, fotos, audits, operadores, obras, mantenimientoResumen, mantenimientoEventos, odometroResets, ordenesTaller] = await Promise.all([
    getCatalogoCargas("unidad", unidadId),
    getRendimientosUnidad(unidadId),
    getArchivosUnidad(unidadId),
    getAuditLogCargasUnidad(unidadId),
    getOperadores(false),
    getObras(false),
    getResumenMantenimientoUnidad(unidadId),
    getEventosMantenimientoUnidad(unidadId),
    getOdometroResetsUnidad(unidadId),
    getOrdenesUnidad(unidadId),
  ]);

  const nombreModelo = [unidad.nombre, unidad.modelo].filter(Boolean).join(" · ");
  const miniStats = [
    unidad.rendimientoReferencia != null
      ? `${unidad.rendimientoReferencia} ${unidad.tipo === "maquina" ? "L/Hr ref." : "km/L ref."}`
      : null,
    unidad.capacidadTanque != null ? `Cap. ${unidad.capacidadTanque} L` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="p-4 md:p-8 max-w-[1536px]">
      <CatalogDetalleHeader
        backHref="/catalogo/unidades"
        backLabel="Unidades"
        eyebrow="Catálogo · Unidad"
        title={unidad.codigo}
        subtitle={(nombreModelo || miniStats) ? (
          <>
            {nombreModelo && (
              <p className="mt-0.5 text-sm truncate" style={{ color: "var(--fg-muted)" }}>{nombreModelo}</p>
            )}
            {miniStats && (
              <p className="mt-0.5 text-xs" style={{ color: "var(--fg-muted)" }}>{miniStats}</p>
            )}
          </>
        ) : undefined}
        badges={
          <>
            <Badge variant={TIPO_VARIANT[unidad.tipo] ?? "secondary"}>
              {TIPO_LABELS[unidad.tipo] ?? unidad.tipo}
            </Badge>
            <Badge variant={unidad.activo ? "success" : "secondary"}>
              {unidad.activo ? "Activa" : "Inactiva"}
            </Badge>
          </>
        }
      />

      <CatalogoDetalleClient
        tipo="unidad"
        unidadId={unidad.id}
        unidadTipo={unidad.tipo}
        cargas={cargas}
        rends={rends}
        fotos={fotos}
        audits={audits}
        mantenimientoResumen={mantenimientoResumen}
        mantenimientoEventos={mantenimientoEventos}
        operadores={operadores.map((o) => ({ id: o.id, nombre: o.nombre }))}
        obras={obras.map((o) => ({ id: o.id, nombre: o.nombre }))}
        canEdit={canEdit}
        canManageMaintenance={canManageMaintenance}
        odometroActual={unidad.odometroActual}
        odometroOffset={unidad.odometroOffset}
        odometroResets={odometroResets.map((r) => ({
          id: r.id,
          fecha: r.fecha,
          lecturaAnterior: r.lecturaAnterior,
          lecturaNueva: r.lecturaNueva,
          notas: r.notas,
        }))}
        ordenesTaller={ordenesTaller.map((o) => ({
          id: o.id,
          fecha: o.fecha,
          createdAt: o.createdAt?.toISOString() ?? null,
          kmHrs: o.kmHrs,
          motivo: o.motivo,
          estado: o.estado,
          quienAtendio: o.quienAtendio,
          operador: o.operador,
          refacciones: o.refacciones.map((r) => ({
            precio: r.precio,
            cantidad: r.cantidad,
            iva: r.iva,
          })),
          checklist: o.checklist.map((c) => ({ clave: c.clave, fotos: c.fotos })),
        }))}
      />
    </div>
  );
}
