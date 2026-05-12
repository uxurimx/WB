"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle, Fuel, AlertCircle, Hash, Plus, Loader2, TriangleAlert, Camera, X,
  Clock, MapPin, User, History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCargaCampo, getUltimoOdometro, getUltimaCargaUnidad } from "@/app/actions/cargas";
import { saveArchivoFoto } from "@/app/actions/archivos";
import { createObraRapida } from "@/app/actions/catalogo";
import { useUploadThing } from "@/lib/uploadthing";

type Unidad  = { id: number; codigo: string; nombre: string | null; tipo: string };
type Operador = { id: number; nombre: string };
type Obra    = { id: number; nombre: string };

function getNow() {
  const now = new Date();
  return { fecha: now.toISOString().split("T")[0], hora: now.toTimeString().slice(0, 5) };
}

const KM_MAX_DIFERENCIA = 1100;

export default function FormCargaCampo({
  unidades,
  operadores,
  obras: obrasProp,
  saldoNissan,
  cuentalitrosNissan: cuentalitrosNissanProp = 0,
  siguienteFolio,
  folioMin = 0,
  folioMax = 0,
}: {
  unidades:      Unidad[];
  operadores:    Operador[];
  obras:         Obra[];
  saldoNissan:   number;
  cuentalitrosNissan?: number;
  siguienteFolio?: number;
  folioMin?: number;
  folioMax?: number;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState<{ litros: number; unidad: string } | null>(null);
  const [error, setError]     = useState("");
  const [cuentalitrosNissan, setCuentalitrosNissan] = useState(cuentalitrosNissanProp);
  const skipFolioEffect = useRef(false);

  const [obras, setObras]             = useState<Obra[]>(obrasProp);
  const [creandoObra, setCreandoObra] = useState(false);
  const [nuevaObraNombre, setNuevaObraNombre] = useState("");
  const [errorObra, setErrorObra]     = useState("");
  const [savingObra, setSavingObra]   = useState(false);
  const nuevaObraInputRef = useRef<HTMLInputElement>(null);

  // Última carga de la unidad (anti-fraude)
  type UltimaCarga = Awaited<ReturnType<typeof getUltimaCargaUnidad>>;
  const [ultimaCarga,      setUltimaCarga]      = useState<UltimaCarga>(null);
  const [loadingUltima,    setLoadingUltima]    = useState(false);

  // Km validation
  const [ultimoKm, setUltimoKm]     = useState<number | null>(null);
  const [loadingKm, setLoadingKm]   = useState(false);
  const [kmWarning, setKmWarning]   = useState("");
  const [kmEstimado, setKmEstimado] = useState(false);

  // Camera foto odómetro
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [odometroFoto, setOdometroFoto] = useState<File | null>(null);
  const [odometroFotoPreview, setOdometroFotoPreview] = useState<string | null>(null);

  const [fotoWarning, setFotoWarning] = useState("");
  const { startUpload, isUploading } = useUploadThing("notaFoto", {
    onUploadError: (err) => setFotoWarning(`Error al subir foto: ${err.message}`),
  });

  const { fecha: fechaInit, hora: horaInit } = getNow();

  const [form, setForm] = useState({
    fecha: fechaInit,
    hora:  horaInit,
    folioNissan:       siguienteFolio != null ? String(siguienteFolio) : "",
    unidadId:          "",
    litros:            "",
    odometroHrs:       "",
    cuentaLtInicio:    cuentalitrosNissanProp > 0 ? String(cuentalitrosNissanProp) : "",
    cuentaLtFin:       "",
    obraId:            "",
    operadorId:        "",
    quienSuministraId: "",
    notas:             "",
  });

  // Sync folio cuando el server refresca el prop — skipFolioEffect protege el valor local post-submit
  useEffect(() => {
    if (skipFolioEffect.current) {
      skipFolioEffect.current = false;
      return;
    }
    if (siguienteFolio != null) {
      setForm((prev) => ({ ...prev, folioNissan: String(siguienteFolio) }));
    }
  }, [siguienteFolio]);

  useEffect(() => {
    if (!form.unidadId) {
      setUltimoKm(null); setKmWarning(""); setKmEstimado(false);
      setUltimaCarga(null);
      return;
    }
    const id = parseInt(form.unidadId);
    setLoadingKm(true);
    setLoadingUltima(true);
    setKmWarning("");
    getUltimoOdometro(id).then((km) => { setUltimoKm(km); setLoadingKm(false); });
    getUltimaCargaUnidad(id).then((uc) => { setUltimaCarga(uc); setLoadingUltima(false); });
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
    } else {
      setForm((prev) => ({ ...prev, cuentaLtFin: "" }));
    }
  }, [form.cuentaLtInicio, form.litros]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOdometroFoto(file);
    setOdometroFotoPreview(URL.createObjectURL(file));
  }

  function clearFoto() {
    setOdometroFoto(null);
    if (odometroFotoPreview) URL.revokeObjectURL(odometroFotoPreview);
    setOdometroFotoPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  function usarUltimoKm() {
    if (ultimoKm === null) return;
    setForm((prev) => ({ ...prev, odometroHrs: String(ultimoKm) }));
    setKmEstimado(true);
    setKmWarning("");
  }

  function abrirCrearObra() {
    setCreandoObra(true); setNuevaObraNombre(""); setErrorObra("");
    setTimeout(() => nuevaObraInputRef.current?.focus(), 50);
  }

  function cancelarCrearObra() { setCreandoObra(false); setNuevaObraNombre(""); setErrorObra(""); }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.folioNissan) { setError("El folio NISSAN es requerido"); return; }
    const folioNum = parseInt(form.folioNissan);
    if (isNaN(folioNum) || folioNum <= 0) { setError("Folio inválido"); return; }
    if (folioMin > 0 && folioNum < folioMin) { setError(`Folio mínimo para campo: ${folioMin}`); return; }
    if (folioMax > 0 && folioNum > folioMax) { setError(`Folio máximo para campo: ${folioMax}`); return; }
    if (!form.unidadId)    { setError("Selecciona una unidad"); return; }
    const litros = parseFloat(form.litros);
    if (!litros || litros <= 0) { setError("Ingresa los litros"); return; }
    if (litros > saldoNissan) {
      setError(`Stock insuficiente. NISSAN tiene ${saldoNissan.toLocaleString()} L disponibles`);
      return;
    }
    const cuentaInicio = parseFloat(form.cuentaLtInicio);
    if (!form.cuentaLtInicio || isNaN(cuentaInicio)) {
      setError("El cuentalitros inicial es requerido"); return;
    }

    const kmVal = parseFloat(form.odometroHrs);
    if (form.odometroHrs && !isNaN(kmVal)) {
      if (ultimoKm !== null && kmVal < ultimoKm) {
        setError(`El km/hr (${kmVal.toLocaleString()}) no puede ser menor al anterior (${ultimoKm.toLocaleString()})`);
        return;
      }
      if (ultimoKm !== null && kmVal - ultimoKm > KM_MAX_DIFERENCIA) {
        setError(`La diferencia de ${(kmVal - ultimoKm).toLocaleString()} km excede el límite de ${KM_MAX_DIFERENCIA} km`);
        return;
      }
    }

    const unidadSel = unidades.find((u) => u.id === parseInt(form.unidadId));
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
      const result = await createCargaCampo({
        fecha:             form.fecha,
        hora:              form.hora,
        folioNissan:       parseInt(form.folioNissan),
        unidadId:          parseInt(form.unidadId),
        litros,
        odometroHrs:       odometroFinal,
        kmEstimado:        estimado || kmEstimado,
        cuentaLtInicio:    cuentaInicio,
        obraId:            form.obraId        ? parseInt(form.obraId)        : undefined,
        operadorId:        form.operadorId    ? parseInt(form.operadorId)    : undefined,
        quienSuministraId: form.quienSuministraId ? parseInt(form.quienSuministraId) : undefined,
        quienRecibeId:     form.operadorId    ? parseInt(form.operadorId)    : undefined,
        tipoDiesel:        "normal",
        notas:             form.notas || undefined,
      });

      // Subir foto y guardar referencia en DB
      if (odometroFoto) {
        try {
          const uploaded = await startUpload([odometroFoto]);
          if (uploaded?.[0]) {
            const fotoUrl = uploaded[0].ufsUrl || uploaded[0].url;
            await saveArchivoFoto(result.cargaId, fotoUrl, uploaded[0].key, "odometroFoto");
          }
        } catch {
          // onUploadError ya maneja el mensaje visible
        }
      }

      if (result.nuevoCuentalitrosNissan !== undefined) {
        setCuentalitrosNissan(result.nuevoCuentalitrosNissan);
      }
      setSuccess({ litros, unidad: unidadSel?.codigo ?? "" });
      clearFoto();
      const nextCuentaLt = form.cuentaLtFin;
      const { fecha, hora } = getNow();
      setForm((prev) => ({
        ...prev, fecha, hora, unidadId: "", litros: "", odometroHrs: "",
        cuentaLtInicio: nextCuentaLt, cuentaLtFin: "",
        obraId: "", operadorId: "", quienSuministraId: "", notas: "",
        // nextFolio viene del server tras el insert — autoritativo
        folioNissan: String(result.nextFolio),
      }));
      skipFolioEffect.current = true;
      setUltimoKm(null);
      setKmEstimado(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsPending(false);
    }
  }

  const litrosNum    = parseFloat(form.litros) || 0;
  const saldoDespues = saldoNissan - litrosNum;
  const superaStock  = litrosNum > 0 && litrosNum > saldoNissan;

  // Calcula horas transcurridas desde la última carga
  function horasDesde(createdAt: string | null, fecha: string, hora: string | null): number | null {
    try {
      const dt = hora
        ? new Date(`${fecha}T${hora}`)
        : new Date(`${fecha}T12:00:00`);
      return (Date.now() - dt.getTime()) / 3_600_000;
    } catch { return null; }
  }

  const unidadSel = form.unidadId
    ? unidades.find((u) => u.id === parseInt(form.unidadId))
    : null;
  const esMaquinaria = unidadSel?.tipo === "maquina" || unidadSel?.tipo === "otro";
  const horasUltima = ultimaCarga
    ? horasDesde(ultimaCarga.createdAt, ultimaCarga.fecha, ultimaCarga.hora)
    : null;
  // Alerta si fue hace menos de 4 horas
  const alertaFrecuencia = horasUltima !== null && horasUltima < 4;

  return (
    <div className="max-w-lg w-full mx-auto">

      {fotoWarning && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5 mb-4">
          <TriangleAlert className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-600 flex-1">{fotoWarning}</p>
          <button onClick={() => setFotoWarning("")} className="text-amber-500 hover:text-amber-700">×</button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border mb-6"
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}>
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
              Carga registrada — {success.unidad}
            </p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{success.litros} L en campo</p>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-auto text-xs px-2 py-1 rounded-lg hover:bg-[var(--surface-2)]"
            style={{ color: "var(--fg-muted)" }}>×</button>
        </div>
      )}

      {/* Saldo NISSAN */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border mb-6"
        style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
        <Fuel className="w-5 h-5 text-violet-500 shrink-0" />
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Saldo NISSAN</p>
          <p className="font-mono font-bold text-xl" style={{ color: "var(--fg)" }}>
            {saldoNissan > 0 ? `${saldoNissan.toLocaleString()} L` : "Sin datos"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
            Cuentalitros:{" "}
            <span className="font-mono font-semibold" style={{ color: "var(--fg)" }}>
              {cuentalitrosNissan > 0 ? cuentalitrosNissan.toLocaleString() : "—"}
            </span>
          </p>
        </div>
        {litrosNum > 0 && (
          <div className="text-right">
            <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Después</p>
            <p className={`font-mono font-bold text-lg ${superaStock ? "text-red-500" : saldoDespues < 100 ? "text-amber-500" : "text-emerald-500"}`}>
              {superaStock ? "—" : `${saldoDespues.toLocaleString()} L`}
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Folio NISSAN */}
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

        {/* Última carga — visible para cualquier unidad con historial */}
        {form.unidadId && (loadingUltima || ultimaCarga) && (
          <div className={`rounded-xl border p-3 space-y-2 text-xs transition-colors ${
            alertaFrecuencia
              ? "border-red-500/40 bg-red-500/5"
              : "border-amber-500/30 bg-amber-500/5"
          }`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold"
                style={{ color: alertaFrecuencia ? "rgb(239 68 68)" : "rgb(245 158 11)" }}>
                <History className="w-3.5 h-3.5 shrink-0" />
                Última carga registrada
              </div>
              {loadingUltima && <Loader2 className="w-3 h-3 animate-spin" style={{ color: "var(--fg-muted)" }} />}
              {!loadingUltima && ultimaCarga && horasUltima !== null && (
                <span className={`font-mono font-bold ${alertaFrecuencia ? "text-red-500" : ""}`}
                  style={!alertaFrecuencia ? { color: "var(--fg-muted)" } : undefined}>
                  {horasUltima < 1
                    ? `hace ${Math.round(horasUltima * 60)} min`
                    : `hace ${horasUltima.toFixed(1)} h`}
                </span>
              )}
            </div>

            {!loadingUltima && ultimaCarga && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <span style={{ color: "var(--fg-muted)" }}>Folio</span>
                  <span className="font-mono font-semibold ml-auto" style={{ color: "var(--fg)" }}>
                    {ultimaCarga.folio ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <span style={{ color: "var(--fg-muted)" }}>
                    {ultimaCarga.fecha} {ultimaCarga.hora?.slice(0, 5) ?? ""}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Fuel className="w-3 h-3 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <span style={{ color: "var(--fg-muted)" }}>Litros</span>
                  <span className="font-mono font-bold ml-auto" style={{ color: "var(--fg)" }}>
                    {ultimaCarga.litros.toLocaleString()} L
                  </span>
                </div>
                {ultimaCarga.odometroHrs != null && (
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: "var(--fg-muted)" }}>Odóm./HRS</span>
                    <span className="font-mono ml-auto" style={{ color: "var(--fg)" }}>
                      {ultimaCarga.odometroHrs.toLocaleString()}
                    </span>
                  </div>
                )}
                {ultimaCarga.operadorNombre && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <User className="w-3 h-3 shrink-0" style={{ color: "var(--fg-muted)" }} />
                    <span style={{ color: "var(--fg-muted)" }}>{ultimaCarga.operadorNombre}</span>
                  </div>
                )}
                {ultimaCarga.obraNombre && (
                  <div className="flex items-center gap-1.5 col-span-2">
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: "var(--fg-muted)" }} />
                    <span style={{ color: "var(--fg-muted)" }}>{ultimaCarga.obraNombre}</span>
                  </div>
                )}
                {ultimaCarga.notas && (
                  <div className="col-span-2 text-[10px] px-1 py-0.5 rounded"
                    style={{ color: "var(--fg-muted)", backgroundColor: "var(--surface-2)" }}>
                    {ultimaCarga.notas}
                  </div>
                )}
              </div>
            )}

            {alertaFrecuencia && (
              <div className="flex items-start gap-1.5 pt-1 border-t border-red-500/20">
                <TriangleAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-500 font-semibold">
                  Recarga reciente — verifica que sea necesaria
                </p>
              </div>
            )}
          </div>
        )}

        {/* Litros */}
        <div className="space-y-1.5">
          <Label htmlFor="litros">Litros *</Label>
          <div className="relative">
            <Input id="litros" name="litros" type="number" step="0.5" min="1"
              value={form.litros} onChange={handleChange} placeholder="0"
              className={`text-3xl font-bold font-mono h-16 pr-12 text-right${superaStock ? " border-red-500" : ""}`} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium"
              style={{ color: "var(--fg-muted)" }}>L</span>
          </div>
          {superaStock && (
            <p className="text-xs flex items-center gap-1 text-red-500 font-semibold">
              <AlertCircle className="w-3 h-3" /> Supera el stock NISSAN ({saldoNissan.toLocaleString()} L)
            </p>
          )}
        </div>

        {/* KM / HRS + foto */}
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
            {ultimoKm !== null && !form.odometroHrs && (
              <button type="button" onClick={usarUltimoKm}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-colors"
                style={{ color: "var(--fg-muted)", borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
                Usar último ({ultimoKm.toLocaleString()})
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Input id="odometroHrs" name="odometroHrs" type="number" step="1"
              value={form.odometroHrs} onChange={handleChange}
              placeholder={ultimoKm ? String(ultimoKm) : "29982"}
              className={`font-mono flex-1 ${kmWarning ? "border-amber-500/60" : ""}`} />
            <button type="button" onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium shrink-0 transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: odometroFoto ? "var(--fg)" : "var(--fg-muted)" }}
              title="Tomar foto del odómetro">
              {odometroFoto ? (
                <span className="flex items-center gap-1 text-emerald-500"><Camera className="w-4 h-4" /> Foto ✓</span>
              ) : (
                <><Camera className="w-4 h-4" /> Foto</>
              )}
            </button>
            <input ref={cameraInputRef} type="file" accept="image/*"
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
              Se usará el último km ({ultimoKm?.toLocaleString()}) — marcado como estimado
            </p>
          )}
          {kmWarning && (
            <p className="text-[10px] text-amber-500 flex items-center gap-1">
              <TriangleAlert className="w-3 h-3" /> {kmWarning}
            </p>
          )}
        </div>

        {/* Cuentalitros NISSAN */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cuentaLtInicio">
              Cuenta LT Inicio *
              {cuentalitrosNissan > 0 && (
                <span className="ml-1.5 font-normal text-xs" style={{ color: "var(--fg-muted)" }}>
                  (actual: {cuentalitrosNissan.toLocaleString()})
                </span>
              )}
            </Label>
            <Input id="cuentaLtInicio" name="cuentaLtInicio" type="number" step="1"
              value={form.cuentaLtInicio} onChange={handleChange}
              placeholder={cuentalitrosNissan > 0 ? String(cuentalitrosNissan) : "0"}
              className={`font-mono${!form.cuentaLtInicio ? " border-amber-500/50" : ""}`} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cuentaLtFin">Cuenta LT Fin</Label>
            <Input id="cuentaLtFin" name="cuentaLtFin" type="number" step="1"
              value={form.cuentaLtFin} readOnly
              placeholder="Auto-calculado"
              className="font-mono bg-[var(--surface-2)]" />
            <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>Inicio + litros</p>
          </div>
        </div>

        {/* Obra */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="obraId">Obra</Label>
            {!creandoObra && (
              <button type="button" onClick={abrirCrearObra}
                className="text-[10px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md border transition-colors"
                style={{ color: "var(--fg-muted)", borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
                <Plus className="w-3 h-3" /> Nueva obra
              </button>
            )}
          </div>
          {!creandoObra ? (
            <Select id="obraId" name="obraId" value={form.obraId} onChange={handleChange}>
              <option value="">— Sin obra —</option>
              {obras.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
            </Select>
          ) : (
            <div className="flex flex-col gap-2 p-3 rounded-xl border"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">Nueva obra</p>
              <div className="flex gap-2">
                <Input ref={nuevaObraInputRef} value={nuevaObraNombre}
                  onChange={(e) => setNuevaObraNombre(e.target.value)}
                  placeholder="Nombre de la obra o ubicación"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); guardarObra(); } }}
                  className="flex-1" />
                <Button type="button" size="sm" onClick={guardarObra} disabled={savingObra}>
                  {savingObra ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Crear"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={cancelarCrearObra}>×</Button>
              </div>
              {errorObra && <p className="text-xs text-red-500">{errorObra}</p>}
            </div>
          )}
        </div>

        {/* Cadena de custodia */}
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
                {operadores.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="operadorId">Quien recibe</Label>
              <Select id="operadorId" name="operadorId" value={form.operadorId} onChange={handleChange}>
                <option value="">— Chofer / Maquinista —</option>
                {operadores.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
              </Select>
            </div>
          </div>
        </div>

        {/* Notas */}
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

        <Button type="submit" size="xl" className="w-full" disabled={isPending || isUploading || superaStock}>
          {isPending ? (isUploading ? "Subiendo foto..." : "Registrando...") : "Registrar Carga en Campo"}
        </Button>
      </form>
    </div>
  );
}
