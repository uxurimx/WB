export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { obras } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/server-guard";
import { getCatalogoCargas, getLastPrecioLitro, getOperadores, getObras } from "@/app/actions/catalogo";
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

  const [cargas, operadoresList, obrasList, precioLitro] = await Promise.all([
    getCatalogoCargas("obra", obraId),
    getOperadores(false),
    getObras(false),
    getLastPrecioLitro(),
  ]);

  const litros = cargas.reduce((s, c) => s + (c.litros ?? 0), 0);
  const costo = precioLitro != null ? litros * precioLitro : null;
  const unidadesN = new Set(cargas.map((c) => c.unidadCodigo).filter(Boolean)).size;
  const ultima = cargas[0]?.fecha ?? null;

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Diesel (campo)", value: `${Math.round(litros).toLocaleString("es-MX")} L` },
          { label: "Costo est.", value: costo != null ? costo.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }) : "—" },
          { label: "Cargas", value: String(cargas.length) },
          { label: "Unidades", value: String(unidadesN) },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border px-3 py-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{k.label}</p>
            <p className="font-outfit font-bold text-lg mt-0.5" style={{ color: "var(--fg)" }}>{k.value}</p>
          </div>
        ))}
      </div>
      {ultima && (
        <p className="text-xs mb-4 -mt-3" style={{ color: "var(--fg-muted)" }}>
          Última carga {ultima.slice(0, 10)}
          {precioLitro != null && ` · precio pipa ${precioLitro.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}/L`}
          . Solo incluye despachos de NISSAN con esta obra.
        </p>
      )}

      <CatalogoDetalleClient
        tipo="obra"
        cargas={cargas}
        rends={null}
        fotos={null}
        audits={null}
        mantenimientoResumen={null}
        mantenimientoEventos={[]}
        operadores={operadoresList.map((o) => ({ id: o.id, nombre: o.nombre }))}
        obras={obrasList.map((o) => ({ id: o.id, nombre: o.nombre }))}
        canEdit={canEdit}
        canManageMaintenance={false}
      />
    </div>
  );
}
