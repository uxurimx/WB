"use client";

import { useState, useTransition } from "react";
import { CheckCircle, AlertCircle, Database, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedInicial, seedUnidadesWB } from "@/app/actions/setup";

export default function SeedButton() {
  const [isPendingInicial, startInicial] = useTransition();
  const [isPendingWB, startWB] = useTransition();
  const [resultInicial, setResultInicial] = useState<{ ok: boolean; msg: string } | null>(null);
  const [resultWB, setResultWB] = useState<{ ok: boolean; msg: string } | null>(null);

  function handleInicial() {
    setResultInicial(null);
    startInicial(async () => {
      try {
        await seedInicial();
        setResultInicial({ ok: true, msg: "Tanques y fuentes creados" });
      } catch (err) {
        setResultInicial({ ok: false, msg: err instanceof Error ? err.message : "Error" });
      }
    });
  }

  function handleWB() {
    setResultWB(null);
    startWB(async () => {
      try {
        const res = await seedUnidadesWB();
        setResultWB({ ok: true, msg: res.msg });
      } catch (err) {
        setResultWB({ ok: false, msg: err instanceof Error ? err.message : "Error" });
      }
    });
  }

  return (
    <div className="space-y-3">
      {/* Seed Inicial */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleInicial}
          disabled={isPendingInicial}
          className="shrink-0"
        >
          <Database className="w-4 h-4" />
          {isPendingInicial ? "Ejecutando..." : "Seed Inicial"}
        </Button>
        {resultInicial && (
          <p className={`text-xs flex items-center gap-1 ${resultInicial.ok ? "text-emerald-500" : "text-red-500"}`}>
            {resultInicial.ok
              ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            {resultInicial.msg}
          </p>
        )}
      </div>

      {/* Seed Unidades WB */}
      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleWB}
          disabled={isPendingWB}
          className="shrink-0"
        >
          <Truck className="w-4 h-4" />
          {isPendingWB ? "Importando..." : "Seed Unidades WB"}
        </Button>
        {resultWB && (
          <p className={`text-xs flex items-center gap-1 ${resultWB.ok ? "text-emerald-500" : "text-red-500"}`}>
            {resultWB.ok
              ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            {resultWB.msg}
          </p>
        )}
      </div>
    </div>
  );
}
