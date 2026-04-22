export const dynamic = 'force-dynamic';

import { PlusCircle } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import { getUnidades, getOperadores } from "@/app/actions/catalogo";
import { getSiguienteFolioPublic, getUltimaCuentaLtPatio } from "@/app/actions/cargas";
import { db } from "@/db";
import { tanques } from "@/db/schema";
import { eq } from "drizzle-orm";
import FormCargaPatio from "@/components/cargas/FormCargaPatio";

async function getStockTaller() {
  const tanque = await db.query.tanques.findFirst({
    where: eq(tanques.nombre, "Taller"),
  });
  return tanque?.litrosActuales ?? 0;
}

export default async function NuevaCargaPatioPage() {
  await requirePermission("cargas.nueva_patio");

  const [unidades, operadores, siguienteFolio, stockActual, ultimaCuentaLt] = await Promise.all([
    getUnidades(true),
    getOperadores(true),
    getSiguienteFolioPublic(),
    getStockTaller(),
    getUltimaCuentaLtPatio(),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <PlusCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Cargas
          </p>
        </div>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Nueva Carga Patio
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Registro de despacho en taller. Folio asignado automáticamente.
        </p>
      </div>

      {unidades.length === 0 ? (
        <div className="max-w-lg mx-auto p-6 rounded-2xl border text-center"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--fg-muted)" }}>
            No hay unidades registradas. Ve a Catálogos → Unidades para agregar o ejecuta el Seed WB en Configuración.
          </p>
          <a href="/catalogo/unidades"
            className="text-sm font-semibold text-indigo-500 hover:text-indigo-400 transition-colors">
            Ir a Unidades →
          </a>
        </div>
      ) : (
        <FormCargaPatio
          unidades={unidades}
          operadores={operadores}
          siguienteFolio={siguienteFolio}
          stockActual={stockActual}
          ultimaCuentaLt={ultimaCuentaLt}
        />
      )}
    </div>
  );
}
