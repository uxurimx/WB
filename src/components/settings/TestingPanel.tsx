"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, RotateCcw, FlaskConical, Gauge, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetOperacional,
  resetTotal,
  ajustarStockTanques,
  seedDatosPrueba,
  setFolioBase,
  setFolioBaseCampo,
} from "@/app/actions/setup";

// ── Confirmation input ─────────────────────────────────────────
function ConfirmAction({
  keyword,
  label,
  onConfirm,
  isPending,
  variant = "amber",
}: {
  keyword: string;
  label: string;
  onConfirm: () => void;
  isPending: boolean;
  variant?: "amber" | "red";
}) {
  const [value, setValue] = useState("");
  const match = value.trim().toUpperCase() === keyword.toUpperCase();
  const color = variant === "red" ? "text-red-500 border-red-500/30" : "text-amber-500 border-amber-500/30";
  const btnColor = variant === "red"
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-amber-600 hover:bg-amber-700 text-white";

  return (
    <div className={`mt-3 p-3 rounded-xl border ${color} space-y-2`} style={{ backgroundColor: variant === "red" ? "rgb(239 68 68 / 0.05)" : "rgb(245 158 11 / 0.05)" }}>
      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
        Escribe <span className="font-mono font-bold">{keyword}</span> para confirmar
      </p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={keyword}
          className="font-mono text-sm h-8"
          autoComplete="off"
        />
        <Button
          type="button"
          size="sm"
          className={`shrink-0 h-8 ${btnColor} border-0`}
          disabled={!match || isPending}
          onClick={() => { setValue(""); onConfirm(); }}
        >
          {isPending ? "..." : label}
        </Button>
      </div>
    </div>
  );
}

// ── Stock adjuster ─────────────────────────────────────────────
function StockAdjuster() {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  const [taller, setTaller] = useState("6500");
  const [nissan, setNissan] = useState("450");

  const presets = [
    { label: "Full", t: 9500, n: 1100 },
    { label: "Normal", t: 6500, n: 450 },
    { label: "Bajo", t: 400, n: 80 },
    { label: "Crítico", t: 100, n: 20 },
    { label: "Vacío", t: 0, n: 0 },
  ];

  function run(t: number, n: number) {
    startTransition(async () => {
      const res = await ajustarStockTanques(t, n);
      setMsg(res.msg);
      setTimeout(() => setMsg(""), 4000);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={isPending}
            onClick={() => { setTaller(String(p.t)); setNissan(String(p.n)); run(p.t, p.n); }}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors hover:bg-indigo-500/10 hover:border-indigo-500/40 disabled:opacity-50"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-end">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Taller (L)</Label>
          <Input value={taller} onChange={(e) => setTaller(e.target.value)} type="number" className="h-8 font-mono text-sm" />
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">NISSAN (L)</Label>
          <Input value={nissan} onChange={(e) => setNissan(e.target.value)} type="number" className="h-8 font-mono text-sm" />
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 shrink-0"
          disabled={isPending}
          onClick={() => run(parseFloat(taller) || 0, parseFloat(nissan) || 0)}
        >
          Aplicar
        </Button>
      </div>
      {msg && <p className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{msg}</p>}
    </div>
  );
}

// ── Folio control ──────────────────────────────────────────────
function FolioControl() {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  const [folioPatio, setFolioPatio] = useState("1");
  const [folioCampo, setFolioCampo] = useState("1");

  function applyPatio(value: number) {
    startTransition(async () => {
      const res = await setFolioBase(value);
      setMsg(res.msg);
      setTimeout(() => setMsg(""), 4000);
    });
  }

  function applyCampo(value: number) {
    startTransition(async () => {
      const res = await setFolioBaseCampo(value);
      setMsg(res.msg);
      setTimeout(() => setMsg(""), 4000);
    });
  }

  return (
    <div className="space-y-3">
      {/* Patio */}
      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--fg-muted)" }}>Folio Patio</p>
        <div className="flex gap-2">
          <Input value={folioPatio} onChange={(e) => setFolioPatio(e.target.value)}
            type="number" min="1" className="h-8 font-mono text-sm flex-1" />
          <Button type="button" size="sm" className="h-8 shrink-0" disabled={isPending}
            onClick={() => applyPatio(parseInt(folioPatio) || 1)}>
            Aplicar
          </Button>
          <Button type="button" variant="secondary" size="sm" className="h-8 shrink-0" disabled={isPending}
            onClick={() => { setFolioPatio("1"); applyPatio(1); }}>
            Reset a 1
          </Button>
        </div>
      </div>
      {/* Campo */}
      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--fg-muted)" }}>Folio Campo (NISSAN)</p>
        <div className="flex gap-2">
          <Input value={folioCampo} onChange={(e) => setFolioCampo(e.target.value)}
            type="number" min="1" className="h-8 font-mono text-sm flex-1" />
          <Button type="button" size="sm" className="h-8 shrink-0" disabled={isPending}
            onClick={() => applyCampo(parseInt(folioCampo) || 1)}>
            Aplicar
          </Button>
          <Button type="button" variant="secondary" size="sm" className="h-8 shrink-0" disabled={isPending}
            onClick={() => { setFolioCampo("1"); applyCampo(1); }}>
            Reset a 1
          </Button>
        </div>
      </div>
      <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
        Solo aplica cuando no hay cargas en la DB. Con cargas existentes, el folio continúa desde el último.
      </p>
      {msg && <p className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{msg}</p>}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────
type ActionState = { ok: boolean; msg: string } | null;

export default function TestingPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState>(null);

  function run(action: () => Promise<{ ok: boolean; msg: string }>) {
    startTransition(async () => {
      try {
        const res = await action();
        setResult(res);
        // Limpia el Router Cache del cliente para que las páginas muestren datos frescos
        router.refresh();
        setTimeout(() => setResult(null), 6000);
      } catch (err) {
        setResult({ ok: false, msg: err instanceof Error ? err.message : "Error" });
      }
    });
  }

  return (
    <div className="rounded-2xl border-2 border-dashed" style={{ borderColor: "rgb(239 68 68 / 0.3)" }}>
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 p-5 text-left"
      >
        <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <FlaskConical className="w-4 h-4 text-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-500">Zona de Testing</p>
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            Herramientas destructivas — solo para entorno de pruebas
          </p>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "var(--fg-muted)" }} />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--fg-muted)" }} />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "rgb(239 68 68 / 0.2)" }}>
          {/* Result banner */}
          {result && (
            <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 text-sm ${result.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {result.msg}
            </div>
          )}

          {/* Seed datos de prueba */}
          <div className="pt-4 p-4 rounded-xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="w-4 h-4 text-indigo-400" />
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Generar datos de prueba</p>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--fg-muted)" }}>
              Crea 30+ cargas realistas en los últimos 14 días, un período activo, operadores de prueba y recarga de stock (Taller 6,500 L · NISSAN 450 L).
            </p>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={() => run(seedDatosPrueba)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              {isPending ? "Generando..." : "Generar datos de prueba"}
            </Button>
          </div>

          {/* Ajustar stock */}
          <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="w-4 h-4 text-violet-400" />
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Ajustar stock de tanques</p>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--fg-muted)" }}>
              Fija los litros de cada tanque a un valor específico para probar alertas de stock bajo, lleno, etc.
            </p>
            <StockAdjuster />
          </div>

          {/* Control de folio */}
          <div className="p-4 rounded-xl border" style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-mono font-bold text-indigo-400">#</span>
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Control de folio</p>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--fg-muted)" }}>
              Define desde qué número inicia el folio cuando no hay cargas registradas (ej. después de un reset operacional).
            </p>
            <FolioControl />
          </div>

          {/* Reset operacional */}
          <div className="p-4 rounded-xl border border-amber-500/20" style={{ backgroundColor: "rgb(245 158 11 / 0.03)" }}>
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-semibold text-amber-400">Reset operacional</p>
            </div>
            <p className="text-xs mb-1" style={{ color: "var(--fg-muted)" }}>
              Elimina <strong>cargas, períodos, rendimientos, recargas y transferencias</strong>. Los catálogos (unidades, operadores, obras) y la configuración de tanques se conservan. Niveles de stock quedan en 0.
            </p>
            <ConfirmAction
              keyword="RESET"
              label="Resetear"
              variant="amber"
              isPending={isPending}
              onConfirm={() => run(resetOperacional)}
            />
          </div>

          {/* Reset total */}
          <div className="p-4 rounded-xl border border-red-500/30" style={{ backgroundColor: "rgb(239 68 68 / 0.03)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Trash2 className="w-4 h-4 text-red-500" />
              <p className="text-sm font-semibold text-red-500">Reset total</p>
            </div>
            <p className="text-xs mb-1" style={{ color: "var(--fg-muted)" }}>
              Elimina <strong>absolutamente todo</strong>: cargas, períodos, catálogos, operadores, obras, tanques y configuración. El sistema queda como recién instalado (solo ejecuta el Seed Inicial automáticamente).
            </p>
            <div className="flex items-center gap-1.5 mt-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <p className="text-xs text-red-400 font-semibold">Irreversible. No afecta usuarios de Clerk.</p>
            </div>
            <ConfirmAction
              keyword="ELIMINAR TODO"
              label="Reset total"
              variant="red"
              isPending={isPending}
              onConfirm={() => run(resetTotal)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
