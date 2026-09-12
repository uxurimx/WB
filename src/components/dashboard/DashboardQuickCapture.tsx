"use client";

import { useState } from "react";
import { Fuel, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CargaRapidaModal from "@/components/dashboard/CargaRapidaModal";

export default function DashboardQuickCapture() {
  const [tipo, setTipo] = useState<"patio" | "campo" | null>(null);

  return (
    <>
      <div className="hidden lg:flex gap-2 shrink-0">
        <Button type="button" variant="secondary" size="sm" onClick={() => setTipo("campo")}>
          <Fuel className="w-4 h-4" /> Campo
        </Button>
        <Button type="button" size="sm" onClick={() => setTipo("patio")}>
          <PlusCircle className="w-4 h-4" /> Patio
        </Button>
      </div>

      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t px-3 pt-2 flex gap-2"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--border)",
          paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))",
        }}
      >
        <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={() => setTipo("campo")}>
          <Fuel className="w-4 h-4" /> Campo
        </Button>
        <Button type="button" size="sm" className="flex-1" onClick={() => setTipo("patio")}>
          <PlusCircle className="w-4 h-4" /> Patio
        </Button>
      </div>

      <CargaRapidaModal tipo={tipo} onClose={() => setTipo(null)} />
    </>
  );
}
