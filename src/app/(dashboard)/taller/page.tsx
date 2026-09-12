export const dynamic = "force-dynamic";

import Link from "next/link";
import { Wrench, Plus } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import { getOrdenesTaller } from "@/app/actions/taller";
import TallerLista from "@/components/taller/TallerLista";

export default async function TallerPage() {
  await requirePermission("taller");
  const ordenes = await getOrdenesTaller();

  const abiertas = ordenes.filter((o) => o.estado === "abierta" || o.estado === "en_proceso").length;

  return (
    <div className="p-6 md:p-8 max-w-[1536px]">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Wrench className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
              Taller
            </p>
          </div>
          <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
            Órdenes de servicio
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            {abiertas > 0
              ? `${abiertas} abierta${abiertas === 1 ? "" : "s"} · el ayudante abre, Isaac cierra`
              : "Cuando entra una unidad, abre una orden. No uses papel."}
          </p>
        </div>
        <Link
          href="/taller/nueva"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Nueva orden
        </Link>
      </div>
      <TallerLista ordenes={ordenes} />
    </div>
  );
}
