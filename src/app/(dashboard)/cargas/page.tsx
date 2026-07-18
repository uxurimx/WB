export const dynamic = 'force-dynamic';

import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { ClipboardList, PlusCircle, Fuel } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import { getCargasPage, getHistorialGlobalStats } from "@/app/actions/cargas";
import { getOperadores, getObras } from "@/app/actions/catalogo";
import { getTransferencias, getRecargasTanque } from "@/app/actions/tanques";
import { getPeriodoActualRange } from "@/app/actions/periodos";
import { Button } from "@/components/ui/button";
import CargasTable, {
  type TransferenciaItem, type RecargaItem,
} from "@/components/cargas/CargasTable";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];
const PAGE_SIZE = 50;

export default async function HistorialCargasPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string; unidadId?: string; desde?: string; hasta?: string; todo?: string; tab?: string }>;
}) {
  await requirePermission("cargas.historial");

  const params = await searchParams;
  const origen = params.origen === "patio" ? "patio" : params.origen === "campo" ? "campo" : undefined;
  const unidadId = params.unidadId ? parseInt(params.unidadId) : undefined;
  const initialTab = params.tab === "actividad" ? "actividad" : undefined;

  // Ventana de fechas: explícita (desde/hasta) > todo el historial (?todo=1) > período actual (default)
  const todo = params.todo === "1";
  const explicitDesde = params.desde ?? "";
  const explicitHasta = params.hasta ?? "";
  const hasExplicit = !!(explicitDesde || explicitHasta);

  let desde = "";
  let hasta = "";
  let isDefaultWindow = false;
  if (todo) {
    // sin ventana → todo el historial (paginado)
  } else if (hasExplicit) {
    desde = explicitDesde;
    hasta = explicitHasta;
  } else {
    const range = await getPeriodoActualRange();
    desde = range.desde;
    hasta = range.hasta;
    isDefaultWindow = true;
  }
  const hasFiltroFecha = !!(desde || hasta);
  const dateOpts = { fechaDesde: desde || undefined, fechaHasta: hasta || undefined };

  // Cargas: primera página (server-side). Recargas/transferencias son pocas → se cargan
  // completas dentro de la ventana y se filtran/intercalan en el cliente.
  const [cargasPage, operadores, obras, clerkUser, transferencias, recargas, globalStats] = await Promise.all([
    getCargasPage({ origen, unidadId, limit: PAGE_SIZE, offset: 0, ...dateOpts }),
    getOperadores(false),
    getObras(false),
    currentUser(),
    getTransferencias(5000, dateOpts),
    getRecargasTanque(5000, dateOpts),
    getHistorialGlobalStats(),
  ]);

  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);

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
    createdAt: t.createdAt?.toISOString() ?? null,
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
    createdAt: r.createdAt?.toISOString() ?? null,
  }));

  return (
    <div className="p-6 md:p-8 max-w-[1536px]">
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
          <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>Movimientos de diesel</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
            {isDefaultWindow
              ? `Período actual · ${cargasPage.total.toLocaleString()} cargas`
              : hasFiltroFecha
              ? `${cargasPage.total.toLocaleString()} cargas en el rango seleccionado`
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

      <CargasTable
        key={`${origen ?? "all"}|${todo ? "todo" : `${desde}_${hasta}`}|${unidadId ?? ""}`}
        initialCargas={cargasPage.items}
        cargasTotal={cargasPage.total}
        cargasLitros={cargasPage.litros}
        cargasUnidades={cargasPage.unidades}
        recargas={recargaItems}
        transferencias={transfItems}
        operadores={operadores}
        obras={obras}
        canEdit={canEdit}
        pageSize={PAGE_SIZE}
        origen={origen}
        unidadId={unidadId}
        hasFiltroFecha={hasFiltroFecha}
        isDefaultWindow={isDefaultWindow}
        todo={todo}
        desde={desde}
        hasta={hasta}
        initialTab={initialTab}
      />
    </div>
  );
}
