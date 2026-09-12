"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import FormCargaPatio from "@/components/cargas/FormCargaPatio";
import FormCargaCampo from "@/components/cargas/FormCargaCampo";
import { getCargaFormBootstrap } from "@/app/actions/cargas";

type Bootstrap = Awaited<ReturnType<typeof getCargaFormBootstrap>>;

export default function CargaRapidaModal({
  tipo,
  onClose,
}: {
  tipo: "patio" | "campo" | null;
  onClose: () => void;
}) {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tipo) return;
    let cancelled = false;
    queueMicrotask(() => { setLoading(true); setError(""); setData(null); });
    getCargaFormBootstrap(tipo)
      .then((res) => { if (!cancelled) setData(res); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar el formulario"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tipo]);

  return (
    <Dialog open={tipo !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{tipo === "campo" ? "Carga en campo" : "Carga patio"}</DialogTitle>
          <DialogDescription>
            {tipo === "campo"
              ? "Despacho NISSAN en obra. Folio del ticket físico."
              : "Despacho en taller. Folio asignado automáticamente."}
          </DialogDescription>
        </DialogHeader>
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-sm" style={{ color: "var(--fg-muted)" }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
          </div>
        )}
        {error && <p className="text-sm text-red-500 py-4">{error}</p>}
        {!loading && !error && data?.tipo === "patio" && (
          <FormCargaPatio
            unidades={data.unidades}
            operadores={data.operadores}
            siguienteFolio={data.siguienteFolio}
            stockActual={data.stockActual}
            ultimaCuentaLt={data.ultimaCuentaLt}
            folioMin={data.folioMin}
            folioMax={data.folioMax}
          />
        )}
        {!loading && !error && data?.tipo === "campo" && (
          <FormCargaCampo
            unidades={data.unidades}
            operadores={data.operadores}
            obras={data.obras}
            saldoNissan={data.saldoNissan}
            cuentalitrosNissan={data.cuentalitrosNissan}
            siguienteFolio={data.siguienteFolio}
            folioMin={data.folioMin}
            folioMax={data.folioMax}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
