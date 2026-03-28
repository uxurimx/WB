export const dynamic = 'force-dynamic';

import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { ClipboardList, PlusCircle, Fuel } from "lucide-react";
import { getCargas } from "@/app/actions/cargas";
import { getOperadores, getObras } from "@/app/actions/catalogo";
import { getTransferencias } from "@/app/actions/tanques";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CargasTable, { type CargaItem, type TransferenciaItem, type HistorialItem } from "@/components/cargas/CargasTable";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

export default async function HistorialCargasPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string; unidadId?: string }>;
}) {
  const params = await searchParams;
  const origen = params.origen === "patio" ? "patio" : params.origen === "campo" ? "campo" : undefined;

  const [cargas, operadores, obras, clerkUser, transferencias] = await Promise.all([
    getCargas({
      origen,
      unidadId: params.unidadId ? parseInt(params.unidadId) : undefined,
      limit: 150,
    }),
    getOperadores(false),
    getObras(false),
    currentUser(),
    // Transferencias solo en vista "Todas" (sin filtro de origen)
    origen ? Promise.resolve([] as Awaited<ReturnType<typeof getTransferencias>>) : getTransferencias(150),
  ]);

  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

  // Mapear a tipos del componente
  const cargaItems: CargaItem[] = cargas.map((c) => ({
    _tipo: "carga",
    id: c.id,
    fecha: c.fecha,
    hora: c.hora,
    folio: c.folio,
    litros: c.litros,
    origen: c.origen,
    tipoDiesel: c.tipoDiesel,
    notas: c.notas,
    operadorId: c.operadorId,
    obraId: c.obraId,
    unidad: c.unidad ? { codigo: c.unidad.codigo } : null,
    operador: c.operador ? { nombre: c.operador.nombre } : null,
    obra: c.obra ? { nombre: c.obra.nombre } : null,
  }));

  const transfItems: TransferenciaItem[] = transferencias.map((t) => ({
    _tipo: "transferencia",
    id: t.id,
    fecha: t.fecha,
    folio: t.folio,
    litros: t.litros,
    origenNombre: t.origenNombre,
    destinoNombre: t.destinoNombre,
    notas: t.notas,
  }));

  // Mezclar y ordenar por fecha desc
  const items: HistorialItem[] = [...cargaItems, ...transfItems].sort(
    (a, b) => b.fecha.localeCompare(a.fecha)
  );

  // Stats (sólo cargas)
  const totalLitros = cargas.reduce((sum, c) => sum + (c.litros ?? 0), 0);
  const cargasPatio = cargas.filter((c) => c.origen === "patio").length;
  const cargasCampo = cargas.filter((c) => c.origen === "campo").length;

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <ClipboardList className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
              Cargas
            </p>
          </div>
          <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>Historial</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            {cargas.length} cargas · {totalLitros.toLocaleString()} L
            {!origen && transferencias.length > 0 && (
              <span> · {transferencias.length} transferencias</span>
            )}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="secondary" size="sm">
            <Link href="/cargas/campo">
              <Fuel className="w-4 h-4" /> Campo
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/cargas/nueva">
              <PlusCircle className="w-4 h-4" /> Nueva Patio
            </Link>
          </Button>
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { label: "Todas", href: "/cargas" },
          { label: "Patio", href: "/cargas?origen=patio" },
          { label: "Campo", href: "/cargas?origen=campo" },
        ].map(({ label, href }) => (
          <Link key={label} href={href}>
            <Badge
              variant={
                (origen === "patio" && label === "Patio") ||
                (origen === "campo" && label === "Campo") ||
                (!origen && label === "Todas")
                  ? "default"
                  : "secondary"
              }
              className="cursor-pointer text-sm px-3 py-1"
            >
              {label}
              {label === "Patio" && ` (${cargasPatio})`}
              {label === "Campo" && ` (${cargasCampo})`}
              {label === "Todas" && ` (${cargas.length})`}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Cargas", value: cargas.length },
          { label: "Litros Despachados", value: `${totalLitros.toLocaleString()} L` },
          { label: "Unidades Distintas", value: new Set(cargas.map((c) => c.unidadId)).size },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-2xl border text-center"
            style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="font-outfit font-bold text-2xl" style={{ color: "var(--fg)" }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
          </div>
        ))}
      </div>

      <CargasTable
        items={items}
        operadores={operadores}
        obras={obras}
        canEdit={canEdit}
      />
    </div>
  );
}
