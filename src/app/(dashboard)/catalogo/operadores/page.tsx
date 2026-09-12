export const dynamic = 'force-dynamic';

import { currentUser } from "@clerk/nextjs/server";
import { getOperadoresConStats } from "@/app/actions/catalogo";
import { requirePermission } from "@/lib/server-guard";
import OperadoresTable from "@/components/catalogo/OperadoresTable";
import { CatalogPageHeader } from "@/components/ui/mobile-list";
import { Users } from "lucide-react";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

export default async function OperadoresPage() {
  await requirePermission("catalogo");

  const [operadores, clerkUser] = await Promise.all([getOperadoresConStats(), currentUser()]);
  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

  const activos = operadores.filter((o) => o.activo).length;

  return (
    <div className="p-4 md:p-8 max-w-[1536px]">
      <CatalogPageHeader
        icon={Users}
        title="Operadores"
        meta={`${activos} de ${operadores.length} activos`}
        description={`Choferes y maquinistas. ${activos} activos de ${operadores.length} totales.`}
      />
      <OperadoresTable operadores={operadores} canEdit={canEdit} />
    </div>
  );
}
