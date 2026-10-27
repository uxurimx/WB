export const dynamic = "force-dynamic";

import { Wrench } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import { getNowLocal } from "@/lib/date-utils";
import {
  getOrdenesTaller,
  getServiciosProgramadosTaller,
  getUnidadesYOperadoresTaller,
  getIncidenciasTaller,
  getIncidenciasActivasTaller,
  getBitacoraGeneralTaller,
} from "@/app/actions/taller";
import TallerBoard from "@/components/taller/TallerBoard";

export default async function TallerOrdenesPage() {
  const permisos = await requirePermission("taller");
  const mes = getNowLocal().fecha.slice(0, 7);
  const [ordenes, programados, catalogos] = await Promise.all([
    getOrdenesTaller(), getServiciosProgramadosTaller(), getUnidadesYOperadoresTaller(),
  ]);
  const [incidencias, incidenciasActivas, eventos] = await Promise.all([
    getIncidenciasTaller(mes).catch(() => []),
    getIncidenciasActivasTaller().catch(() => []),
    permisos.includes("taller.bitacora") ? getBitacoraGeneralTaller() : Promise.resolve([]),
  ]);

  return <div className="p-4 sm:p-6 md:p-8 max-w-[1536px]">
    <div className="mb-6 flex items-center gap-3"><div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-1.5"><Wrench className="h-4 w-4 text-amber-600" /></div><div><p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>Taller</p><h1 className="font-outfit text-3xl font-bold" style={{ color: "var(--fg)" }}>Órdenes de servicio</h1></div></div>
    <TallerBoard ordenes={ordenes} programados={programados} unidades={catalogos.unidades} operadores={catalogos.operadores} incidencias={incidencias} incidenciasActivas={incidenciasActivas} eventos={eventos} canViewBitacora={permisos.includes("taller.bitacora")} canFinishOrders={permisos.includes("taller.terminar")} canCloseOrders={permisos.includes("taller.cerrar")} canCancelOrders={permisos.includes("taller.cancelar")} initialMes={mes} initialSeccion="ordenes" />
  </div>;
}
