"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Fuel, Hash, AlertCircle, Loader2, TriangleAlert, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createCargaPatio, getUltimoOdometro } from "@/app/actions/cargas";
import { saveArchivoFoto } from "@/app/actions/archivos";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

const KM_MAX_DIFERENCIA = 1100;

type Unidad = { id: number; codigo: string; nombre: string | null; tipo: string };
type Operador = { id: number; nombre: string; tipo: string };

function getNow() {
  const now = new Date();
  return { fecha: now.toISOString().split("T")[0], hora: now.toTimeString().slice(0, 5) };
}

export default function FormCargaPatio({
  unidades,
  operadores,
  siguienteFolio,
  stockActual,
  ultimaCuentaLt,
}: {
  unidades: Unidad[];
  operadores: Operador[];
  siguienteFolio: number;
  stockActual: number;
  ultimaCuentaLt?: number | null;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState<{ folio: number; litros: number } | null>(null);
  const [error, setError] = useState("");

  // Km validation
  const [ultimoKm, setUltimoKm]   = useState<number | null>(null);
  const [loadingKm, setLoadingKm] = useState(false);
  const [kmWarning, setKmWarning] = useState("");
  const [kmEstimado, setKmEstimado] = useState(false);

  // Camera foto odómetro
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [odometroFoto, setOdometroFoto] = useState<File | null>(null);
  const [odometroFotoPreview, setOdometroFotoPreview] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing("notaFoto");

  const { fecha: fechaInit, hora: horaInit } = getNow();

  const [form, setForm] = useState({
    fecha: fechaInit,
    hora: horaInit,
    unidadId: "",
    litros: "",
    odometroHrs: "",
    cuentaLtInicio: ultimaCuentaLt != null ? String(ultimaCuentaLt) : "",
    cuentaLtFin: "",
    operadorId: "",
    notas: "",
  });

  useEffect(() => {
    if (!form.unidadId) { setUltimoKm(null); setKmWarning(""); setKmEstimado(false); return; }
    setLoadingKm(true);
    setKmWarning("");
    getUltimoOdometro(parseInt(form.unidadId)).then((km) => { setUltimoKm(km); setLoadingKm(false); });
  }, [form.unidadId]);

  useEffect(() => {
    const km = parseFloat(form.odometroHrs);
    setKmEstimado(false);
    if (!form.odometroHrs || isNaN(km)) { setKmWarning(""); return; }
    if (ultimoKm !== null && km < ultimoKm) {
      setKmWarning(`Menor al último registrado (${ultimoKm.toLocaleString()})`);
    } else if (ultimoKm !== null && km - ultimoKm > KM_MAX_DIFERENCIA) {
      setKmWarning(`Diferencia de ${(km - ultimoKm).toLocaleString()} km excede el límite de ${KM_MAX_DIFERENCIA} km`);
    } else {
      setKmWarning("");
    }
  }, [form.odometroHrs, ultimoKm]);

  useEffect(() => {
    const inicio = parseFloat(form.cuentaLtInicio);
    const litros = parseFloat(form.litros);
    if (!isNaN(inicio) && !isNaN(litros) && litros > 0) {
      setForm((prev) => ({ ...prev, cuentaLtFin: String(inicio + litros) }));
    }
  }, [form.cuentaLtInicio, form.litros]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOdometroFoto(file);
    const url = URL.createObjectURL(file);
    setOdometroFotoPreview(url);
  }

  function clearFoto() {
    setOdometroFoto(null);
    if (odometroFotoPreview) URL.revokeObjectURL(odometroFotoPreview);
    setOdometroFotoPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.unidadId) { setError("Selecciona una unidad"); return; }
    const litros = parseFloat(form.litros);
    if (!litros || litros <= 0) { setError("Ingresa los litros"); return; }
    if (litros > stockActual) {
      setError(`Stock insuficiente. Taller tiene ${stockActual.toLocaleString()} L disponibles`);
      return;
    }

    const kmVal = parseFloat(form.odometroHrs);
    if (form.odometroHrs && !isNaN(kmVal)) {
      if (ultimoKm !== null && kmVal < ultimoKm) {
        setError(`El km (${kmVal.toLocaleString()}) no puede ser menor al anterior (${ultimoKm.toLocaleString()})`);
        return;
      }
      if (ultimoKm !== null && kmVal - ultimoKm > KM_MAX_DIFERENCIA) {
        setError(`Diferencia de ${(kmVal - ultimoKm).toLocaleString()} km excede el límite de ${KM_MAX_DIFERENCIA} km`);
        return;
      }
    }

    let odometroFinal: number | undefined;
    let estimado = false;
    if (form.odometroHrs && !isNaN(parseFloat(form.odometroHrs))) {
      odometroFinal = parseFloat(form.odometroHrs);
    } else if (ultimoKm !== null) {
      odometroFinal = ultimoKm;
      estimado = true;
    }

    setIsPending(true);
    try {
      const result = await createCargaPatio({
        fecha: form.fecha,
        hora: form.hora,
        unidadId: parseInt(form.unidadId),
        litros,
        odometroHrs:    odometroFinal,
        kmEstimado:     estimado || kmEstimado,
        cuentaLtInicio: form.cuentaLtInicio ? parseFloat(form.cuentaLtInicio) : undefined,
        cuentaLtFin:    form.cuentaLtFin    ? parseFloat(form.cuentaLtFin)    : undefined,
        operadorId:     form.operadorId ? parseInt(form.operadorId) : undefined,
        tipoDiesel:     "normal",
        notas:          form.notas || undefined,
      });

      // Subir foto de odómetro si hay
      if (odometroFoto) {
        const uploaded = await startUpload([odometroFoto]);
        if (uploaded?.[0]) {
          await saveArchivoFoto(result.cargaId, uploaded[0].url, uploaded[0].key, "odometroFoto");
        }
      }

      setSuccess({ folio: result.folio, litros });
      clearFoto();
      const nextCuentaLt = form.cuentaLtFin;
      const { fecha, hora } = getNow();
      setForm((prev) => ({
        ...prev, fecha, hora, unidadId: "", litros: "", odometroHrs: "",
        cuentaLtInicio: nextCuentaLt, cuentaLtFin: "", notas: "",
      }));
      setUltimoKm(null);
      setKmEstimado(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsPending(false);
    }
  }

  const litrosNum = parseFloat(form.litros) || 0;
  const stockDespues = stockActual - litrosNum;
  const superaStock = litrosNum > 0 && litrosNum > stockActual;

  return (
    <div className="max-w-lg w-full mx-auto">
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border mb-6"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              Carga registrada — Folio {success.folio}
            </p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              {success.litros} L despachados correctamente
            </p>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-auto text-xs px-2 py-1 rounded-lg hover:bg-[var(--surface-2)]"
            style={{ color: "var(--fg-muted)" }}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Folio y stock */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
            <Hash className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Folio</p>
              <p className="font-mono font-bold text-lg" style={{ color: "var(--fg)" }}>{siguienteFolio}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
            <Fuel className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Stock Taller</p>
              <p className={cn("font-mono font-bold text-lg", stockDespues < 500 ? "text-red-500" : "text-emerald-500")}>
                {stockActual > 0 ? `${stockActual.toLocaleString()} L` : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Fecha y hora */}
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

        {/* Unidad */}
        <div className="space-y-1.5">
          <Label htmlFor="unidadId">Unidad *</Label>
          <Select id="unidadId" name="unidadId" value={form.unidadId} onChange={handleChange} className="text-base h-12">
            <option value="">— Seleccionar unidad —</option>
            {unidades.filter((u) => u.tipo === "camion" || u.tipo === "nissan").map((u) => (
              <option key={u.id} value={u.id}>{u.codigo}{u.nombre && u.nombre !== u.codigo ? ` — ${u.nombre}` : ""}</option>
            ))}
            <optgroup label="Maquinaria">
              {unidades.filter((u) => u.tipo === "maquina" || u.tipo === "otro").map((u) => (
                <option key={u.id} value={u.id}>{u.codigo}{u.nombre && u.nombre !== u.codigo ? ` — ${u.nombre}` : ""}</option>
              ))}
            </optgroup>
          </Select>
        </div>

        {/* Litros */}
        <div className="space-y-1.5">
          <Label htmlFor="litros">Litros *</Label>
          <div className="relative">
            <Input id="litros" name="litros" type="number" step="0.5" min="1"
              value={form.litros} onChange={handleChange} placeholder="0"
              className={cn("text-3xl font-bold font-mono h-16 pr-12 text-right", superaStock && "border-red-500")} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: "var(--fg-muted)" }}>L</span>
          </div>
          {litrosNum > 0 && !superaStock && (
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Stock después:{" "}
              <span className={cn("font-semibold font-mono", stockDespues < 500 ? "text-amber-500" : "text-emerald-500")}>
                {stockDespues.toLocaleString()} L
              </span>
            </p>
          )}
          {superaStock && (
            <p className="text-xs flex items-center gap-1 text-red-500 font-semibold">
              <AlertCircle className="w-3 h-3" /> Supera el stock disponible ({stockActual.toLocaleString()} L)
            </p>
          )}
        </div>

        {/* Odómetro + foto */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="odometroHrs">
              Odómetro / Horas
              {loadingKm && <Loader2 className="inline w-3 h-3 ml-1.5 animate-spin opacity-50" />}
              {ultimoKm !== null && !loadingKm && (
                <span className="ml-1.5 text-[10px] font-normal" style={{ color: "var(--fg-muted)" }}>
                  (último: {ultimoKm.toLocaleString()})
                </span>
              )}
            </Label>
            {ultimoKm !== null && !form.odometroHrs && (
              <button type="button"
                onClick={() => { setForm((p) => ({ ...p, odometroHrs: String(ultimoKm) })); setKmEstimado(true); setKmWarning(""); }}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors"
                style={{ color: "var(--fg-muted)", borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
                Usar último ({ultimoKm.toLocaleString()})
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Input id="odometroHrs" name="odometroHrs" type="number" step="1"
              value={form.odometroHrs} onChange={handleChange}
              placeholder={ultimoKm ? String(ultimoKm) : "476767"}
              className={cn("flex-1", kmWarning ? "border-amber-500/60" : "")} />
            {/* Botón cámara */}
            <button type="button" onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium shrink-0 transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: odometroFoto ? "var(--fg)" : "var(--fg-muted)" }}
              title="Tomar foto del odómetro">
              {odometroFoto ? (
                <span className="flex items-center gap-1 text-emerald-500">
                  <Camera className="w-4 h-4" /> Foto ✓
                </span>
              ) : (
                <><Camera className="w-4 h-4" /> Foto</>
              )}
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
              className="hidden" onChange={handleFotoChange} />
          </div>
          {odometroFotoPreview && (
            <div className="relative w-full">
              <img src={odometroFotoPreview} alt="Odómetro"
                className="w-full h-28 object-cover rounded-xl border" style={{ borderColor: "var(--border)" }} />
              <button type="button" onClick={clearFoto}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {kmEstimado && !form.odometroHrs && (
            <p className="text-[10px] text-amber-500 flex items-center gap-1">
              <TriangleAlert className="w-3 h-3" />
              Se usará el último km registrado ({ultimoKm?.toLocaleString()}) — marcado como estimado
            </p>
          )}
          {kmWarning && (
            <p className="text-[10px] text-amber-500 flex items-center gap-1">
              <TriangleAlert className="w-3 h-3" /> {kmWarning}
            </p>
          )}
        </div>

        {/* Cuentalitros */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cuentaLtInicio">
              Cuenta LT Inicio
              {ultimaCuentaLt != null && (
                <span className="ml-1.5 font-normal text-xs" style={{ color: "var(--fg-muted)" }}>
                  (anterior: {ultimaCuentaLt.toLocaleString()})
                </span>
              )}
            </Label>
            <Input id="cuentaLtInicio" name="cuentaLtInicio" type="number" step="1"
              value={form.cuentaLtInicio} onChange={handleChange} placeholder="2460100" className="font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cuentaLtFin">Cuenta LT Fin</Label>
            <Input id="cuentaLtFin" name="cuentaLtFin" type="number" step="1"
              value={form.cuentaLtFin} onChange={handleChange} placeholder="2460200" className="font-mono" />
            <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Auto-calculado</p>
          </div>
        </div>

        {/* Operador */}
        <div className="space-y-1.5">
          <Label htmlFor="operadorId">Operador</Label>
          <Select id="operadorId" name="operadorId" value={form.operadorId} onChange={handleChange}>
            <option value="">— Ninguno —</option>
            {operadores.map((o) => (
              <option key={o.id} value={o.id}>{o.nombre}</option>
            ))}
          </Select>
        </div>

        {/* Notas */}
        <div className="space-y-1.5">
          <Label htmlFor="notas">Notas</Label>
          <Textarea id="notas" name="notas" value={form.notas} onChange={handleChange}
            placeholder="Observaciones opcionales..." rows={2} />
        </div>

        {error && (
          <p className="text-sm flex items-center gap-1.5 text-red-500">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}

        <Button type="submit" size="xl" className="w-full" disabled={isPending || isUploading || superaStock}>
          {isPending ? (isUploading ? "Subiendo foto..." : "Registrando...") : "Registrar Carga"}
        </Button>
      </form>
    </div>
  );
}
