"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  CheckCircle, Fuel, AlertCircle, Hash, Plus, Loader2, TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCargaCampo, getUltimoOdometro } from "@/app/actions/cargas";
import { createObraRapida } from "@/app/actions/catalogo";

type Unidad  = { id: number; codigo: string; nombre: string | null; tipo: string };
type Operador = { id: number; nombre: string };
type Obra    = { id: number; nombre: string };

function getNow() {
  const now = new Date();
  return {
    fecha: now.toISOString().split("T")[0],
    hora:  now.toTimeString().slice(0, 5),
  };
}

const KM_MAX_DIFERENCIA = 1100;

export default function FormCargaCampo({
  unidades,
  operadores,
  obras: obrasProp,
  saldoNissan,
  siguienteFolio,
}: {
  unidades:      Unidad[];
  operadores:    Operador[];
  obras:         Obra[];
  saldoNissan:   number;
  siguienteFolio?: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState<{ litros: number; unidad: string } | null>(null);
  const [error, setError]     = useState("");

  // Lista local de obras — se puede ampliar on-the-fly
  const [obras, setObras]           = useState<Obra[]>(obrasProp);
  const [creandoObra, setCreandoObra] = useState(false);
  const [nuevaObraNombre, setNuevaObraNombre] = useState("");
  const [errorObra, setErrorObra]   = useState("");
  const [savingObra, setSavingObra] = useState(false);
  const nuevaObraInputRef = useRef<HTMLInputElement>(null);

  // Validación km
  const [ultimoKm, setUltimoKm]       = useState<number | null>(null);
  const [loadingKm, setLoadingKm]     = useState(false);
  const [kmWarning, setKmWarning]     = useState("");
  const [kmEstimado, setKmEstimado]   = useState(false);

  const { fecha: fechaInit, hora: horaInit } = getNow();

  const [form, setForm] = useState({
    fecha:             fechaInit,
    hora:              horaInit,
    folioNissan:       siguienteFolio ? String(siguienteFolio) : "",
    unidadId:          "",
    litros:            "",
    odometroHrs:       "",
    obraId:            "",
    operadorId:        "",        // chofer de la unidad (quien recibe)
    quienSuministraId: "",        // A3: operador NISSAN que despacha
    tipoDiesel:        "normal",
    notas:             "",
  });

  // ── Cuando cambia la unidad, cargar último km registrado ────────────────
  useEffect(() => {
    if (!form.unidadId) {
      setUltimoKm(null);
      setKmWarning("");
      setKmEstimado(false);
      return;
    }
    setLoadingKm(true);
    setKmWarning("");
    getUltimoOdometro(parseInt(form.unidadId)).then((km) => {
      setUltimoKm(km);
      setLoadingKm(false);
    });
  }, [form.unidadId]);

  // ── Validar km cada vez que cambia ─────────────────────────────────────
  useEffect(() => {
    const km = parseFloat(form.odometroHrs);
    setKmEstimado(false);
    if (!form.odometroHrs || isNaN(km)) {
      setKmWarning("");
      return;
    }
    if (ultimoKm !== null && km < ultimoKm) {
      setKmWarning(`Menor al último registrado (${ultimoKm.toLocaleString()})`);
    } else if (ultimoKm !== null && km - ultimoKm > KM_MAX_DIFERENCIA) {
      setKmWarning(`Diferencia de ${(km - ultimoKm).toLocaleString()} km excede el límite de ${KM_MAX_DIFERENCIA} km`);
    } else {
      setKmWarning("");
    }
  }, [form.odometroHrs, ultimoKm]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // ── Usar último km conocido cuando no hay lectura disponible ────────────
  function usarUltimoKm() {
    if (ultimoKm === null) return;
    setForm((prev) => ({ ...prev, odometroHrs: String(ultimoKm) }));
    setKmEstimado(true);
    setKmWarning("");
  }

  // ── Crear obra on-the-fly ───────────────────────────────────────────────
  function abrirCrearObra() {
    setCreandoObra(true);
    setNuevaObraNombre("");
    setErrorObra("");
    setTimeout(() => nuevaObraInputRef.current?.focus(), 50);
  }

  function cancelarCrearObra() {
    setCreandoObra(false);
    setNuevaObraNombre("");
    setErrorObra("");
  }

  async function guardarObra() {
    const nombre = nuevaObraNombre.trim();
    if (!nombre) { setErrorObra("Escribe el nombre de la obra"); return; }
    setSavingObra(true);
    try {
      const nueva = await createObraRapida(nombre);
      setObras((prev) => [...prev, { id: nueva.id, nombre: nueva.nombre }]);
      setForm((prev) => ({ ...prev, obraId: String(nueva.id) }));
      setCreandoObra(false);
      setNuevaObraNombre("");
    } catch (err) {
      setErrorObra(err instanceof Error ? err.message : "Error al crear");
    } finally {
      setSavingObra(false);
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.folioNissan) { setError("El folio NISSAN es requerido"); return; }
    if (!form.unidadId)    { setError("Selecciona una unidad"); return; }
    if (!form.litros || parseFloat(form.litros) <= 0) { setError("Ingresa los litros"); return; }

    // Validación km en submit
    const kmVal = parseFloat(form.odometroHrs);
    if (form.odometroHrs && !isNaN(kmVal)) {
      if (ultimoKm !== null && kmVal < ultimoKm) {
        setError(`El km/hr (${kmVal.toLocaleString()}) no puede ser menor al anterior registrado (${ultimoKm.toLocaleString()})`);
        return;
      }
      if (ultimoKm !== null && kmVal - ultimoKm > KM_MAX_DIFERENCIA) {
        setError(`La diferencia de ${(kmVal - ultimoKm).toLocaleString()} km excede el límite permitido de ${KM_MAX_DIFERENCIA} km. Revisa el odómetro.`);
        return;
      }
    }

    const unidadSel = unidades.find((u) => u.id === parseInt(form.unidadId));

    // Si no hay km, usar estimado si hay último km
    let odometroFinal: number | undefined;
    let estimado = false;
    if (form.odometroHrs && !isNaN(parseFloat(form.odometroHrs))) {
      odometroFinal = parseFloat(form.odometroHrs);
    } else if (ultimoKm !== null) {
      odometroFinal = ultimoKm;
      estimado      = true;
    }

    startTransition(async () => {
      try {
        await createCargaCampo({
          fecha:             form.fecha,
          hora:              form.hora,
          folioNissan:       parseInt(form.folioNissan),
          unidadId:          parseInt(form.unidadId),
          litros:            parseFloat(form.litros),
          odometroHrs:       odometroFinal,
          kmEstimado:        estimado || kmEstimado,
          obraId:            form.obraId        ? parseInt(form.obraId)        : undefined,
          operadorId:        form.operadorId    ? parseInt(form.operadorId)    : undefined,
          quienSuministraId: form.quienSuministraId ? parseInt(form.quienSuministraId) : undefined,
          quienRecibeId:     form.operadorId    ? parseInt(form.operadorId)    : undefined,
          tipoDiesel:        form.tipoDiesel,
          notas:             form.notas || undefined,
        });

        setSuccess({ litros: parseFloat(form.litros), unidad: unidadSel?.codigo ?? "" });
        const { fecha, hora } = getNow();
        setForm((prev) => ({
          ...prev,
          fecha,
          hora,
          unidadId:    "",
          litros:      "",
          odometroHrs: "",
          obraId:      "",
          operadorId:  "",
          quienSuministraId: "",
          notas:       "",
        }));
        setUltimoKm(null);
        setKmEstimado(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const litrosNum   = parseFloat(form.litros) || 0;
  const saldoDespues = saldoNissan - litrosNum;

  return (
    <div className="max-w-lg w-full mx-auto">

      {/* ── Success ──────────────────────────────────────────── */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border mb-6"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              Carga registrada — {success.unidad}
            </p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              {success.litros} L en campo
            </p>
          </div>
          <button onClick={() => setSuccess(null)}
            className="ml-auto text-xs px-2 py-1 rounded-lg hover:bg-[var(--surface-2)]"
            style={{ color: "var(--fg-muted)" }}>×</button>
        </div>
      )}

      {/* ── Saldo NISSAN ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-6"
        style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
        <Fuel className="w-5 h-5 text-violet-500 shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
            Saldo NISSAN
          </p>
          <p className="font-mono font-bold text-xl" style={{ color: "var(--fg)" }}>
            {saldoNissan > 0 ? `${saldoNissan.toLocaleString()} L` : "Sin datos"}
          </p>
        </div>
        {litrosNum > 0 && (
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Después</p>
            <p className={`font-mono font-bold text-lg ${saldoDespues < 100 ? "text-red-500" : "text-emerald-500"}`}>
              {saldoDespues.toLocaleString()} L
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Folio NISSAN ─────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="folioNissan">Folio NISSAN *</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 pointer-events-none" />
            <Input id="folioNissan" name="folioNissan" type="number"
              value={form.folioNissan} onChange={handleChange}
              placeholder={String(siguienteFolio ?? "")}
              className="font-mono font-bold text-xl h-12 pl-9" />
          </div>
          <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
            Auto-generado. Edita si el ticket físico tiene número distinto.
          </p>
        </div>

        {/* ── Fecha y hora ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fecha">Fecha</Label>
            <Input id="fecha" name="fecha" type="date" value={form.fecha} onChange={handleChange} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hora">Hora</Label>
            <Input id="hora" name="hora" type="time" value={form.hora} onChange={handleChange} />
          </div>
        </div>

        {/* ── Unidad ───────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="unidadId">Unidad *</Label>
          <Select id="unidadId" name="unidadId" value={form.unidadId} onChange={handleChange}
            className="text-base h-12">
            <option value="">— Seleccionar unidad —</option>
            {unidades.filter((u) => u.tipo === "camion").map((u) => (
              <option key={u.id} value={u.id}>{u.codigo}</option>
            ))}
            <optgroup label="Maquinaria">
              {unidades.filter((u) => u.tipo === "maquina" || u.tipo === "otro").map((u) => (
                <option key={u.id} value={u.id}>{u.codigo}{u.nombre ? ` — ${u.nombre}` : ""}</option>
              ))}
            </optgroup>
          </Select>
        </div>

        {/* ── Litros ───────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="litros">Litros *</Label>
          <div className="relative">
            <Input id="litros" name="litros" type="number" step="0.5" min="1"
              value={form.litros} onChange={handleChange}
              placeholder="0"
              className="text-3xl font-bold font-mono h-16 pr-12 text-right" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: "var(--fg-muted)" }}>L</span>
          </div>
        </div>

        {/* ── KM / HRS con validación ──────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="odometroHrs">
              KM / HRS
              {loadingKm && <Loader2 className="inline w-3 h-3 ml-1.5 animate-spin opacity-50" />}
              {ultimoKm !== null && !loadingKm && (
                <span className="ml-1.5 text-[10px] font-normal" style={{ color: "var(--fg-muted)" }}>
                  (último: {ultimoKm.toLocaleString()})
                </span>
              )}
            </Label>
            {/* Botón usar último km */}
            {ultimoKm !== null && !form.odometroHrs && (
              <button type="button" onClick={usarUltimoKm}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors"
                style={{
                  color: "var(--fg-muted)",
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}>
                Usar último ({ultimoKm.toLocaleString()})
              </button>
            )}
          </div>
          <Input id="odometroHrs" name="odometroHrs" type="number" step="1"
            value={form.odometroHrs} onChange={handleChange}
            placeholder={ultimoKm ? String(ultimoKm) : "29982"}
            className={`font-mono ${kmWarning ? "border-amber-500/60" : ""}`} />
          {/* Estimado badge */}
          {kmEstimado && !form.odometroHrs && (
            <p className="text-[10px] text-amber-500 flex items-center gap-1">
              <TriangleAlert className="w-3 h-3" />
              Se usará el último km registrado ({ultimoKm?.toLocaleString()}) — marcado como estimado
            </p>
          )}
          {/* Warning de rango */}
          {kmWarning && (
            <p className="text-[10px] text-amber-500 flex items-center gap-1">
              <TriangleAlert className="w-3 h-3" /> {kmWarning}
            </p>
          )}
        </div>

        {/* ── Obra con creación on-the-fly ─────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="obraId">Obra</Label>
            {!creandoObra && (
              <button type="button" onClick={abrirCrearObra}
                className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md border transition-colors"
                style={{
                  color: "var(--fg-muted)",
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-2)",
                }}>
                <Plus className="w-3 h-3" /> Nueva obra
              </button>
            )}
          </div>

          {!creandoObra ? (
            <Select id="obraId" name="obraId" value={form.obraId} onChange={handleChange}>
              <option value="">— Sin obra —</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </Select>
          ) : (
            <div className="flex flex-col gap-2 p-3 rounded-xl border"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                Nueva obra
              </p>
              <div className="flex gap-2">
                <Input
                  ref={nuevaObraInputRef}
                  value={nuevaObraNombre}
                  onChange={(e) => setNuevaObraNombre(e.target.value)}
                  placeholder="Nombre de la obra o ubicación"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); guardarObra(); } }}
                  className="flex-1"
                />
                <Button type="button" size="sm" onClick={guardarObra} disabled={savingObra}>
                  {savingObra ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Crear"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={cancelarCrearObra}>
                  ×
                </Button>
              </div>
              {errorObra && <p className="text-xs text-red-500">{errorObra}</p>}
            </div>
          )}
        </div>

        {/* ── Quien suministra / Quien recibe (A3) ─────────────── */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
            Cadena de custodia
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quienSuministraId">Quien suministra</Label>
              <Select id="quienSuministraId" name="quienSuministraId"
                value={form.quienSuministraId} onChange={handleChange}>
                <option value="">— Operador NISSAN —</option>
                {operadores.map((o) => (
                  <option key={o.id} value={o.id}>{o.nombre}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="operadorId">Quien recibe</Label>
              <Select id="operadorId" name="operadorId" value={form.operadorId} onChange={handleChange}>
                <option value="">— Chofer / Maquinista —</option>
                {operadores.map((o) => (
                  <option key={o.id} value={o.id}>{o.nombre}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* ── Tipo diesel ──────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="tipoDiesel">Origen del diesel</Label>
          <Select id="tipoDiesel" name="tipoDiesel" value={form.tipoDiesel} onChange={handleChange}>
            <option value="normal">Taller (normal)</option>
            <option value="amigo">Amigo (verde)</option>
            <option value="oxxogas">OxxoGas (rojo)</option>
          </Select>
        </div>

        {/* ── Notas ────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas</Label>
          <Textarea id="notas" name="notas" value={form.notas} onChange={handleChange}
            placeholder="Observaciones..." rows={2} />
        </div>

        {error && (
          <p className="text-sm flex items-center gap-1.5 text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" size="xl" className="w-full" disabled={isPending}>
          {isPending ? "Registrando..." : "Registrar Carga en Campo"}
        </Button>
      </form>
    </div>
  );
}
