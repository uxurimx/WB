import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import ImportarExcel from "@/components/admin/ImportarExcel";

export default async function ImportarPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const me = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!me || me.role !== "admin") redirect("/overview");

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-xs font-semibold mb-4 hover:text-indigo-500 transition-colors"
          style={{ color: "var(--fg-muted)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Administración
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          </div>
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--fg-muted)" }}
          >
            Sistema
          </p>
        </div>
        <h1
          className="font-outfit font-bold text-3xl"
          style={{ color: "var(--fg)" }}
        >
          Importar Datos Históricos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          Carga el Excel histórico de cargas. El sistema detecta las columnas
          automáticamente y omite duplicados.
        </p>
      </div>

      {/* Info box */}
      <div
        className="p-4 rounded-xl border mb-6 space-y-1 text-sm"
        style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}
      >
        <p className="font-semibold" style={{ color: "var(--fg)" }}>
          Formato esperado
        </p>
        {[
          "Archivo .xlsx con hoja \"CARGAS GENERAL\" (o similar)",
          "Columnas mínimas: Fecha, Unidad/Equipo y Litros",
          "Opcionales: Folio, Operador, Obra, Origen, Odómetro/Hrs, Tipo Diesel",
          "Las unidades y operadores nuevos se crean automáticamente",
          "Registros duplicados (mismo folio + fecha + origen) se omiten",
        ].map((t) => (
          <p key={t} className="text-xs flex items-start gap-1.5" style={{ color: "var(--fg-muted)" }}>
            <span className="text-indigo-500 font-bold mt-0.5">·</span> {t}
          </p>
        ))}
      </div>

      <ImportarExcel />
    </div>
  );
}
