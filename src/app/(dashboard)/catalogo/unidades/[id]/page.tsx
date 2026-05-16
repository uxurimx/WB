export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { unidades } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/server-guard";
import { getCatalogoCargas, getOperadores, getObras } from "@/app/actions/catalogo";
import { getRendimientosUnidad } from "@/app/actions/rendimientos";
import { getArchivosUnidad } from "@/app/actions/archivos";
import { getAuditLogCargasUnidad } from "@/app/actions/cargas";
import { Badge } from "@/components/ui/badge";
import CatalogoDetalleClient from "@/components/catalogo/CatalogoDetalleClient";

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

  const [cargas, rends, fotos, audits, operadores, obras] = await Promise.all([
    getCatalogoCargas("unidad", unidadId),
    getRendimientosUnidad(unidadId),
    getArchivosUnidad(unidadId),
    getAuditLogCargasUnidad(unidadId),
    getOperadores(false),
    getObras(false),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/catalogo/unidades"
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-500 transition-colors"
          style={{ color: "var(--fg-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Unidades
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>
              Catálogo · Unidad
            </p>
            <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
              {unidad.codigo}
            </h1>
            {(unidad.nombre || unidad.modelo) && (
              <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
                {unidad.nombre ?? ""}{unidad.nombre && unidad.modelo ? " · " : ""}{unidad.modelo ?? ""}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={TIPO_VARIANT[unidad.tipo] ?? "secondary"}>
              {TIPO_LABELS[unidad.tipo] ?? unidad.tipo}
            </Badge>
            <Badge variant={unidad.activo ? "success" : "secondary"}>
              {unidad.activo ? "Activa" : "Inactiva"}
            </Badge>
          </div>
        </div>

        {/* Mini-stats */}
        <div className="mt-4 flex gap-4 flex-wrap">
          {unidad.rendimientoReferencia !== null && (
            <div className="text-xs" style={{ color: "var(--fg-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--fg)" }}>
                {unidad.rendimientoReferencia}
              </span>{" "}
              {unidad.tipo === "maquina" ? "L/Hr ref." : "km/L ref."}
            </div>
          )}
          {unidad.capacidadTanque !== null && (
            <div className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Cap. tanque:{" "}
              <span className="font-semibold" style={{ color: "var(--fg)" }}>
                {unidad.capacidadTanque} L
              </span>
            </div>
          )}
        </div>
      </div>

      <CatalogoDetalleClient
        tipo="unidad"
        cargas={cargas}
        rends={rends}
        fotos={fotos}
        audits={audits}
        operadores={operadores.map((o) => ({ id: o.id, nombre: o.nombre }))}
        obras={obras.map((o) => ({ id: o.id, nombre: o.nombre }))}
        canEdit={canEdit}
      />
    </div>
  );
}
