export const dynamic = 'force-dynamic';

import { currentUser } from "@clerk/nextjs/server";
import { getObrasConStats } from "@/app/actions/catalogo";
import { requirePermission } from "@/lib/server-guard";
import ObrasTable from "@/components/catalogo/ObrasTable";
import { CatalogPageHeader } from "@/components/ui/mobile-list";
import { HardHat } from "lucide-react";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

export default async function ObrasPage() {
  await requirePermission("catalogo");

  const [obras, clerkUser] = await Promise.all([getObrasConStats(), currentUser()]);
  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

  const activas = obras.filter((o) => o.activo).length;

  return (
    <div className="p-4 md:p-8 max-w-[1536px]">
      <CatalogPageHeader
        icon={HardHat}
        title="Obras"
        meta={`${activas} de ${obras.length} activas`}
        description={`Proyectos activos. ${activas} activas de ${obras.length} totales.`}
      />
      <ObrasTable obras={obras} canEdit={canEdit} />
    </div>
  );
}
