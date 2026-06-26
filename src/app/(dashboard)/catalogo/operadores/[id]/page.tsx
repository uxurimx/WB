export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { operadores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requirePermission } from "@/lib/server-guard";
import { getCatalogoCargas, getOperadores, getObras } from "@/app/actions/catalogo";
import { Badge } from "@/components/ui/badge";
import CatalogoDetalleClient from "@/components/catalogo/CatalogoDetalleClient";

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

  return (
    <div className="p-6 md:p-8 max-w-[1536px]">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/catalogo/operadores"
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-500 transition-colors"
          style={{ color: "var(--fg-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Operadores
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--fg-muted)" }}>
              Catálogo · Operador
            </p>
            <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
              {operador.nombre}
            </h1>
            {operador.telefono && (
              <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
                {operador.telefono}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">
              {TIPO_LABELS[operador.tipo] ?? operador.tipo}
            </Badge>
            <Badge variant={operador.activo ? "success" : "secondary"}>
              {operador.activo ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      <CatalogoDetalleClient
        tipo="operador"
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
