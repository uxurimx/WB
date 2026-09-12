"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ESTADO_LABEL, type EstadoOrden } from "@/lib/taller-checklist";
import { useRouter } from "next/navigation";

type Orden = {
  id: number;
  fecha: string;
  kmHrs: number | null;
  motivo: string | null;
  estado: string;
  unidad: { codigo: string } | null;
  operador: { nombre: string } | null;
  refacciones: { precio: number | null; cantidad: number | null; iva: boolean }[];
};

const FILTROS: { id: "todas" | EstadoOrden; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "abierta", label: "Abiertas" },
  { id: "en_proceso", label: "En proceso" },
  { id: "cerrada", label: "Cerradas" },
];

function badgeVariant(estado: string) {
  if (estado === "abierta") return "warning" as const;
  if (estado === "en_proceso") return "default" as const;
  if (estado === "cerrada") return "success" as const;
  return "secondary" as const;
}

function costo(refs: Orden["refacciones"]) {
  return refs.reduce((s, r) => {
    const p = (r.precio ?? 0) * (r.cantidad ?? 1);
    return s + (r.iva ? p * 1.16 : p);
  }, 0);
}

export default function TallerLista({ ordenes }: { ordenes: Orden[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<"todas" | EstadoOrden>("todas");
  const rows = useMemo(
    () => (filtro === "todas" ? ordenes : ordenes.filter((o) => o.estado === filtro)),
    [ordenes, filtro],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
              filtro === f.id ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-[var(--surface-2)]"
            }`}
            style={filtro !== f.id ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "var(--surface)" }}>
              <TableHead>Unidad</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="hidden sm:table-cell">Motivo</TableHead>
              <TableHead className="hidden md:table-cell">Operador</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Costo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10" style={{ color: "var(--fg-muted)" }}>
                  No hay órdenes.{" "}
                  <Link href="/taller/nueva" className="underline font-semibold">
                    Abrir la primera
                  </Link>
                </TableCell>
              </TableRow>
            )}
            {rows.map((o) => {
              const c = costo(o.refacciones);
              return (
                <TableRow
                  key={o.id}
                  className="cursor-pointer hover:bg-[var(--surface-2)]"
                  onClick={() => router.push(`/taller/${o.id}`)}
                >
                  <TableCell className="font-mono font-bold text-sm">{o.unidad?.codigo ?? "—"}</TableCell>
                  <TableCell className="text-sm font-mono" style={{ color: "var(--fg-muted)" }}>
                    {o.fecha?.slice(0, 10)}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm max-w-[220px] truncate">
                    {o.motivo || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm" style={{ color: "var(--fg-muted)" }}>
                    {o.operador?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-right text-sm font-mono">
                    {c > 0
                      ? c.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(o.estado)}>
                      {ESTADO_LABEL[o.estado as EstadoOrden] ?? o.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
