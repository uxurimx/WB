export const dynamic = 'force-dynamic';

import { ArrowRight } from "lucide-react";
import { getTransferencias } from "@/app/actions/tanques";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}

export default async function TransferenciasPage() {
  const transferencias = await getTransferencias(200);
  const totalLitros = transferencias.reduce((sum, t) => sum + t.litros, 0);

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <ArrowRight className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Tanques
          </p>
        </div>
        <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
          Transferencias
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-muted)" }}>
          {transferencias.length} registros · {totalLitros.toLocaleString()} L movidos entre tanques
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-outfit font-bold text-2xl" style={{ color: "var(--fg)" }}>{transferencias.length}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Transferencias</p>
        </div>
        <div className="p-4 rounded-2xl border text-center"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="font-outfit font-bold text-2xl" style={{ color: "var(--fg)" }}>{totalLitros.toLocaleString()} L</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Litros totales</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead>Folio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Ruta</TableHead>
              <TableHead className="text-right">Litros</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transferencias.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-16" style={{ color: "var(--fg-muted)" }}>
                  Sin transferencias registradas. Usa el botón "Cargar NISSAN" en el Dashboard.
                </TableCell>
              </TableRow>
            )}
            {transferencias.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <span className="font-mono font-semibold text-sm">
                    {t.folio != null ? `#${t.folio}` : "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{formatFecha(t.fecha)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Badge variant="default">{t.origenNombre}</Badge>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                    <Badge variant="warning">{t.destinoNombre}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono font-semibold text-sm">{t.litros.toLocaleString()}</span>
                  <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
                    {t.notas ?? "—"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
