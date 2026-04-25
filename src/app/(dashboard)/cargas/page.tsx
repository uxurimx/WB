export const dynamic = 'force-dynamic';

import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { ClipboardList, PlusCircle, Fuel, ChevronLeft, ChevronRight } from "lucide-react";
import { requirePermission } from "@/lib/server-guard";
import { getCargas } from "@/app/actions/cargas";
import { getOperadores, getObras } from "@/app/actions/catalogo";
import { getTransferencias, getRecargasTanque } from "@/app/actions/tanques";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CargasTable, {
  type CargaItem, type TransferenciaItem, type RecargaItem, type HistorialItem,
} from "@/components/cargas/CargasTable";

const MANAGE_ROLES = ["admin", "gerente", "encargado_obra"];

const PAGE_SIZE = 50;

export default async function HistorialCargasPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string; unidadId?: string; page?: string }>;
}) {
  await requirePermission("cargas.historial");

  const params = await searchParams;
  const origen = params.origen === "patio" ? "patio" : params.origen === "campo" ? "campo" : undefined;
  const soloCargas = !!origen;
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [{ rows: cargas, total: totalCargas }, operadores, obras, clerkUser, transferencias, recargas] = await Promise.all([
    getCargas({ origen, unidadId: params.unidadId ? parseInt(params.unidadId) : undefined, limit: PAGE_SIZE, offset }),
    getOperadores(false),
    getObras(false),
    currentUser(),
    soloCargas ? Promise.resolve([] as Awaited<ReturnType<typeof getTransferencias>>) : getTransferencias(500),
    soloCargas ? Promise.resolve([] as Awaited<ReturnType<typeof getRecargasTanque>>) : getRecargasTanque(500),
  ]);

  const canEdit = MANAGE_ROLES.includes(clerkUser?.publicMetadata?.role as string);
  const totalPages = Math.ceil(totalCargas / PAGE_SIZE);

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

  const totalLitrosStr = cargas.reduce((sum, c) => sum + (c.litros ?? 0), 0).toLocaleString();

  // Build URL preserving current filters but resetting/setting page
  const pageUrl = (p: number) => {
    const qs = new URLSearchParams();
    if (origen) qs.set("origen", origen);
    if (params.unidadId) qs.set("unidadId", params.unidadId);
    if (p > 1) qs.set("page", String(p));
    const str = qs.toString();
    return `/cargas${str ? `?${str}` : ""}`;
  };

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
            {totalCargas.toLocaleString()} cargas · {totalLitrosStr} L (pág. {page}/{totalPages})
            {!soloCargas && transferencias.length > 0 && <span> · {transferencias.length} transferencias</span>}
            {!soloCargas && recargas.length > 0 && <span> · {recargas.length} recargas</span>}
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

      {/* Filtros */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { label: "Todas", href: "/cargas", active: !origen },
          { label: "Patio",  href: "/cargas?origen=patio",  active: origen === "patio" },
          { label: "Campo",  href: "/cargas?origen=campo",  active: origen === "campo" },
        ].map(({ label, href, active }) => (
          <Link key={label} href={href}>
            <Badge variant={active ? "default" : "secondary"} className="cursor-pointer text-sm px-3 py-1">
              {label}
            </Badge>
          </Link>
        ))}
      </div>

      <CargasTable items={items} operadores={operadores} obras={obras} canEdit={canEdit} />

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
            Mostrando {offset + 1}–{Math.min(offset + PAGE_SIZE, totalCargas)} de {totalCargas.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" disabled={page <= 1}>
              <Link href={pageUrl(page - 1)} aria-disabled={page <= 1}>
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Link>
            </Button>
            <span className="text-sm font-mono px-2" style={{ color: "var(--fg)" }}>
              {page} / {totalPages}
            </span>
            <Button asChild variant="secondary" size="sm" disabled={page >= totalPages}>
              <Link href={pageUrl(page + 1)} aria-disabled={page >= totalPages}>
                Siguiente <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
