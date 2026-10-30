export const dynamic = "force-dynamic";

import { requirePermission } from "@/lib/server-guard";
import { currentUser } from "@clerk/nextjs/server";
import { getNowLocal } from "@/lib/date-utils";
import {
  getOrdenesTaller,
  getServiciosProgramadosTaller,
  getUnidadesYOperadoresTaller,
  getIncidenciasTaller,
  getIncidenciasActivasTaller,
  getBitacoraGeneralTaller,
  getUreaTaller,
} from "@/app/actions/taller";
import TallerBoard from "@/components/taller/TallerBoard";

export default async function TallerBitacoraPage() {
  const [permisos, user] = await Promise.all([requirePermission("taller.bitacora"), currentUser()]);
  const email = user?.primaryEmailAddress?.emailAddress.trim().toLocaleLowerCase("en-US");
  const canReopenOrders = email === "wbtaller.beto@gmail.com" || email === "poxelbit@gmail.com";
  const mes = getNowLocal().fecha.slice(0, 7);
  const [ordenes, programados, catalogos] = await Promise.all([
    getOrdenesTaller(), getServiciosProgramadosTaller(), getUnidadesYOperadoresTaller(),
  ]);
  const [incidenciasResult, incidenciasActivas, eventos, ureaResult] = await Promise.all([
    getIncidenciasTaller({ desde: `${mes}-01`, hasta: getNowLocal().fecha }).then((items) => ({ items, schemaReady: true as const })).catch(() => ({ items: [], schemaReady: false as const })),
    getIncidenciasActivasTaller().catch(() => []),
    getBitacoraGeneralTaller(),
    getUreaTaller().then((items) => ({ items, schemaReady: true as const })).catch(() => ({ items: [], schemaReady: false as const })),
  ]);

  return <div className="max-w-[1536px] p-3 sm:p-4 md:p-5">
    <TallerBoard ordenes={ordenes} programados={programados} unidades={catalogos.unidades} operadores={catalogos.operadores} incidencias={incidenciasResult.items} incidenciasActivas={incidenciasActivas} eventos={eventos} urea={ureaResult.items} extensionReady={incidenciasResult.schemaReady} ureaReady={ureaResult.schemaReady} canViewBitacora={true} canFinishOrders={permisos.includes("taller.terminar")} canCloseOrders={permisos.includes("taller.cerrar")} canCancelOrders={permisos.includes("taller.cancelar")} canReopenOrders={canReopenOrders} initialMes={mes} initialSeccion="bitacora" />
  </div>;
}
