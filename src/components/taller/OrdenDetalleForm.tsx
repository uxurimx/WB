"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Printer, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CHECKLIST_PUNTOS, ESTADO_LABEL, type EstadoOrden } from "@/lib/taller-checklist";
import { cancelarOrdenTaller, cerrarOrdenTaller, guardarOrdenTaller, reabrirOrdenTaller, terminarOrdenTaller, type RefaccionInput } from "@/app/actions/taller";
import ChecklistIngreso, { parseChecklistRow, serializeCheck, type CheckState } from "@/components/taller/ChecklistIngreso";
import { formatFechaHoraMx, getLocalDateString } from "@/lib/date-utils";
import { formatoFolioTaller, TALLER_CATEGORIAS, type CategoriaTaller } from "@/lib/taller-incidencias";
import { useUploadThing } from "@/lib/uploadthing";
import FotoLightbox from "@/components/taller/FotoLightbox";
import { parseActividadesTaller, serializeActividadesTaller, type ActividadTaller } from "@/lib/taller-actividades";
import DateDmyInput from "@/components/taller/DateDmyInput";

type MediaFile = { url: string; key: string; tipo: "imagen" | "video" };
const actividadVacia = (): ActividadTaller => ({ atendio: "", trabajo: "" });

type Orden = {
  id: number;
  folio: number | null;
  unidadId: number;
  incidenciaId: number | null;
  operadorId: number | null;
  fecha: string;
  createdAt: string | Date | null;
  kmHrs: number | null;
  motivo: string | null;
  categoria: string;
  estado: string;
  esPreventivo: boolean;
  tipoControlPreventivo: string | null;
  quienRecibio: string | null;
  quienAtendio: string | null;
  mecanicos: string | null;
  mecanicoOtro: string | null;
  proveedorExterno: string | null;
  proveedorExternoReady: boolean;
  comentarios: string | null;
  diagnosticoFinal: string | null;
  trabajoRealizado: string | null;
  observacionesSalida: string | null;
  quienEntrega: string | null;
  fechaSalida: Date | string | null;
  extensionReady: boolean;
  proximoMto: string | null;
  fotosIngreso: string | null;
  fotosSalida: string | null;
  unidad: { codigo: string; tipo?: string } | null;
  operador: { id: number; nombre: string } | null;
  abiertoPorNombre?: string | null;
  actualizadoPorNombre?: string | null;
  cerradoPorNombre?: string | null;
  log?: { accion: string; at: string | null; nombre: string }[];
  checklist: { clave: string; ok: boolean | null; respuesta?: string | null; nota: string | null; fotos?: string | null }[];
  refacciones: {
    descripcion: string;
    cantidad: number | null;
    cajas: number | null;
    unidadMedida: string;
    precio: number | null;
    iva: boolean;
    origen: string;
    proveedor: string | null;
    folioFactura: string | null;
  }[];
};

const emptyRef = (): RefaccionInput => ({
  descripcion: "",
  cantidad: 1,
  cajas: null,
  unidadMedida: "pz",
  precio: null,
  iva: true,
  origen: "Comprado",
  proveedor: "",
  folioFactura: "",
});

function MediaGallery({ label, items, locked, uploading, onAdd, onRemove, showHeader = true }: {
  label: string;
  items: MediaFile[];
  locked: boolean;
  uploading: boolean;
  onAdd: () => void;
  onRemove: (key: string) => void;
  showHeader?: boolean;
}) {
  return <div className="space-y-2">
    {showHeader && <div className="flex flex-wrap items-center gap-2">
      <p className="text-xs font-semibold">{label}</p>
      {!locked && <button type="button" disabled={uploading} onClick={onAdd} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold" style={{ borderColor: "var(--border)" }}><Camera className="h-3.5 w-3.5" />{uploading ? "Subiendo…" : "Foto o video"}</button>}
    </div>}
    {items.length > 0 && <div className="flex flex-wrap gap-2">{items.map((item) => <div key={item.key} className="relative overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
      {item.tipo === "video" ? <video src={item.url} controls className="h-24 w-36 object-cover" /> : <FotoLightbox foto={{ url: item.url, key: item.key, alt: label }} />}
      {!locked && <button type="button" aria-label="Quitar archivo" onClick={() => onRemove(item.key)} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"><X className="h-3 w-3" /></button>}
    </div>)}</div>}
  </div>;
}

export default function OrdenDetalleForm({
  orden,
  operadores,
  sugeridas = { descripciones: [], proveedores: [] },
  initialTab = "datos",
  canFinishOrders = false,
  canCloseOrders = false,
  canCancelOrders = false,
  canReopenOrders = false,
  isTallerRole = false,
  intervaloMantenimiento = null,
}: {
  orden: Orden;
  operadores: { id: number; nombre: string }[];
  sugeridas?: { descripciones: string[]; proveedores: string[] };
  initialTab?: "datos" | "ingreso";
  canFinishOrders?: boolean;
  canCloseOrders?: boolean;
  canCancelOrders?: boolean;
  canReopenOrders?: boolean;
  isTallerRole?: boolean;
  intervaloMantenimiento?: number | null;
}) {
  const router = useRouter();
  const locked = orden.estado === "cerrada" || orden.estado === "cancelada";
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [estadoOrden, setEstadoOrden] = useState(orden.estado);
  const [operadorId, setOperadorId] = useState(orden.operadorId ? String(orden.operadorId) : "");
  const [fecha, setFecha] = useState(orden.fecha.slice(0, 10));
  const [kmHrs, setKmHrs] = useState(orden.kmHrs != null ? String(orden.kmHrs) : "");
  const [motivo, setMotivo] = useState(orden.motivo ?? "");
  const [categoria, setCategoria] = useState<CategoriaTaller>((orden.categoria as CategoriaTaller) || "correctivo");
  const [quienRecibio, setQuienRecibio] = useState(orden.quienRecibio ?? "");
  const [quienAtendio] = useState(orden.quienAtendio ?? "");
  const mecanicosGuardados = (() => { try { return JSON.parse(orden.mecanicos ?? "[]") as string[]; } catch { return []; } })();
  const [mecanicoOtro, setMecanicoOtro] = useState(orden.mecanicoOtro ?? "");
  const [proveedorExterno, setProveedorExterno] = useState(orden.proveedorExterno ?? "");
  const [actividades, setActividades] = useState<ActividadTaller[]>(() => {
    const rows = parseActividadesTaller(orden.trabajoRealizado ?? orden.comentarios, mecanicosGuardados.join(", ") || orden.quienAtendio || "");
    return rows.length ? rows : [actividadVacia()];
  });
  const proximoMatch = (orden.proximoMto ?? "").match(/([\d,.]+)\s*(hrs?|hor[oó]metro|km|kms?)/i);
  const [proximoActivo, setProximoActivo] = useState(Boolean(orden.proximoMto));
  const [proximoValor, setProximoValor] = useState(proximoMatch?.[1].replace(",", "") ?? (orden.proximoMto ? String(Number.parseFloat(orden.proximoMto) || "") : ""));
  const parseMedia = (value: string | null): MediaFile[] => { try { return value ? JSON.parse(value) as MediaFile[] : []; } catch { return []; } };
  const [fotosIngreso, setFotosIngreso] = useState<MediaFile[]>(() => parseMedia(orden.fotosIngreso));
  const [fotosSalida, setFotosSalida] = useState<MediaFile[]>(() => parseMedia(orden.fotosSalida));
  const [uploading, setUploading] = useState<"ingreso" | "salida" | null>(null);
  const inputIngreso = useRef<HTMLInputElement>(null);
  const inputSalida = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("tallerExpediente", { onUploadError: (e) => { setError(e.message); setUploading(null); } });
  const esPreventivo = orden.esPreventivo;
  const tipoPrev = orden.tipoControlPreventivo === "hrs" || (!orden.tipoControlPreventivo && orden.unidad?.tipo === "maquina") ? "hrs" : "km";
  const proximoValorCalculado = intervaloMantenimiento != null && kmHrs !== "" && Number.isFinite(Number(kmHrs))
    ? String(Number(kmHrs) + intervaloMantenimiento)
    : null;
  const proximoValorFinal = proximoValorCalculado ?? proximoValor;
  const fechaSalidaInicial = orden.fechaSalida
    ? typeof orden.fechaSalida === "string" ? orden.fechaSalida.slice(0, 10) : getLocalDateString(orden.fechaSalida)
    : "";
  const [fechaSalida, setFechaSalida] = useState(fechaSalidaInicial);
  const [sec, setSec] = useState<"datos" | "ingreso" | "piezas">(initialTab);
  const [checks, setChecks] = useState<Record<string, CheckState>>(() => {
    const map: Record<string, CheckState> = {};
    for (const p of CHECKLIST_PUNTOS) {
      map[p.clave] = parseChecklistRow(orden.checklist.find((c) => c.clave === p.clave));
    }
    return map;
  });
  const [refs, setRefs] = useState<RefaccionInput[]>(
    orden.refacciones.length ? orden.refacciones.map((r) => ({
      descripcion: r.descripcion,
      cantidad: r.cantidad,
      cajas: r.cajas,
      unidadMedida: r.unidadMedida || "pz",
      precio: r.precio,
      iva: r.iva,
      origen: r.origen || "Comprado",
      proveedor: r.proveedor ?? "",
      folioFactura: r.folioFactura ?? "",
    })) : [emptyRef()],
  );
  const lastSavedPayload = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canFinishNow = canFinishOrders && !["terminada", "cerrada", "cancelada"].includes(orden.estado);
  const canCloseNow = canCloseOrders && orden.estado === "terminada";

  function avanzarOrden() {
    const cerrar = canCloseOrders && orden.estado === "terminada";
    if (!confirm(cerrar ? "¿Cerrar esta orden de servicio?" : "¿Marcar el trabajo como terminado?")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    start(async () => {
      try {
        if (cerrar) {
          await cerrarOrdenTaller(orden.id, { datos: payload() });
        } else {
          await cerrarSaveBeforeFinish();
          await terminarOrdenTaller(orden.id);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo avanzar la orden.");
      }
    });
  }

  function reabrirOrden() {
    if (!confirm("¿Regresar esta orden a PENDIENTE DE CIERRE? El evento de mantenimiento vinculado se conservará para evitar duplicados.")) return;
    start(async () => {
      try {
        await reabrirOrdenTaller(orden.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo reabrir la orden.");
      }
    });
  }

  async function cerrarSaveBeforeFinish() {
    await guardarOrdenTaller(orden.id, payload());
  }

  function imprimirOrdenCompleta() {
    if (locked) {
      window.print();
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    start(async () => {
      try {
        const data = payload();
        await guardarOrdenTaller(orden.id, data);
        lastSavedPayload.current = JSON.stringify(data);
        window.print();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar la orden antes de imprimir.");
      }
    });
  }

  function cancelarOrden() {
    if (!confirm("¿Cancelar esta orden de servicio?")) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    start(async () => {
      try {
        await cancelarOrdenTaller(orden.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cancelar la orden.");
      }
    });
  }

  const actividadesNormalizadas = actividades.map((actividad) => ({
    ...actividad,
    atendio: actividad.atendio.split(",").map((nombre) => nombre.trim()).filter(Boolean).map((nombre) => nombre === "Otro" && mecanicoOtro.trim() ? mecanicoOtro.trim() : nombre).join(", "),
  }));
  const mecanicosLabel = [...new Set(actividadesNormalizadas.flatMap((actividad) => actividad.atendio.split(",").map((nombre) => nombre.trim()).filter(Boolean)))].join(", ");
  const mecanicos = [...new Set(actividadesNormalizadas.flatMap((actividad) => actividad.atendio.split(",").map((nombre) => nombre.trim()).filter(Boolean)))];

  function payload() {
    return {
      operadorId: operadorId ? Number(operadorId) : null,
      fecha,
      kmHrs: kmHrs ? Number(kmHrs) : null,
      motivo,
      categoria,
      quienRecibio,
      quienAtendio: mecanicosLabel || quienAtendio,
      mecanicos,
      mecanicoOtro,
      proveedorExterno,
      trabajoRealizado: serializeActividadesTaller(actividadesNormalizadas),
      fechaSalida: fechaSalida || null,
      proximoMto: proximoActivo && proximoValorFinal ? `${proximoValorFinal} ${tipoPrev}` : "",
      fotosIngreso,
      fotosSalida,
      esPreventivo,
      tipoControlPreventivo: esPreventivo ? tipoPrev : null,
      checklist: CHECKLIST_PUNTOS.map((p) => {
        const s = serializeCheck(checks[p.clave]);
        return { clave: p.clave, respuesta: s.respuesta, ok: s.ok, nota: s.nota || null, fotos: s.fotos };
      }),
      refacciones: refs,
    };
  }

  function save(estado?: "abierta" | "en_proceso", silent = false) {
    if (locked) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setError("");
    const data = payload();
    const fingerprint = JSON.stringify(data);
    start(async () => {
      try {
        await guardarOrdenTaller(orden.id, { ...data, estado });
        lastSavedPayload.current = fingerprint;
        if (estado) setEstadoOrden(estado);
        setOkMsg(silent ? "Guardado automáticamente." : "Guardado.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  useEffect(() => {
    if (locked) return;
    const fingerprint = JSON.stringify(payload());
    if (lastSavedPayload.current === null) {
      lastSavedPayload.current = fingerprint;
      return;
    }
    if (fingerprint === lastSavedPayload.current) return;
    const estadoAlEditar = estadoOrden === "abierta" ? "en_proceso" : undefined;
    saveTimer.current = setTimeout(() => save(estadoAlEditar, true), 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, motivo, categoria, quienRecibio, quienAtendio, kmHrs, mecanicoOtro, proveedorExterno, actividades, fechaSalida, proximoActivo, proximoValor, fotosIngreso, fotosSalida, operadorId, checks, refs, estadoOrden]);

  const total = refs.reduce((s, r) => {
    const p = (r.precio ?? 0) * (r.cantidad ?? 1);
    return s + (r.iva ? p * 1.16 : p);
  }, 0);
  const subtotal = refs.reduce((s, r) => s + (r.precio ?? 0) * (r.cantidad ?? 1), 0);
  const ivaTotal = refs.reduce((s, r) => s + (r.iva ? (r.precio ?? 0) * (r.cantidad ?? 1) * 0.16 : 0), 0);
  async function subirMedia(seccion: "ingreso" | "salida", files: FileList | null) {
    if (!files?.length || locked) return;
    const selected = Array.from(files).slice(0, 12);
    setUploading(seccion);
    try {
      const uploaded = await startUpload(selected);
      if (!uploaded?.length) return;
      const items = uploaded.map((file, index) => ({
        url: ("ufsUrl" in file && typeof file.ufsUrl === "string" ? file.ufsUrl : file.url) as string,
        key: file.key,
        tipo: selected[index]?.type.startsWith("video/") ? "video" as const : "imagen" as const,
      }));
      if (seccion === "ingreso") setFotosIngreso((current) => [...current, ...items]);
      else setFotosSalida((current) => [...current, ...items]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron subir los archivos.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="orden-servicio-print space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>
            Orden #{orden.id}
          </p>
          <h1 className="font-outfit font-bold text-3xl" style={{ color: "var(--fg)" }}>
            <Link href={`/catalogo/unidades/${orden.unidadId}`} className="hover:underline">
              {orden.unidad?.codigo ?? "Unidad"}
            </Link>
          </h1>
          <p className="text-sm font-mono font-semibold" style={{ color: "var(--fg-muted)" }}>{formatoFolioTaller(orden.folio)}</p>
          {proveedorExterno && <p className="mt-1 inline-flex rounded-full bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-800">Proveedor externo · {proveedorExterno}</p>}
          <p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>
            Creada {formatFechaHoraMx(orden.fecha, orden.createdAt instanceof Date ? orden.createdAt.toISOString() : orden.createdAt)}
          </p>
        </div>
        {!locked && !isTallerRole && (canFinishNow || canCloseNow || canCancelOrders) && (
          <div className="flex flex-wrap gap-2 print:hidden">
            {(canFinishNow || canCloseNow) && <button type="button" disabled={pending} onClick={avanzarOrden} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{pending ? "Procesando…" : canCloseNow ? "Cerrar orden" : "Pendiente de cierre"}</button>}
            {canCancelOrders && <button type="button" disabled={pending} onClick={cancelarOrden} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Cancelar</button>}
          </div>
        )}
        {orden.estado === "cerrada" && canReopenOrders && <button type="button" disabled={pending} onClick={reabrirOrden} className="rounded-lg border border-amber-500 px-3 py-2 text-xs font-semibold text-amber-700 disabled:opacity-50 print:hidden">Regresar a PENDIENTE DE CIERRE</button>}
        {!locked && orden.estado !== "terminada" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => save(estadoOrden === "en_proceso" ? "abierta" : "en_proceso")}
            title="Cambiar estado de la orden"
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:shadow-sm disabled:opacity-50 print:hidden"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <Badge variant={estadoOrden === "en_proceso" ? "default" : "warning"}>
              {ESTADO_LABEL[estadoOrden as EstadoOrden] ?? estadoOrden}
            </Badge>
            <span>{estadoOrden === "en_proceso" ? "Volver a ABIERTO" : "Marcar EN PROCESO"}</span>
          </button>
        ) : (
          <Badge variant={orden.estado === "cerrada" ? "success" : "secondary"}>
            {orden.estado === "cerrada" ? "Cerrada · entregada" : ESTADO_LABEL[orden.estado as EstadoOrden] ?? orden.estado}
          </Badge>
        )}
      </div>
      {okMsg && (
        <p className="print:hidden text-sm font-semibold text-emerald-700 rounded-xl border px-3 py-2" style={{ borderColor: "rgb(16 185 129 / 0.35)", backgroundColor: "rgb(16 185 129 / 0.08)" }}>
          {okMsg}
        </p>
      )}

      <div className="sticky top-0 z-30 -mx-2 flex gap-1 border-y px-2 py-2 print:hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        {([
          ["datos", "Datos"],
          ["ingreso", "Checklist"],
          ["piezas", "Refacciones"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSec(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold ${sec === k ? "bg-indigo-600 text-white" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {orden.motivo && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">{orden.incidenciaId ? `Falla reportada · Incidencia #${orden.incidenciaId}` : "Motivo de ingreso"}</p>
          <p className="text-sm mt-1 text-slate-800">{orden.motivo}</p>
        </div>
      )}

      <div className={`${sec === "datos" ? "" : "hidden"} print:block rounded-2xl border p-4 space-y-3 print:break-inside-avoid`} style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
        <div className="flex items-center justify-between gap-2 print:hidden"><p className="text-sm font-semibold">Datos de ingreso y servicio</p><button type="button" onClick={imprimirOrdenCompleta} title="Imprimir orden completa" aria-label="Imprimir orden completa" className="rounded-lg border p-2" style={{ borderColor: "var(--border)" }}><Printer className="h-4 w-4" /></button></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Fecha</Label>
            <DateDmyInput disabled={locked} value={fecha} onChange={setFecha} aria-label="Fecha (DD/MM/AAAA)" />
          </div>
          <div>
            <Label>Operador</Label>
            <Select disabled={locked} value={operadorId} onChange={(e) => setOperadorId(e.target.value)}>
              <option value="">—</option>
              {operadores.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Quién recibió</Label>
            <Input disabled={locked} value={quienRecibio} onChange={(e) => setQuienRecibio(e.target.value)} />
          </div>
          <div>
            <Label>Lectura (KM / HRS)</Label>
            <Input disabled={locked} type="number" inputMode="decimal" min="0" step="any" value={kmHrs} onChange={(e) => setKmHrs(e.target.value)} placeholder={tipoPrev === "hrs" ? "Horas actuales" : "Kilómetros actuales"} />
          </div>
        </div>
        <div>
          <Label>Categoría</Label>
          <Select disabled={locked} value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaTaller)}>
            {TALLER_CATEGORIAS.map((item) => <option key={item.value} value={item.value} disabled={item.value === "urea" || item.value === "llanta_danada"}>{item.label}</option>)}
          </Select>
          <p className="mt-1 text-[11px]" style={{ color: "var(--fg-muted)" }}>Urea y Llanta dañada se registran como incidencias en Bitácora, sin orden de taller.</p>
        </div>
        <div>
          <Label>Motivo</Label>
          <Input disabled={locked} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <div className="border-t pt-3 space-y-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold">Resolución y entrega</p>
          <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><Label>Actividades realizadas</Label>{!locked && <button type="button" onClick={() => setActividades((rows) => [...rows, { atendio: "", trabajo: "" }])} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold text-[#207783] transition hover:brightness-95" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}><Plus className="h-3.5 w-3.5" />Agregar actividad</button>}</div>
            <div className="hidden gap-2 text-[10px] font-semibold uppercase sm:grid sm:grid-cols-[minmax(0,1.35fr)_minmax(300px,1fr)_auto]"><span>Trabajo realizado</span><span>Atiende</span><span /></div>
            {actividades.map((actividad, index) => {
              const nombres = actividad.atendio.split(",").map((nombre) => nombre.trim()).filter(Boolean);
              return <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1.35fr)_minmax(300px,1fr)_auto]">
              <Input disabled={locked || !orden.extensionReady} value={actividad.trabajo} onChange={(e) => setActividades((rows) => rows.map((row, i) => i === index ? { ...row, trabajo: e.target.value } : row))} placeholder="Describe la actividad realizada" className="h-10" />
              <div className="flex flex-wrap content-start gap-1.5">
                {["Oscar", "Carlos", "Rolando", "Otro", "Externo"].map((nombre) => {
                  const active = nombres.includes(nombre) || (nombre === "Otro" && Boolean(mecanicoOtro.trim()) && nombres.includes(mecanicoOtro.trim()));
                  return <button key={nombre} type="button" disabled={locked} aria-pressed={active} onClick={() => setActividades((rows) => rows.map((row, i) => {
                    if (i !== index) return row;
                    const current = row.atendio.split(",").map((item) => item.trim()).filter(Boolean);
                    const next = current.includes(nombre) ? current.filter((item) => item !== nombre) : [...current, nombre];
                    return { ...row, atendio: next.join(", ") };
                  }))} className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${active ? "border-[#207783] bg-[#207783] text-white" : ""}`} style={active ? undefined : { borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>{nombre}</button>;
                })}
              </div>
              {!locked && <button type="button" aria-label="Quitar actividad" onClick={() => setActividades((rows) => { const remaining = rows.filter((_, i) => i !== index); return remaining.length ? remaining : [actividadVacia()]; })} className="px-2 text-red-500"><X className="h-4 w-4" /></button>}
            </div>;
            })}
            {actividades.some((actividad) => actividad.atendio.split(",").map((nombre) => nombre.trim()).includes("Otro")) && <Input disabled={locked} value={mecanicoOtro} onChange={(e) => setMecanicoOtro(e.target.value)} placeholder="Nombre del mecánico (Otro)" />}
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1.35fr)_minmax(300px,1fr)_auto]">
              <div className="min-w-0 space-y-1">
                <Label>Lugar / Ubicación</Label>
                <Input disabled={locked || !orden.proveedorExternoReady} value={proveedorExterno} onChange={(e) => setProveedorExterno(e.target.value)} placeholder="TALLER" className="h-10 min-w-0" />
                <MediaGallery label="Evidencia del lugar / ubicación" items={fotosSalida} locked={locked} uploading={uploading === "salida"} onAdd={() => inputSalida.current?.click()} onRemove={(key) => setFotosSalida((current) => current.filter((item) => item.key !== key))} showHeader={false} />
                <input ref={inputSalida} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" multiple capture="environment" className="hidden" onChange={(e) => { void subirMedia("salida", e.target.files); e.target.value = ""; }} />
              </div>
              <div className="flex items-start pt-0 sm:pt-[18px]">
                {!locked && <button type="button" disabled={uploading === "salida"} onClick={() => inputSalida.current?.click()} aria-label={uploading === "salida" ? "Subiendo foto o video" : "Agregar foto o video del lugar"} title={uploading === "salida" ? "Subiendo…" : "Agregar foto o video"} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border disabled:opacity-50" style={{ borderColor: "var(--border)" }}><Camera className="h-4 w-4" /></button>}
              </div>
            </div>
            {!orden.proveedorExternoReady && <p className="text-[11px] text-amber-700">Hace falta aplicar la migración para guardar proveedor externo.</p>}
          </div>
        </div>
        <div className="grid items-start gap-3 border-t pt-3 sm:grid-cols-2" style={{ borderColor: "var(--border)" }}>
          <div className="space-y-3">
            <div>
              <Label>Fecha de salida</Label>
              <DateDmyInput disabled={locked || !orden.extensionReady} value={fechaSalida} onChange={setFechaSalida} aria-label="Fecha de salida (DD/MM/AAAA)" />
            </div>
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
              <p className="text-[10px] font-semibold uppercase" style={{ color: "var(--fg-muted)" }}>Proveedores y facturas</p>
              <p className="mt-1 text-xs">{proveedorExterno ? `Proveedor externo · ${proveedorExterno}` : "Sin proveedor externo"}{refs.filter((r) => r.proveedor?.trim()).map((r) => ` · ${r.proveedor}${r.folioFactura ? ` · Factura ${r.folioFactura}` : ""}`).join("")}</p>
            </div>
          </div>
          <div className="rounded-xl border p-3 sm:mt-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" disabled={locked || !kmHrs} checked={proximoActivo} onChange={(e) => setProximoActivo(e.target.checked)} /> Programar próximo mantenimiento</label>
            {proximoActivo && intervaloMantenimiento != null && proximoValorCalculado && <p className="mt-2 text-sm">Siguiente servicio: <b>{Number(proximoValorCalculado).toLocaleString("es-MX")} {tipoPrev.toUpperCase()}</b> <span className="text-xs" style={{ color: "var(--fg-muted)" }}>(lectura actual + intervalo configurado de {intervaloMantenimiento.toLocaleString("es-MX")})</span></p>}
            {proximoActivo && intervaloMantenimiento != null && !kmHrs && <p className="mt-1 text-[11px] text-amber-700">Ingresa la lectura actual para calcular la próxima.</p>}
            {proximoActivo && intervaloMantenimiento == null && <div className="mt-2"><Label>Lectura objetivo ({tipoPrev === "hrs" ? "HRS" : "KM"})</Label><Input disabled={locked} type="number" min={kmHrs || 0} step="any" value={proximoValor} onChange={(e) => setProximoValor(e.target.value)} placeholder="Lectura para volver a atender" /><p className="mt-1 text-[11px] text-amber-700">No hay un intervalo activo configurado para esta unidad; indica manualmente la lectura objetivo.</p></div>}
            <p className="mt-1 text-[11px]" style={{ color: "var(--fg-muted)" }}>Al cerrar esta orden, el servicio se registra en Mantenimiento de la unidad y la próxima lectura aparece en el Tablero general.</p>
          </div>
        </div>
        <p className="text-[11px] pt-2" style={{ color: "var(--fg-muted)" }}>
          {orden.abiertoPorNombre ? `Abrió ${orden.abiertoPorNombre}` : "—"}
          {orden.actualizadoPorNombre ? ` · última edición ${orden.actualizadoPorNombre}` : ""}
          {orden.cerradoPorNombre ? ` · cerró ${orden.cerradoPorNombre}` : ""}
        </p>
      </div>

      <div className={`${sec === "ingreso" ? "" : "hidden"} print:block space-y-4 print:break-before-page`}>
          <ChecklistIngreso value={checks} onChange={setChecks} locked={locked} />
          <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <MediaGallery label="Expediente · cómo llegó el equipo (fotos y videos)" items={fotosIngreso} locked={locked} uploading={uploading === "ingreso"} onAdd={() => inputIngreso.current?.click()} onRemove={(key) => setFotosIngreso((current) => current.filter((item) => item.key !== key))} />
            <input ref={inputIngreso} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" multiple capture="environment" className="hidden" onChange={(e) => { void subirMedia("ingreso", e.target.files); e.target.value = ""; }} />
          </div>
      </div>

      <div className={`${sec === "piezas" ? "" : "hidden"} print:block space-y-3 rounded-xl border p-3 print:break-before-page`} style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg-muted)" }}>Refacciones / materiales utilizados</p>
          <div className="overflow-x-auto print:overflow-visible">
            <div className="min-w-[850px] space-y-2 print:min-w-0">
              <div className="grid grid-cols-[2fr_.55fr_.7fr_.8fr_.4fr_1.1fr_.85fr_24px] gap-1.5 text-[10px] font-semibold uppercase" style={{ color: "var(--fg-muted)" }}><span>Descripción</span><span>Cant.</span><span>Unidad</span><span>P. unit. sin IVA</span><span>+IVA</span><span>Proveedor</span><span>Factura</span><span /></div>
              {refs.map((r, i) => <div key={i} className="grid grid-cols-[2fr_.55fr_.7fr_.8fr_.4fr_1.1fr_.85fr_24px] items-center gap-1.5">
                <Input list="ref-desc" disabled={locked} value={r.descripcion} onChange={(e) => setRefs((all) => all.map((row, j) => j === i ? { ...row, descripcion: e.target.value } : row))} placeholder="Refacción / material" className="h-8 px-2 text-xs" />
                <Input type="number" inputMode="decimal" disabled={locked} value={r.cantidad ?? ""} onChange={(e) => setRefs((all) => all.map((row, j) => j === i ? { ...row, cantidad: e.target.value ? Number(e.target.value) : null } : row))} className="h-8 px-2 text-xs" />
                <Select disabled={locked} value={r.unidadMedida ?? "pz"} onChange={(e) => setRefs((all) => all.map((row, j) => j === i ? { ...row, unidadMedida: e.target.value } : row))} className="h-8 px-2 text-xs">{["pz", "caja", "juego", "lt", "cubeta", "kit", "servicio", "m"].map((u) => <option key={u}>{u}</option>)}</Select>
                <Input type="number" inputMode="decimal" disabled={locked} value={r.precio ?? ""} onChange={(e) => setRefs((all) => all.map((row, j) => j === i ? { ...row, precio: e.target.value ? Number(e.target.value) : null } : row))} placeholder="$ sin IVA" className="h-8 px-2 text-xs" />
                <input aria-label="Agregar IVA" type="checkbox" disabled={locked} checked={r.iva !== false} onChange={(e) => setRefs((all) => all.map((row, j) => j === i ? { ...row, iva: e.target.checked } : row))} className="justify-self-center" />
                <Input list="ref-prov" disabled={locked} value={r.proveedor ?? ""} onChange={(e) => setRefs((all) => all.map((row, j) => j === i ? { ...row, proveedor: e.target.value } : row))} placeholder="Proveedor" className="h-8 px-2 text-xs" />
                <Input disabled={locked} value={r.folioFactura ?? ""} onChange={(e) => setRefs((all) => all.map((row, j) => j === i ? { ...row, folioFactura: e.target.value } : row))} placeholder="Factura" className="h-8 px-2 text-xs" />
                {!locked && <button type="button" aria-label="Eliminar refacción" onClick={() => setRefs((all) => all.filter((_, j) => j !== i))} className="text-red-500"><X className="h-4 w-4" /></button>}
              </div>)}
            </div>
          </div>
          <datalist id="ref-desc">{sugeridas.descripciones.map((d) => <option key={d} value={d} />)}</datalist>
          <datalist id="ref-prov">{sugeridas.proveedores.map((d) => <option key={d} value={d} />)}</datalist>
          {!locked && <button type="button" onClick={() => setRefs((all) => [...all, emptyRef()])} className="inline-flex items-center gap-1 text-xs font-bold text-[#207783]"><Plus className="h-3.5 w-3.5" />Agregar refacción</button>}
          <div className="flex flex-wrap justify-end gap-4 text-xs"><span>Subtotal <b>{subtotal.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</b></span><span>IVA <b>{ivaTotal.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</b></span><span>Total <b>{total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}</b></span></div>
      </div>

      {error && <p className="print:hidden text-sm text-red-500">{error}</p>}
      {pending && !error && (
        <p className="print:hidden text-[11px] text-center" style={{ color: "var(--fg-muted)" }}>Guardando…</p>
      )}

    </div>
  );
}
