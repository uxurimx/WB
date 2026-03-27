export const dynamic = 'force-dynamic';

import { currentUser } from "@clerk/nextjs/server";
import { getOperadores } from "@/app/actions/catalogo";
import OperadoresTable from "@/components/catalogo/OperadoresTable";
import { Users } from "lucide-react";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

export default async function OperadoresPage() {
  const [operadores, clerkUser] = await Promise.all([getOperadores(false), currentUser()]);
  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Catálogos
          </p>
        </div>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Operadores
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Choferes y maquinistas. {operadores.filter(o => o.activo).length} activos de {operadores.length} totales.
        </p>
      </div>
      <OperadoresTable operadores={operadores} canEdit={canEdit} />
    </div>
  );
}
