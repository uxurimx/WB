"use client";

import { useState } from "react";
import { Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReporteActions({ periodoId }: { periodoId: number }) {
  const [downloading, setDownloading] = useState(false);

  function handlePrint() {
    window.open(`/periodos/${periodoId}/print`, "_blank");
  }

  async function handleExcel() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/reportes/${periodoId}/excel`);
      if (!res.ok) throw new Error("Error al generar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")
        ?.split("filename=")[1]
        ?.replace(/"/g, "") ?? `reporte-${periodoId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button type="button" variant="secondary" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4" />
        Imprimir
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleExcel}
        disabled={downloading}
      >
        <FileSpreadsheet className="w-4 h-4" />
        {downloading ? "Generando..." : "Excel"}
      </Button>
    </div>
  );
}
