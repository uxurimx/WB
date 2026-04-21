"use client";

import { useState, useTransition } from "react";
import { ChevronRight, Fuel, BarChart3, Calendar, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getCatalogoResumen } from "@/app/actions/cargas";

type Resumen = Awaited<ReturnType<typeof getCatalogoResumen>>;

function formatFecha(f: string) {
  return new Date(f + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function CatalogoDetalleModal({
  tipo,
  id,
  nombre,
}: {
  tipo: "unidad" | "operador" | "obra";
  id: number;
  nombre: string;
}) {
  const [open, setOpen]         = useState(false);
  const [datos, setDatos]       = useState<Resumen | null>(null);
  const [isPending, start]      = useTransition();

  function abrir() {
    setOpen(true);
    if (!datos) {
      start(async () => {
        const res = await getCatalogoResumen(tipo, id);
        setDatos(res);
      });
    }
  }

  return (
    <>
      <button
        onClick={abrir}
        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
        title="Ver historial"
      >
        <ChevronRight className="w-4 h-4 text-indigo-400" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono">
              {nombre}
              <Badge variant="secondary" className="font-normal text-xs capitalize">{tipo}</Badge>
            </DialogTitle>
          </DialogHeader>

          {isPending && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--fg-muted)" }} />
            </div>
          )}

          {datos && !isPending && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total cargas",    value: datos.totalCargas,                      icon: BarChart3 },
                  { label: "Litros totales",  value: `${datos.totalLitros.toLocaleString()} L`, icon: Fuel },
                  { label: "Patio",           value: datos.cargasPatio,                      icon: BarChart3 },
                  { label: "Campo",           value: datos.cargasCampo,                      icon: Fuel },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="p-3 rounded-xl border"
                    style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                      style={{ color: "var(--fg-muted)" }}>{label}</p>
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                      <span className="font-mono font-bold text-lg" style={{ color: "var(--fg)" }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {datos.ultimaFecha && (
                <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--fg-muted)" }}>
                  <Calendar className="w-3.5 h-3.5" />
                  Última carga: {formatFecha(datos.ultimaFecha)}
                </p>
              )}

              {/* Historial reciente */}
              {datos.recientes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: "var(--fg-muted)" }}>
                    Cargas recientes
                  </p>
                  <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    {datos.recientes.map((c, i) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm"
                        style={{
                          borderTop: i > 0 ? "1px solid var(--border)" : undefined,
                          backgroundColor: "var(--surface)",
                        }}
                      >
                        <span className="font-mono text-xs w-14 shrink-0" style={{ color: "var(--fg-muted)" }}>
                          {c.fecha}
                        </span>
                        {tipo !== "unidad" && c.unidadCodigo && (
                          <span className="font-mono font-bold text-xs w-12 shrink-0" style={{ color: "var(--fg)" }}>
                            {c.unidadCodigo}
                          </span>
                        )}
                        {tipo !== "operador" && c.operadorNombre && (
                          <span className="text-xs truncate flex-1" style={{ color: "var(--fg-muted)" }}>
                            {c.operadorNombre}
                          </span>
                        )}
                        {tipo !== "obra" && c.obraNombre && (
                          <span className="text-xs truncate flex-1" style={{ color: "var(--fg-muted)" }}>
                            {c.obraNombre}
                          </span>
                        )}
                        <span className="flex-1" />
                        <Badge variant={c.origen === "campo" ? "warning" : "default"} className="text-[10px] shrink-0">
                          {c.origen === "campo" ? "Campo" : "Patio"}
                        </Badge>
                        <span className="font-mono font-semibold text-xs w-14 text-right shrink-0"
                          style={{ color: "var(--fg)" }}>
                          {c.litros.toLocaleString()} L
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {datos.recientes.length === 0 && (
                <p className="text-sm text-center py-6" style={{ color: "var(--fg-muted)" }}>
                  Sin cargas registradas.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
