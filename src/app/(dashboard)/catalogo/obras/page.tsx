export const dynamic = 'force-dynamic';

import { getObras } from "@/app/actions/catalogo";
import ObrasTable from "@/components/catalogo/ObrasTable";
import { HardHat } from "lucide-react";

export default async function ObrasPage() {
  const obras = await getObras(false);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <HardHat className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Catálogos
          </p>
        </div>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Obras
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Proyectos activos. {obras.filter(o => o.activo).length} activas de {obras.length} totales.
        </p>
      </div>
      <ObrasTable obras={obras} />
    </div>
  );
}
