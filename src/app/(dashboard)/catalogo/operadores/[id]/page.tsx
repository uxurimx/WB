export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { operadores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/server-guard";
import { getCatalogoCargas, getOperadores, getObras } from "@/app/actions/catalogo";
import { Badge } from "@/components/ui/badge";
import CatalogoDetalleClient from "@/components/catalogo/CatalogoDetalleClient";
import { CatalogDetalleHeader, MobileStatStrip } from "@/components/ui/mobile-list";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];
const TIPO_LABELS: Record<string, string> = {
  chofer: "Chofer", maquinista: "Maquinista", taller: "Taller",
};

export default async function OperadorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("catalogo");
  const { id } = await params;
  const operadorId = parseInt(id);
  if (isNaN(operadorId)) notFound();

  const [operador, clerkUser] = await Promise.all([
    db.query.operadores.findFirst({ where: eq(operadores.id, operadorId) }),
    currentUser(),
  ]);
  if (!operador) notFound();

  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

  const [cargas, operadoresList, obrasList] = await Promise.all([
    getCatalogoCargas("operador", operadorId),
    getOperadores(false),
    getObras(false),
  ]);
  const litros = cargas.reduce((s, c) => s + (c.litros ?? 0), 0);
  const unidadesN = new Set(cargas.map((c) => c.unidadCodigo).filter(Boolean)).size;
  const litrosLabel = `${Math.round(litros).toLocaleString("es-MX")} L`;

  return (
    <div className="p-4 md:p-8 max-w-[1536px]">
      <CatalogDetalleHeader
        backHref="/catalogo/operadores"
        backLabel="Operadores"
        eyebrow="Catálogo · Operador"
        title={operador.nombre}
        subtitle={operador.telefono ? (
          <p className="mt-0.5 text-sm" style={{ color: "var(--fg-muted)" }}>{operador.telefono}</p>
        ) : undefined}
        badges={
          <>
            <Badge variant="secondary">
              {TIPO_LABELS[operador.tipo] ?? operador.tipo}
            </Badge>
            <Badge variant={operador.activo ? "success" : "secondary"}>
              {operador.activo ? "Activo" : "Inactivo"}
            </Badge>
          </>
        }
      />

      <MobileStatStrip
        className="mb-3"
        items={[
          { key: "diesel", label: "Diesel", value: litrosLabel },
          { key: "cargas", label: "Cargas", value: String(cargas.length) },
          { key: "unidades", label: "Unid.", value: String(unidadesN) },
        ]}
      />

      <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Diesel", value: litrosLabel },
          { label: "Cargas", value: String(cargas.length) },
          { label: "Unidades", value: String(unidadesN) },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border px-3 py-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{k.label}</p>
            <p className="font-outfit font-bold text-lg mt-0.5" style={{ color: "var(--fg)" }}>{k.value}</p>
          </div>
        ))}
      </div>

      <CatalogoDetalleClient
        tipo="operador"
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
