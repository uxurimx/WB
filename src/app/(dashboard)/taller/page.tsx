export const dynamic = "force-dynamic";

import { requirePermission } from "@/lib/server-guard";
import { currentUser } from "@clerk/nextjs/server";
import { MANAGE_ROLES } from "@/lib/authz";
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

export default async function TallerPage({
  searchParams,
}: {
  searchParams: Promise<{ nueva?: string; unidadId?: string; preventivo?: string; mes?: string }>;
}) {
  const permisos = await requirePermission("taller");
  const [q, user] = await Promise.all([searchParams, currentUser()]);
  const email = user?.primaryEmailAddress?.emailAddress.trim().toLocaleLowerCase("en-US");
  const canReopenOrders = email === "wbtaller.beto@gmail.com" || email === "poxelbit@gmail.com";
  const mesActivo = /^\d{4}-(0[1-9]|1[0-2])$/.test(q.mes ?? "") ? q.mes! : getNowLocal().fecha.slice(0, 7);
  const [ordenes, programados, catalogos] = await Promise.all([
    getOrdenesTaller(),
    getServiciosProgramadosTaller(),
    getUnidadesYOperadoresTaller(),
  ]);
  const [incidenciasResult, incidenciasActivasResult, eventos, ureaResult] = await Promise.all([
    getIncidenciasTaller({ desde: `${getNowLocal().fecha.slice(0, 7)}-01`, hasta: getNowLocal().fecha }).then((items) => ({ items, schemaReady: true as const }))
      .catch(() => ({ items: [], schemaReady: false as const })),
    getIncidenciasActivasTaller().catch(() => []),
    permisos.includes("taller.bitacora") ? getBitacoraGeneralTaller() : Promise.resolve([]),
    getUreaTaller().then((items) => ({ items, schemaReady: true as const }))
      .catch(() => ({ items: [], schemaReady: false as const })),
  ]);

  const abiertas = ordenes.filter((o) => ["abierta", "en_proceso", "terminada"].includes(o.estado)).length;

  return (
    <div className="max-w-[1536px] p-3 sm:p-4 md:p-5">
      <TallerBoard
        ordenes={ordenes}
        programados={programados}
        unidades={catalogos.unidades}
        operadores={catalogos.operadores}
        incidencias={incidenciasResult.items}
        incidenciasActivas={incidenciasActivasResult}
        eventos={eventos}
        urea={ureaResult.items}
        ureaReady={ureaResult.schemaReady}
        canViewExpediente={MANAGE_ROLES.includes(user?.publicMetadata?.role as string)}
        canViewBitacora={permisos.includes("taller.bitacora")}
        canFinishOrders={permisos.includes("taller.terminar")}
        canCloseOrders={permisos.includes("taller.cerrar")}
        canCancelOrders={permisos.includes("taller.cancelar")}
        canReopenOrders={canReopenOrders}
        extensionReady={incidenciasResult.schemaReady}
        initialNueva={q.nueva === "1"}
        initialUnidadId={q.unidadId ?? ""}
        initialPreventivo={q.preventivo === "hrs" ? "hrs" : q.preventivo === "km" ? "km" : null}
        initialMes={mesActivo}
        initialSeccion="tablero"
        unidadesEnTaller={abiertas}
      />
    </div>
  );
}
