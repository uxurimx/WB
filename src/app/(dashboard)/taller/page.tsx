export const dynamic = "force-dynamic";

import { Wrench } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import {
  getOrdenesTaller,
  getServiciosProgramadosTaller,
  getUnidadesYOperadoresTaller,
} from "@/app/actions/taller";
import TallerBoard from "@/components/taller/TallerBoard";

export default async function TallerPage({
  searchParams,
}: {
  searchParams: Promise<{ nueva?: string; unidadId?: string; preventivo?: string }>;
}) {
  await requirePermission("taller");
  const q = await searchParams;
  const [ordenes, programados, catalogos] = await Promise.all([
    getOrdenesTaller(),
    getServiciosProgramadosTaller(),
    getUnidadesYOperadoresTaller(),
  ]);

  const abiertas = ordenes.filter((o) => o.estado === "abierta" || o.estado === "en_proceso").length;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1536px]">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Taller
          </p>
        </div>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Órdenes
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          {abiertas > 0
            ? `${abiertas} en patio`
            : "Nueva orden: solo unidad y motivo. Checklist y piezas al entrar."}
        </p>
      </div>
      <TallerBoard
        ordenes={ordenes}
        programados={programados}
        unidades={catalogos.unidades}
        operadores={catalogos.operadores}
        initialNueva={q.nueva === "1"}
        initialUnidadId={q.unidadId ?? ""}
        initialPreventivo={q.preventivo === "hrs" ? "hrs" : q.preventivo === "km" ? "km" : null}
      />
    </div>
  );
}
