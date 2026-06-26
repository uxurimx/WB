export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { obras } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/server-guard";
import { getCatalogoCargas, getOperadores, getObras } from "@/app/actions/catalogo";
import { Badge } from "@/components/ui/badge";
import CatalogoDetalleClient from "@/components/catalogo/CatalogoDetalleClient";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

export default async function ObraDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("catalogo");
  const { id } = await params;
  const obraId = parseInt(id);
  if (isNaN(obraId)) notFound();

  const [obra, clerkUser] = await Promise.all([
    db.query.obras.findFirst({ where: eq(obras.id, obraId) }),
    currentUser(),
  ]);
  if (!obra) notFound();

  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

  const [cargas, operadoresList, obrasList] = await Promise.all([
    getCatalogoCargas("obra", obraId),
    getOperadores(false),
    getObras(false),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-[1536px]">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/catalogo/obras"
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-500 transition-colors"
          style={{ color: "var(--fg-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Obras
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>
              Catálogo · Obra
            </p>
            <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
              {obra.nombre}
            </h1>
            {obra.cliente && (
              <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
                {obra.cliente}
              </p>
            )}
            {obra.fechaInicio && (
              <p className="mt-0.5 text-xs font-mono" style={{ color: "var(--fg-muted)" }}>
                Inicio: {obra.fechaInicio}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant={obra.activo ? "success" : "secondary"}>
              {obra.activo ? "Activa" : "Terminada"}
            </Badge>
          </div>
        </div>
      </div>

      <CatalogoDetalleClient
        tipo="obra"
        cargas={cargas}
        rends={null}
        fotos={null}
        audits={null}
        operadores={operadoresList.map((o) => ({ id: o.id, nombre: o.nombre }))}
        obras={obrasList.map((o) => ({ id: o.id, nombre: o.nombre }))}
        canEdit={canEdit}
      />
    </div>
  );
}
