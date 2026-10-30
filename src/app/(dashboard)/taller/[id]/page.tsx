export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import { getOrdenTaller, getUnidadesYOperadoresTaller, getRefaccionesSugeridas } from "@/app/actions/taller";
import { getResumenMantenimientoUnidad } from "@/app/actions/mantenimiento";
import OrdenDetalleForm from "@/components/taller/OrdenDetalleForm";

export default async function TallerOrdenPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [permisos, clerkUser] = await Promise.all([requirePermission("taller"), currentUser()]);
  const isTallerRole = clerkUser?.publicMetadata?.role === "taller";
  const email = clerkUser?.primaryEmailAddress?.emailAddress.trim().toLocaleLowerCase("en-US");
  const canReopenOrders = email === "wbtaller.beto@gmail.com" || email === "poxelbit@gmail.com";
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const ordenId = parseInt(id, 10);
  if (Number.isNaN(ordenId)) notFound();

  const [orden, catalogos, sugeridas] = await Promise.all([
    getOrdenTaller(ordenId),
    getUnidadesYOperadoresTaller(),
    getRefaccionesSugeridas(),
  ]);
  if (!orden) notFound();
  const resumenMantenimiento = await getResumenMantenimientoUnidad(orden.unidadId);
  const tipoMantenimiento = orden.tipoControlPreventivo === "hrs" || (!orden.tipoControlPreventivo && orden.unidad?.tipo === "maquina") ? "hrs" : "km";
  const planMantenimiento = resumenMantenimiento?.planes.find((plan) => plan.tipoControl === tipoMantenimiento);
  const intervaloMantenimiento = planMantenimiento?.activo ? planMantenimiento.intervalo : null;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <Link
        href="/taller/ordenes"
        className="print:hidden flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-500"
        style={{ color: "var(--fg-muted)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Órdenes
      </Link>
      <OrdenDetalleForm
        orden={JSON.parse(JSON.stringify(orden))}
        operadores={catalogos.operadores}
        sugeridas={sugeridas}
        initialTab={q.tab === "ingreso" ? "ingreso" : "datos"}
        canFinishOrders={permisos.includes("taller.terminar")}
        canCloseOrders={permisos.includes("taller.cerrar")}
        canCancelOrders={permisos.includes("taller.cancelar")}
        canReopenOrders={canReopenOrders}
        isTallerRole={isTallerRole}
        intervaloMantenimiento={intervaloMantenimiento}
      />
    </div>
  );
}
