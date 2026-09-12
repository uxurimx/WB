export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { requirePermission } from "@/lib/server-guard";
import { getOrdenTaller, getUnidadesYOperadoresTaller } from "@/app/actions/taller";
import { MANAGE_ROLES } from "@/lib/authz";
import OrdenDetalleForm from "@/components/taller/OrdenDetalleForm";

export default async function TallerOrdenPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("taller");
  const { id } = await params;
  const ordenId = parseInt(id, 10);
  if (Number.isNaN(ordenId)) notFound();

  const [orden, catalogos, clerkUser] = await Promise.all([
    getOrdenTaller(ordenId),
    getUnidadesYOperadoresTaller(),
    currentUser(),
  ]);
  if (!orden) notFound();

  const canCerrar = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <Link
        href="/taller"
        className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-500"
        style={{ color: "var(--fg-muted)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Órdenes
      </Link>
      <OrdenDetalleForm
        orden={JSON.parse(JSON.stringify(orden))}
        operadores={catalogos.operadores}
        canCerrar={canCerrar}
      />
    </div>
  );
}
