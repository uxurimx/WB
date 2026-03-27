import { Fuel } from "lucide-react";
import { getUnidades, getOperadores, getObras } from "@/app/actions/catalogo";
import { db } from "@/db";
import { tanques } from "@/db/schema";
import { eq } from "drizzle-orm";
import FormCargaCampo from "@/components/cargas/FormCargaCampo";

async function getSaldoNissan() {
  const tanque = await db.query.tanques.findFirst({
    where: eq(tanques.nombre, "NISSAN"),
  });
  return tanque?.litrosActuales ?? 0;
}

export default async function NuevaCargaCampoPage() {
  const [unidades, operadores, obras, saldoNissan] = await Promise.all([
    getUnidades(true),
    getOperadores(true),
    getObras(true),
    getSaldoNissan(),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Fuel className="w-4 h-4 text-violet-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Cargas
          </p>
        </div>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Carga en Campo
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Registro de despacho NISSAN en obra. Usa el folio físico del ticket.
        </p>
      </div>

      {unidades.length === 0 ? (
        <div className="max-w-lg mx-auto p-6 rounded-2xl border text-center"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--fg-muted)" }}>
            No hay unidades registradas.
          </p>
          <a href="/catalogo/unidades"
            className="text-sm font-semibold text-indigo-500 hover:text-indigo-400 transition-colors">
            Ir a Unidades →
          </a>
        </div>
      ) : (
        <FormCargaCampo
          unidades={unidades}
          operadores={operadores}
          obras={obras}
          saldoNissan={saldoNissan}
        />
      )}
    </div>
  );
}
