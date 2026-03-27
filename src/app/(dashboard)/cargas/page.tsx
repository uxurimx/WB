import Link from "next/link";
import { ClipboardList, PlusCircle, Fuel } from "lucide-react";
import { getCargas } from "@/app/actions/cargas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const ORIGEN_LABEL: Record<string, string> = { patio: "Patio", campo: "Campo" };
const ORIGEN_VARIANT: Record<string, "default" | "warning"> = { patio: "default", campo: "warning" };
const DIESEL_LABEL: Record<string, string> = { normal: "Normal", amigo: "Amigo", oxxogas: "OxxoGas" };
const DIESEL_VARIANT: Record<string, "default" | "success" | "danger"> = {
  normal: "default", amigo: "success", oxxogas: "danger",
};

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });
}

export default async function HistorialCargasPage({
  searchParams,
}: {
  searchParams: Promise<{ origen?: string; unidadId?: string }>;
}) {
  const params = await searchParams;

  const cargas = await getCargas({
    origen: params.origen === "patio" ? "patio" : params.origen === "campo" ? "campo" : undefined,
    unidadId: params.unidadId ? parseInt(params.unidadId) : undefined,
    limit: 150,
  });

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
            {cargas.length} registros · {totalLitros.toLocaleString()} L total
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
                (params.origen === "patio" && label === "Patio") ||
                (params.origen === "campo" && label === "Campo") ||
                (!params.origen && label === "Todas")
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

      {/* Stats rápidos */}
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

      {/* Tabla */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Obra</TableHead>
              <TableHead>Diesel</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargas.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16" style={{ color: "var(--fg-muted)" }}>
                  <p className="mb-2">Sin cargas registradas.</p>
                  <Link href="/cargas/nueva"
                    className="text-sm font-semibold text-indigo-500 hover:text-indigo-400">
                    Registrar primera carga →
                  </Link>
                </TableCell>
              </TableRow>
            )}
            {cargas.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <span className="font-mono text-sm font-semibold">{c.folio ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatFecha(c.fecha)}</span>
                  {c.hora && (
                    <span className="ml-1.5 text-xs" style={{ color: "var(--fg-muted)" }}>
                      {c.hora.slice(0, 5)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-mono font-bold text-sm">{c.unidad?.codigo ?? `#${c.unidadId}`}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{c.operador?.nombre ?? "—"}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono font-semibold text-sm">{c.litros.toLocaleString()}</span>
                  <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
                </TableCell>
                <TableCell>
                  <Badge variant={ORIGEN_VARIANT[c.origen] ?? "secondary"}>
                    {ORIGEN_LABEL[c.origen] ?? c.origen}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                    {c.obra?.nombre ?? "—"}
                  </span>
                </TableCell>
                <TableCell>
                  {c.tipoDiesel && c.tipoDiesel !== "normal" ? (
                    <Badge variant={DIESEL_VARIANT[c.tipoDiesel] ?? "secondary"}>
                      {DIESEL_LABEL[c.tipoDiesel] ?? c.tipoDiesel}
                    </Badge>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Normal</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
