import { getUnidades } from "@/app/actions/catalogo";
import UnidadesTable from "@/components/catalogo/UnidadesTable";
import { Truck } from "lucide-react";

export default async function UnidadesPage() {
  const unidades = await getUnidades(false); // incluye inactivas

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Truck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Catálogos
          </p>
        </div>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Unidades
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Camiones, maquinaria y vehículos del sistema. {unidades.filter(u => u.activo).length} activos de {unidades.length} totales.
        </p>
      </div>
      <UnidadesTable unidades={unidades} />
    </div>
  );
}
