export const dynamic = 'force-dynamic';

import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { ClipboardList, PlusCircle, Fuel } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import { getCargas, getHistorialGlobalStats } from "@/app/actions/cargas";
import { getOperadores, getObras } from "@/app/actions/catalogo";
import { getTransferencias, getRecargasTanque } from "@/app/actions/tanques";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CargasTable, {
  type CargaItem, type TransferenciaItem, type RecargaItem, type HistorialItem,
} from "@/components/cargas/CargasTable";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

export default async function HistorialCargasPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string; unidadId?: string; desde?: string; hasta?: string }>;
}) {
  await requirePermission("cargas.historial");

  const params = await searchParams;
  const origen = params.origen === "patio" ? "patio" : params.origen === "campo" ? "campo" : undefined;
  const soloCargas = !!origen;
  const desde = params.desde ?? "";
  const hasta = params.hasta ?? "";
  const hasFiltroFecha = !!(desde || hasta);

  const dateOpts = { fechaDesde: desde || undefined, fechaHasta: hasta || undefined };

  // Siempre carga todo el historial (sin paginación) para que búsqueda y filtros
  // operen sobre todos los registros, no solo una página
  const [{ rows: cargas, total: totalCargas }, operadores, obras, clerkUser, transferencias, recargas, globalStats] = await Promise.all([
    getCargas({ origen, unidadId: params.unidadId ? parseInt(params.unidadId) : undefined, limit: 9999, offset: 0, ...dateOpts }),
    getOperadores(false),
    getObras(false),
    currentUser(),
    soloCargas ? Promise.resolve([] as Awaited<ReturnType<typeof getTransferencias>>) : getTransferencias(9999, dateOpts),
    soloCargas ? Promise.resolve([] as Awaited<ReturnType<typeof getRecargasTanque>>) : getRecargasTanque(9999, dateOpts),
    getHistorialGlobalStats(),
  ]);

  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

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
    odometroHrs: c.odometroHrs ?? null,
    cuentaLtInicio: c.cuentaLtInicio ?? null,
    cuentaLtFin: c.cuentaLtFin ?? null,
    kmEstimado: c.kmEstimado ?? false,
    periodoId: c.periodoId ?? null,
    periodoCerrado: c.periodo?.cerrado ?? false,
    unidad: c.unidad ? { codigo: c.unidad.codigo } : null,
    operador: c.operador ? { nombre: c.operador.nombre } : null,
    obra: c.obra ? { nombre: c.obra.nombre } : null,
    fotoUrl: c.archivos?.[0]?.url ?? null,
  }));

  const transfItems: TransferenciaItem[] = transferencias.map((t) => ({
    _tipo: "transferencia",
    id: t.id,
    fecha: t.fecha,
    folio: t.folio,
    litros: t.litros,
    origenNombre: t.origenNombre,
    destinoNombre: t.destinoNombre,
    cuentalitrosNissanInicio: t.cuentalitrosNissanInicio ?? null,
    cuentalitrosDestino: t.cuentalitrosDestino ?? null,
    notas: t.notas,
  }));

  const recargaItems: RecargaItem[] = recargas.map((r) => ({
    _tipo: "recarga",
    id: r.id,
    fecha: r.fecha,
    litros: r.litros,
    tanqueNombre: r.tanqueNombre,
    proveedor: r.proveedor,
    folioFactura: r.folioFactura,
    precioLitro: r.precioLitro,
    cuentalitrosInicio: r.cuentalitrosInicio,
    notas: r.notas,
  }));

  const items: HistorialItem[] = [...cargaItems, ...transfItems, ...recargaItems].sort(
    (a, b) => b.fecha.localeCompare(a.fecha)
  );

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
            {hasFiltroFecha
              ? `${totalCargas.toLocaleString()} cargas en el rango seleccionado`
              : `${globalStats.cargas.total.toLocaleString()} cargas · ${globalStats.recargas.total.toLocaleString()} recargas · ${globalStats.transferencias.total.toLocaleString()} transferencias`
            }
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="secondary" size="sm">
            <Link href="/cargas/campo"><Fuel className="w-4 h-4" /> Campo</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/cargas/nueva"><PlusCircle className="w-4 h-4" /> Patio</Link>
          </Button>
        </div>
      </div>

      {/* Filtros de origen */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { label: "Todas", href: desde || hasta ? `/cargas?desde=${desde}&hasta=${hasta}` : "/cargas", active: !origen },
          { label: "Patio", href: desde || hasta ? `/cargas?origen=patio&desde=${desde}&hasta=${hasta}` : "/cargas?origen=patio", active: origen === "patio" },
          { label: "Campo", href: desde || hasta ? `/cargas?origen=campo&desde=${desde}&hasta=${hasta}` : "/cargas?origen=campo", active: origen === "campo" },
        ].map(({ label, href, active }) => (
          <Link key={label} href={href}>
            <Badge variant={active ? "default" : "secondary"} className="cursor-pointer text-sm px-3 py-1">
              {label}
            </Badge>
          </Link>
        ))}
      </div>

      <CargasTable
        items={items}
        operadores={operadores}
        obras={obras}
        canEdit={canEdit}
        globalStats={globalStats}
        hasFiltroFecha={hasFiltroFecha}
        desde={desde}
        hasta={hasta}
      />
    </div>
  );
}
