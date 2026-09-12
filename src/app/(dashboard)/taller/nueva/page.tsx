export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import { getUnidadesYOperadoresTaller } from "@/app/actions/taller";
import OrdenNuevaForm from "@/components/taller/OrdenNuevaForm";

export default async function TallerNuevaPage() {
  await requirePermission("taller");
  const { unidades, operadores } = await getUnidadesYOperadoresTaller();

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <Link
        href="/taller"
        className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-500"
        style={{ color: "var(--fg-muted)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Órdenes
      </Link>
      <h1 className="font-outfit font-bold text-3xl mb-1" style={{ color: "var(--fg)" }}>
        Nueva orden
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--fg-muted)" }}>
        Llegó la unidad. Elige el económico, marca el checklist y guarda. Isaac cierra después con las refacciones.
      </p>
      <OrdenNuevaForm unidades={unidades} operadores={operadores} />
    </div>
  );
}
