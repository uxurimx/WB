export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import { getOrdenTaller, getUnidadesYOperadoresTaller, getRefaccionesSugeridas } from "@/app/actions/taller";
import OrdenDetalleForm from "@/components/taller/OrdenDetalleForm";

export default async function TallerOrdenPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  await requirePermission("taller");
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const ordenId = parseInt(id, 10);
  if (Number.isNaN(ordenId)) notFound();

  const [orden, catalogos, sugeridas] = await Promise.all([
    getOrdenTaller(ordenId),
    getUnidadesYOperadoresTaller(),
    getRefaccionesSugeridas(),
  ]);
  if (!orden) notFound();

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <Link
        href="/taller/ordenes"
        className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-500"
        style={{ color: "var(--fg-muted)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Órdenes
      </Link>
      <OrdenDetalleForm
        orden={JSON.parse(JSON.stringify(orden))}
        operadores={catalogos.operadores}
        sugeridas={sugeridas}
        initialTab={q.tab === "ingreso" ? "ingreso" : "datos"}
      />
    </div>
  );
}
