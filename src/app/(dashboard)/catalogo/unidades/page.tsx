export const dynamic = 'force-dynamic';

import { currentUser } from "@clerk/nextjs/server";
import { getUnidadesConStats } from "@/app/actions/catalogo";
import { requirePermission } from "@/lib/server-guard";
import UnidadesTable from "@/components/catalogo/UnidadesTable";
import { CatalogPageHeader } from "@/components/ui/mobile-list";
import { Truck } from "lucide-react";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];
const MAINTENANCE_ROLES = ["admin", "gerente"];

export default async function UnidadesPage() {
  await requirePermission("catalogo");

  const [unidades, clerkUser] = await Promise.all([getUnidadesConStats(), currentUser()]);
  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);
  const canManageMaintenance = MAINTENANCE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

  const activas = unidades.filter((u) => u.activo).length;

  return (
    <div className="p-4 md:p-8 max-w-[1536px]">
      <CatalogPageHeader
        icon={Truck}
        title="Unidades"
        meta={`${activas} de ${unidades.length} activos`}
        description={`Camiones, maquinaria y vehículos del sistema. ${activas} activos de ${unidades.length} totales.`}
      />
      <UnidadesTable unidades={unidades} canEdit={canEdit} canManageMaintenance={canManageMaintenance} />
    </div>
  );
}
