"use client";

import { Printer } from "lucide-react";

export default function PrintClient() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
    >
      <Printer className="w-4 h-4" />
      Imprimir / Guardar PDF
    </button>
  );
}
