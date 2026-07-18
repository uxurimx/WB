"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Pencil, Trash2, AlertCircle, ArrowRight, Fuel,
  ChevronDown, ChevronUp, Gauge, Hash, MapPin, User,
  Search, X as XIcon, ArrowUpDown, Camera, CalendarRange,
  AlertTriangle, ClipboardList, ArrowUpCircle, ArrowLeftRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import TableScroll from "@/components/ui/table-scroll";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { updateCarga, deleteCarga, getCargasPage } from "@/app/actions/cargas";
import {
  updateRecargaTanque, deleteRecargaTanque,
  updateTransferencia, deleteTransferencia,
} from "@/app/actions/tanques";
import type PusherClient from "pusher-js";

// ─── Types ───────────────────────────────────────────────────
export type CargaItem = {
  _tipo: "carga";
  id: number;
  fecha: string;
  hora: string | null;
  folio: number | null;
  litros: number;
  origen: string;
  tipoDiesel: string | null;
  notas: string | null;
  operadorId: number | null;
  obraId: number | null;
  odometroHrs: number | null;
  cuentaLtInicio: number | null;
  cuentaLtFin: number | null;
  kmEstimado: boolean;
  periodoId: number | null;
  periodoCerrado: boolean;
  createdAt: string | null;
  unidad: { codigo: string } | null;
  operador: { nombre: string } | null;
  obra: { nombre: string } | null;
  fotoUrl?: string | null;
};

export type TransferenciaItem = {
  _tipo: "transferencia";
  id: number;
  fecha: string;
  folio: number | null;
  litros: number;
  origenNombre: string;
  destinoNombre: string;
  cuentalitrosNissanInicio: number | null;
  cuentalitrosDestino: number | null;
  notas: string | null;
  createdAt: string | null;
};

export type RecargaItem = {
  _tipo: "recarga";
  id: number;
  fecha: string;
  litros: number;
  tanqueNombre: string;
  proveedor: string | null;
  folioFactura: string | null;
  precioLitro: number | null;
  cuentalitrosInicio: number | null;
  notas: string | null;
  createdAt: string | null;
};

export type HistorialItem = CargaItem | TransferenciaItem | RecargaItem;

type Operador    = { id: number; nombre: string };
type Obra        = { id: number; nombre: string };

function formatFecha(fecha: string) {
  return new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function formatFechaHora(fecha: string, createdAt?: string | null, hora?: string | null) {
  if (createdAt) {
    return new Date(createdAt).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return `${formatFecha(fecha)}${hora ? ` · ${hora.slice(0, 5)}` : ""}`;
}

function formatFolioCarga(item: Pick<CargaItem, "folio" | "origen">) {
  if (item.folio == null) return "—";
  return `${item.origen === "campo" ? "C" : "P"}-${item.folio}`;
}

function formatFolioTransferencia(item: Pick<TransferenciaItem, "folio">) {
  return item.folio != null ? `T-${item.folio}` : "—";
}

function DetailPill({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>
        {label}
      </span>
      <span className={`text-xs ${mono ? "font-mono" : ""}`} style={{ color: "var(--fg)" }}>
        {value}
      </span>
    </div>
  );
}

// ─── Botones de acción reutilizables ─────────────────────────
function ActionButtons({
  id,
  deletingId,
  isPending,
  onEdit,
  onDelete,
}: {
  id: number;
  deletingId: number | null;
  isPending: boolean;
  onEdit: () => void;
  onDelete: (id: number) => void;
}) {
  if (deletingId === id) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <span className="text-xs text-red-500">¿Eliminar?</span>
        <button
          onClick={() => onDelete(id)}
          disabled={isPending}
          className="px-2 py-0.5 rounded text-xs font-semibold bg-red-600 text-white"
        >
          Sí
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onEdit}
        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
      >
        <Pencil className="w-3.5 h-3.5 text-indigo-400" />
      </button>
      <button
        onClick={() => onDelete(id)}
        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5 text-red-400" />
      </button>
    </div>
  );
}

// ─── Fila de carga expandible ─────────────────────────────────
function CargaRow({
  item,
  canEdit,
  onEdit,
  onDelete,
  onFoto,
  isDeleting,
  isPending,
}: {
  item: CargaItem;
  canEdit: boolean;
  onEdit: (c: CargaItem) => void;
  onDelete: (id: number) => void;
  onFoto: (url: string, folio: number | null) => void;
  isDeleting: boolean;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const hasDetails =
    item.odometroHrs != null ||
    item.cuentaLtInicio != null ||
    item.cuentaLtFin != null ||
    item.obra != null ||
    item.notas;

  return (
    <>
      <tr
        className="border-b transition-colors hover:bg-[rgba(0,0,0,0.02)] cursor-pointer"
        style={{ borderColor: "var(--border)" }}
        onClick={() => hasDetails && setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono text-sm font-semibold" style={{ color: "var(--fg)" }}>
            {formatFolioCarga(item)}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <p className="text-sm" style={{ color: "var(--fg)" }}>{formatFecha(item.fecha)}</p>
          {item.hora && (
            <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{item.hora.slice(0, 5)}</p>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="font-mono font-bold text-sm" style={{ color: "var(--fg)" }}>
            {item.unidad?.codigo ?? "—"}
          </span>
        </td>
        <td className="px-4 py-3 hidden sm:table-cell">
          <span className="text-sm" style={{ color: "var(--fg-muted)" }}>
            {item.operador?.nombre ?? "—"}
          </span>
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <span className="font-mono font-semibold text-sm" style={{ color: "var(--fg)" }}>
            {item.litros.toLocaleString()}
          </span>
          <span className="text-xs ml-1" style={{ color: "var(--fg-muted)" }}>L</span>
        </td>
        <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
          {item.odometroHrs != null ? (
            <span className="font-mono text-sm" style={{ color: "var(--fg)" }}>
              {item.odometroHrs.toLocaleString()}
              {item.kmEstimado && (
                <span className="ml-1 text-[10px] text-amber-500">est.</span>
              )}
            </span>
          ) : (
            <span style={{ color: "var(--fg-muted)" }}>—</span>
          )}
        </td>
        <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
          {item.cuentaLtInicio != null || item.cuentaLtFin != null ? (
            <span className="font-mono text-xs" style={{ color: "var(--fg)" }}>
              {item.cuentaLtInicio?.toLocaleString() ?? "—"}
              {" → "}
              {item.cuentaLtFin?.toLocaleString() ?? "—"}
            </span>
          ) : (
            <span className="text-sm" style={{ color: "var(--fg-muted)" }}>—</span>
          )}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <Badge variant={item.origen === "campo" ? "warning" : "default"}>
            {item.origen === "campo" ? "Campo" : "Patio"}
          </Badge>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center gap-1 justify-end">
            {hasDetails && (
              <span style={{ color: "var(--fg-muted)" }}>
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </span>
            )}
            {item.fotoUrl && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onFoto(item.fotoUrl!, item.folio); }}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                title="Ver foto odómetro"
              >
                <Camera className="w-3.5 h-3.5 text-violet-400" />
              </button>
            )}
            {canEdit && (
              <ActionButtons
                id={item.id}
                deletingId={isDeleting ? item.id : null}
                isPending={isPending}
                onEdit={() => onEdit(item)}
                onDelete={onDelete}
              />
            )}
          </div>
        </td>
      </tr>

      {expanded && hasDetails && (
        <tr style={{ backgroundColor: "var(--surface-2)" }}>
          <td colSpan={9} className="px-4 py-3">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {item.odometroHrs != null && (
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <DetailPill label="Odómetro / HRS" value={`${item.odometroHrs.toLocaleString()}${item.kmEstimado ? " (estimado)" : ""}`} mono />
                </div>
              )}
              {(item.cuentaLtInicio != null || item.cuentaLtFin != null) && (
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <DetailPill
                    label="Cuentalitros inicio → fin"
                    value={`${item.cuentaLtInicio?.toLocaleString() ?? "—"} → ${item.cuentaLtFin?.toLocaleString() ?? "—"}`}
                    mono
                  />
                </div>
              )}
              {item.obra != null && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <DetailPill label="Obra" value={item.obra.nombre} />
                </div>
              )}
              {item.operador != null && (
                <div className="flex items-center gap-1.5 sm:hidden">
                  <User className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--fg-muted)" }} />
                  <DetailPill label="Operador" value={item.operador.nombre} />
                </div>
              )}
              {item.notas && (
                <div className="flex items-center gap-1.5 w-full">
                  <DetailPill label="Notas" value={item.notas} />
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type SortCol = "fecha" | "litros" | "folio" | "unidad" | "operador" | "odometro";
type TipoFiltro = "cargas" | "patio" | "campo" | "recarga" | "transf" | "actividad";

// ─── Componente principal ─────────────────────────────────────
export default function CargasTable({
  initialCargas,
  cargasTotal,
  cargasLitros,
  cargasUnidades,
  recargas,
  transferencias,
  operadores,
  obras,
  canEdit,
  pageSize,
  origen,
  unidadId,
  hasFiltroFecha = false,
  isDefaultWindow = false,
  todo = false,
  desde: desdeProp = "",
  hasta: hastaProp = "",
  initialTab,
}: {
  initialCargas: CargaItem[];
  cargasTotal: number;
  cargasLitros: number;
  cargasUnidades: number;
  recargas: RecargaItem[];
  transferencias: TransferenciaItem[];
  operadores: Operador[];
  obras: Obra[];
  canEdit: boolean;
  pageSize: number;
  origen?: "patio" | "campo";
  unidadId?: number;
  hasFiltroFecha?: boolean;
  isDefaultWindow?: boolean;
  todo?: boolean;
  desde?: string;
  hasta?: string;
  initialTab?: Extract<TipoFiltro, "actividad">;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fotoViewer, setFotoViewer] = useState<{ url: string; folio: number | null } | null>(null);

  // ── Cargas server-side (paginadas) ─────────────────────────
  const [cargas,        setCargas]        = useState<CargaItem[]>(initialCargas);
  const [total,         setTotal]         = useState(cargasTotal);
  const [litrosTotal,   setLitrosTotal]   = useState(cargasLitros);
  const [unidadesTotal, setUnidadesTotal] = useState(cargasUnidades);
  const [loadingMore,   setLoadingMore]   = useState(false);
  const [searching,     setSearching]     = useState(false);

  // ── Búsqueda / filtro / orden ──────────────────────────────
  const [busqueda,    setBusqueda]    = useState("");
  const [tipoFiltro,  setTipoFiltro]  = useState<TipoFiltro>(initialTab ?? origen ?? "cargas");
  const [sortCol,     setSortCol]     = useState<SortCol>("fecha");
  const [sortDir,     setSortDir]     = useState<"asc" | "desc">("desc");

  // ── Filtro de fechas ───────────────────────────────────────
  const [fechaDesde, setFechaDesde] = useState(desdeProp);
  const [fechaHasta, setFechaHasta] = useState(hastaProp);

  const origenFromTipo = (t: TipoFiltro): "patio" | "campo" | undefined =>
    t === "patio" ? "patio" : t === "campo" ? "campo" : undefined;
  const tipoNecesitaCargas = (t: TipoFiltro) => t === "cargas" || t === "patio" || t === "campo" || t === "actividad";

  const fetchPage = useCallback(
    (t: TipoFiltro, search: string, offset: number) =>
      getCargasPage({
        origen: origenFromTipo(t),
        unidadId,
        fechaDesde: desdeProp || undefined,
        fechaHasta: hastaProp || undefined,
        search: search.trim() || undefined,
        limit: pageSize,
        offset,
      }),
    [unidadId, desdeProp, hastaProp, pageSize],
  );

  async function loadCargas(t: TipoFiltro, search: string) {
    if (!tipoNecesitaCargas(t)) {
      setCargas([]); setTotal(0); setLitrosTotal(0); setUnidadesTotal(0);
      return;
    }
    setSearching(true);
    try {
      const res = await fetchPage(t, search, 0);
      setCargas(res.items); setTotal(res.total); setLitrosTotal(res.litros); setUnidadesTotal(res.unidades);
    } finally { setSearching(false); }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetchPage(tipoFiltro, busqueda, cargas.length);
      setCargas((prev) => [...prev, ...res.items]);
      setTotal(res.total); setLitrosTotal(res.litros); setUnidadesTotal(res.unidades);
    } finally { setLoadingMore(false); }
  }

  // Tras editar/eliminar una carga: refresca lo visible (mantiene la cantidad cargada)
  const reloadCargas = useCallback(async () => {
    if (!tipoNecesitaCargas(tipoFiltro)) return;
    const limit = Math.max(pageSize, cargas.length);
    const res = await getCargasPage({
      origen: origenFromTipo(tipoFiltro),
      unidadId,
      fechaDesde: desdeProp || undefined,
      fechaHasta: hastaProp || undefined,
      search: busqueda.trim() || undefined,
      limit, offset: 0,
    });
    setCargas(res.items); setTotal(res.total); setLitrosTotal(res.litros); setUnidadesTotal(res.unidades);
  }, [tipoFiltro, cargas.length, unidadId, desdeProp, hastaProp, pageSize, busqueda]);

  // Búsqueda con debounce → consulta servidor (cubre todo el rango, no solo lo cargado)
  const firstSearch = useRef(true);
  useEffect(() => {
    if (firstSearch.current) { firstSearch.current = false; return; }
    const id = setTimeout(() => { loadCargas(tipoFiltro, busqueda); }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda]);

  // Mantener ref estable a reloadCargas para el listener Pusher
  const reloadCargasRef = useRef(reloadCargas);
  useEffect(() => { reloadCargasRef.current = reloadCargas; }, [reloadCargas]);

  const pusherRef = useRef<PusherClient | null>(null);
  useEffect(() => {
    const key     = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    let cancelled = false;
    import("pusher-js").then(({ default: Pusher }) => {
      if (cancelled || pusherRef.current) return;
      const client = new Pusher(key, { cluster, authEndpoint: "/api/pusher/auth" });
      pusherRef.current = client;
      const ch = client.subscribe("private-cargas");
      ch.bind("nueva-carga", () => { reloadCargasRef.current(); });
      const chStock = client.subscribe("private-stock");
      chStock.bind("stock-actualizado", () => { router.refresh(); });
    });

    return () => {
      cancelled = true;
      if (pusherRef.current) {
        pusherRef.current.unsubscribe("private-cargas");
        pusherRef.current.unsubscribe("private-stock");
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [router]); // mount only

  function changeTipo(key: TipoFiltro) {
    setTipoFiltro(key);
    loadCargas(key, busqueda);
  }

  function aplicarFiltroFechas() {
    const qs = new URLSearchParams();
    if (fechaDesde) qs.set("desde", fechaDesde);
    if (fechaHasta) qs.set("hasta", fechaHasta);
    router.push(`/cargas${qs.toString() ? `?${qs.toString()}` : ""}`);
  }

  function limpiarFiltroFechas() {
    setFechaDesde("");
    setFechaHasta("");
    router.push("/cargas?todo=1");
  }

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("desc"); }
  }

  // Recargas/transferencias: pocas, vienen completas dentro de la ventana → filtro en cliente.
  const matchSearch = (item: RecargaItem | TransferenciaItem) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    if (item._tipo === "recarga") return (item.proveedor ?? "").toLowerCase().includes(q) || item.tanqueNombre.toLowerCase().includes(q);
    return item.origenNombre.toLowerCase().includes(q) || item.destinoNombre.toLowerCase().includes(q);
  };

  const recargasView = (tipoFiltro === "actividad" || tipoFiltro === "recarga")
    ? recargas.filter(matchSearch) as RecargaItem[]
    : [];
  const transfView = (tipoFiltro === "actividad" || tipoFiltro === "transf")
    ? transferencias.filter(matchSearch) as TransferenciaItem[]
    : [];
  const recargasStatsView = recargas.filter(matchSearch) as RecargaItem[];
  const transfStatsView = transferencias.filter(matchSearch) as TransferenciaItem[];
  const cargasView = tipoNecesitaCargas(tipoFiltro) ? cargas : [];

  const itemsFiltrados = ([...cargasView, ...recargasView, ...transfView] as HistorialItem[])
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      const getFolio    = (x: HistorialItem) => (x._tipo !== "recarga" ? (x.folio ?? 0) : 0);
      const getUnidad   = (x: HistorialItem) => (x._tipo === "carga" ? (x.unidad?.codigo ?? "") : "");
      const getOperador = (x: HistorialItem) => (x._tipo === "carga" ? (x.operador?.nombre ?? "") : "");
      const getOdometro = (x: HistorialItem) => (x._tipo === "carga" ? (x.odometroHrs ?? 0) : 0);
      if (sortCol === "fecha") {
        const dateA = a.createdAt ?? (a._tipo === "carga" && a.hora ? `${a.fecha}T${a.hora}` : `${a.fecha}T00:00:00`);
        const dateB = b.createdAt ?? (b._tipo === "carga" && b.hora ? `${b.fecha}T${b.hora}` : `${b.fecha}T00:00:00`);
        return mul * dateA.localeCompare(dateB);
      }
      if (sortCol === "litros")   return mul * (a.litros - b.litros);
      if (sortCol === "folio")    return mul * (getFolio(a) - getFolio(b));
      if (sortCol === "unidad")   return mul * getUnidad(a).localeCompare(getUnidad(b));
      if (sortCol === "operador") return mul * getOperador(a).localeCompare(getOperador(b));
      if (sortCol === "odometro") return mul * (getOdometro(a) - getOdometro(b));
      return 0;
    });

  const puedeCargarMas = tipoNecesitaCargas(tipoFiltro) && cargas.length < total;

  // ── Estado: edición/eliminación de cargas ──────────────────
  const [editCarga,    setEditCarga]    = useState<CargaItem | null>(null);
  const [editCargaForm, setEditCargaForm] = useState({
    fecha: "", hora: "", folio: "", litros: "", odometroHrs: "",
    cuentaLtInicio: "", cuentaLtFin: "",
    operadorId: "", obraId: "", notas: "",
  });
  const [editCargaError,  setEditCargaError]  = useState("");
  const [deletingCargaId, setDeletingCargaId] = useState<number | null>(null);
  const [deleteCargaError, setDeleteCargaError] = useState("");
  const [deleteNoteState, setDeleteNoteState] = useState<{ cargaId: number; nota: string } | null>(null);

  // ── Estado: edición/eliminación de recargas ────────────────
  const [editRecarga,    setEditRecarga]    = useState<RecargaItem | null>(null);
  const [editRecargaForm, setEditRecargaForm] = useState({
    fecha: "", litros: "", proveedor: "", folioFactura: "",
    precioLitro: "", cuentalitrosInicio: "", notas: "",
  });
  const [editRecargaError,   setEditRecargaError]   = useState("");
  const [deletingRecargaId,  setDeletingRecargaId]  = useState<number | null>(null);
  const [deleteRecargaError, setDeleteRecargaError] = useState("");

  // ── Estado: edición/eliminación de transferencias ──────────
  const [editTransf,    setEditTransf]    = useState<TransferenciaItem | null>(null);
  const [editTransfForm, setEditTransfForm] = useState({ fecha: "", litros: "", folio: "", cuentalitrosNissanInicio: "", cuentalitrosDestino: "", notas: "" });
  const [editTransfError,   setEditTransfError]   = useState("");
  const [deletingTransfId,  setDeletingTransfId]  = useState<number | null>(null);
  const [deleteTransfError, setDeleteTransfError] = useState("");

  // ── Handlers: cargas ───────────────────────────────────────
  function openEditCarga(c: CargaItem) {
    setEditCarga(c);
    setEditCargaError("");
    setEditCargaForm({
      fecha:          c.fecha,
      hora:           c.hora?.slice(0, 5) ?? "",
      folio:          c.folio ? String(c.folio) : "",
      litros:         String(c.litros),
      odometroHrs:    c.odometroHrs != null ? String(c.odometroHrs) : "",
      cuentaLtInicio: c.cuentaLtInicio != null ? String(c.cuentaLtInicio) : "",
      cuentaLtFin:    c.cuentaLtFin != null ? String(c.cuentaLtFin) : "",
      operadorId:     c.operadorId ? String(c.operadorId) : "",
      obraId:         c.obraId ? String(c.obraId) : "",
      notas:          c.notas ?? "",
    });
  }

  function handleCargaFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setEditCargaForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEditCarga() {
    if (!editCarga) return;
    if (!editCargaForm.litros || parseFloat(editCargaForm.litros) <= 0) {
      setEditCargaError("Los litros deben ser mayores a 0"); return;
    }
    startTransition(async () => {
      try {
        await updateCarga(editCarga.id, {
          fecha:          editCargaForm.fecha,
          hora:           editCargaForm.hora || undefined,
          folio:          editCargaForm.folio ? parseInt(editCargaForm.folio) : undefined,
          litros:         parseFloat(editCargaForm.litros),
          odometroHrs:    editCargaForm.odometroHrs ? parseFloat(editCargaForm.odometroHrs) : null,
          cuentaLtInicio: editCargaForm.cuentaLtInicio ? parseFloat(editCargaForm.cuentaLtInicio) : null,
          cuentaLtFin:    editCargaForm.cuentaLtFin ? parseFloat(editCargaForm.cuentaLtFin) : null,
          operadorId:     editCargaForm.operadorId ? parseInt(editCargaForm.operadorId) : null,
          obraId:         editCargaForm.obraId ? parseInt(editCargaForm.obraId) : null,
          notas:          editCargaForm.notas || null,
        });
        setEditCarga(null);
        await reloadCargas();
      } catch (err) {
        setEditCargaError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleDeleteCarga(id: number) {
    const item = cargas.find((i) => i.id === id);
    if (item?.periodoCerrado) {
      // Período cerrado: exige nota antes de eliminar
      setDeleteNoteState({ cargaId: id, nota: "" });
      setDeleteCargaError("");
      return;
    }
    // Período abierto: confirmación inline
    if (deletingCargaId === id) {
      startTransition(async () => {
        try {
          await deleteCarga(id);
          setDeletingCargaId(null);
          await reloadCargas();
        } catch (err) {
          setDeleteCargaError(err instanceof Error ? err.message : "Error al eliminar");
          setDeletingCargaId(null);
        }
      });
    } else {
      setDeletingCargaId(id);
      setDeleteCargaError("");
    }
  }

  function confirmDeleteConNota() {
    if (!deleteNoteState?.nota.trim()) return;
    startTransition(async () => {
      try {
        await deleteCarga(deleteNoteState.cargaId, deleteNoteState.nota);
        setDeleteNoteState(null);
        await reloadCargas();
      } catch (err) {
        setDeleteCargaError(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  }

  // ── Handlers: recargas ─────────────────────────────────────
  function openEditRecarga(r: RecargaItem) {
    setEditRecarga(r);
    setEditRecargaError("");
    setEditRecargaForm({
      fecha:              r.fecha,
      litros:             String(r.litros),
      proveedor:          r.proveedor ?? "",
      folioFactura:       r.folioFactura ?? "",
      precioLitro:        r.precioLitro != null ? String(r.precioLitro) : "",
      cuentalitrosInicio: r.cuentalitrosInicio != null ? String(r.cuentalitrosInicio) : "",
      notas:              r.notas ?? "",
    });
  }

  function handleRecargaFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEditRecargaForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEditRecarga() {
    if (!editRecarga) return;
    if (!editRecargaForm.litros || parseFloat(editRecargaForm.litros) <= 0) {
      setEditRecargaError("Los litros deben ser mayores a 0"); return;
    }
    startTransition(async () => {
      try {
        await updateRecargaTanque(editRecarga.id, {
          fecha:              editRecargaForm.fecha,
          litros:             parseFloat(editRecargaForm.litros),
          proveedor:          editRecargaForm.proveedor || null,
          folioFactura:       editRecargaForm.folioFactura || null,
          precioLitro:        editRecargaForm.precioLitro ? parseFloat(editRecargaForm.precioLitro) : null,
          cuentalitrosInicio: editRecargaForm.cuentalitrosInicio ? parseFloat(editRecargaForm.cuentalitrosInicio) : null,
          notas:              editRecargaForm.notas || null,
        });
        setEditRecarga(null);
        router.refresh();
      } catch (err) {
        setEditRecargaError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleDeleteRecarga(id: number) {
    if (deletingRecargaId === id) {
      startTransition(async () => {
        try {
          await deleteRecargaTanque(id);
          setDeletingRecargaId(null);
          router.refresh();
        } catch (err) {
          setDeleteRecargaError(err instanceof Error ? err.message : "Error al eliminar");
          setDeletingRecargaId(null);
        }
      });
    } else {
      setDeletingRecargaId(id);
      setDeleteRecargaError("");
    }
  }

  // ── Handlers: transferencias ───────────────────────────────
  function openEditTransf(t: TransferenciaItem) {
    setEditTransf(t);
    setEditTransfError("");
    setEditTransfForm({
      fecha:                    t.fecha,
      litros:                   String(t.litros),
      folio:                    t.folio != null ? String(t.folio) : "",
      cuentalitrosNissanInicio: t.cuentalitrosNissanInicio != null ? String(t.cuentalitrosNissanInicio) : "",
      cuentalitrosDestino:      t.cuentalitrosDestino != null ? String(t.cuentalitrosDestino) : "",
      notas:                    t.notas ?? "",
    });
  }

  function handleTransfFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEditTransfForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function saveEditTransf() {
    if (!editTransf) return;
    if (!editTransfForm.litros || parseFloat(editTransfForm.litros) <= 0) {
      setEditTransfError("Los litros deben ser mayores a 0"); return;
    }
    if (editTransfForm.folio) {
      const f = parseInt(editTransfForm.folio);
      if (isNaN(f) || f <= 0 || f > 99999) {
        setEditTransfError("Folio inválido. Debe ser entre 1 y 99999"); return;
      }
    }
    startTransition(async () => {
      try {
        await updateTransferencia(editTransf.id, {
          fecha:                    editTransfForm.fecha,
          litros:                   parseFloat(editTransfForm.litros),
          folio:                    editTransfForm.folio !== "" ? parseInt(editTransfForm.folio) : null,
          notas:                    editTransfForm.notas || null,
          cuentalitrosNissanInicio: editTransfForm.cuentalitrosNissanInicio !== "" ? parseFloat(editTransfForm.cuentalitrosNissanInicio) : null,
          cuentalitrosDestino:      editTransfForm.cuentalitrosDestino !== "" ? parseFloat(editTransfForm.cuentalitrosDestino) : null,
        });
        setEditTransf(null);
        router.refresh();
      } catch (err) {
        setEditTransfError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  function handleDeleteTransf(id: number) {
    if (deletingTransfId === id) {
      startTransition(async () => {
        try {
          await deleteTransferencia(id);
          setDeletingTransfId(null);
          router.refresh();
        } catch (err) {
          setDeleteTransfError(err instanceof Error ? err.message : "Error al eliminar");
          setDeletingTransfId(null);
        }
      });
    } else {
      setDeletingTransfId(id);
      setDeleteTransfError("");
    }
  }

  const TIPO_OPTS: { key: TipoFiltro; label: string }[] = [
    { key: "cargas",    label: "Cargas" },
    { key: "patio",     label: "Patio" },
    { key: "campo",     label: "Campo" },
    { key: "recarga",   label: "Recargas" },
    { key: "transf",    label: "Transferencias" },
    { key: "actividad", label: "Actividad" },
  ];

  function SortBtn({ col, label }: { col: SortCol; label: string }) {
    const active = sortCol === col;
    return (
      <button type="button" onClick={() => toggleSort(col)} className="flex items-center gap-1 group">
        {label}
        <ArrowUpDown
          className={`w-3 h-3 transition-colors ${active ? "text-indigo-400" : "opacity-40 group-hover:opacity-70"}`}
        />
      </button>
    );
  }

  // Cargas: totales del servidor (cubren toda la ventana/filtro, no solo lo cargado).
  // Recargas/transferencias: pocas y completas en memoria → se cuentan en cliente.
  const anyFilter = !!(busqueda || tipoFiltro !== "cargas" || !isDefaultWindow);
  const displayStats = {
    cargas:         { total,                       litros: litrosTotal },
    recargas:       { total: recargasStatsView.length, litros: recargasStatsView.reduce((s, r) => s + r.litros, 0) },
    transferencias: { total: transfStatsView.length,   litros: transfStatsView.reduce((s, t) => s + t.litros, 0) },
  };
  const statsUnidades = unidadesTotal;

  const anyDeleteError = deleteCargaError || deleteRecargaError || deleteTransfError;

  return (
    <>
      {anyDeleteError && (
        <p className="text-sm text-red-500 flex items-center gap-1.5 mb-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {anyDeleteError}
        </p>
      )}

      {/* Mini dashboard reactivo — totales globales o filtrados */}
      <div className="mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--fg-muted)" }}>
          {anyFilter
            ? "Resultados según filtros activos"
            : todo
            ? "Totales — todo el historial"
            : "Totales — período actual"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: "Cargas",
              count: displayStats.cargas.total,
              litros: displayStats.cargas.litros,
              color: "text-indigo-400",
              bg: "rgba(99,102,241,0.08)",
            },
            {
              label: "Recargas",
              count: displayStats.recargas.total,
              litros: displayStats.recargas.litros,
              color: "text-emerald-500",
              bg: "rgba(16,185,129,0.08)",
            },
            {
              label: "Transferencias",
              count: displayStats.transferencias.total,
              litros: displayStats.transferencias.litros,
              color: "text-violet-400",
              bg: "rgba(139,92,246,0.08)",
            },
            {
              label: "Unidades",
              count: statsUnidades,
              litros: null,
              color: "text-amber-400",
              bg: "rgba(245,158,11,0.08)",
            },
          ].map(({ label, count, litros, color, bg }) => (
            <div key={label} className="p-3 rounded-2xl border text-center"
              style={{ backgroundColor: bg, borderColor: "var(--border)" }}>
              <p className={`font-outfit font-bold text-2xl ${color}`}>{count.toLocaleString()}</p>
              {litros !== null && (
                <p className="text-[11px] font-mono mt-0.5" style={{ color: "var(--fg-muted)" }}>
                  {litros.toLocaleString()} L
                </p>
              )}
              <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Búsqueda + filtros de tipo */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--fg-muted)" }} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar unidad, operador, folio, tanque..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/30"
            style={{ borderColor: "var(--border)", color: "var(--fg)" }}
          />
          {searching && (
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "var(--fg-muted)" }}>
              Buscando…
            </span>
          )}
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded"
              style={{ color: "var(--fg-muted)" }}
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TIPO_OPTS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => changeTipo(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                tipoFiltro === key
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "hover:bg-[var(--surface-2)]"
              }`}
              style={tipoFiltro !== key ? { borderColor: "var(--border)", color: "var(--fg-muted)" } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de rango de fechas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4 p-3 rounded-xl border"
        style={{ borderColor: "var(--border)", backgroundColor: hasFiltroFecha ? "rgba(99,102,241,0.06)" : "var(--surface)" }}>
        <div className="flex items-center gap-1.5 shrink-0">
          <CalendarRange className="w-3.5 h-3.5" style={{ color: hasFiltroFecha ? "rgb(99,102,241)" : "var(--fg-muted)" }} />
          <span className="text-xs font-semibold" style={{ color: hasFiltroFecha ? "rgb(99,102,241)" : "var(--fg-muted)" }}>
            Rango de fechas
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Desde</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: "var(--fg-muted)" }}>Hasta</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg border bg-transparent outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}
            />
          </div>
          <button
            type="button"
            onClick={aplicarFiltroFechas}
            disabled={!fechaDesde && !fechaHasta}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white disabled:opacity-40 transition-opacity"
          >
            Aplicar
          </button>
          {hasFiltroFecha && (
            <button
              type="button"
              onClick={limpiarFiltroFechas}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
            >
              <XIcon className="w-3 h-3" /> {isDefaultWindow ? "Ver todo el historial" : "Limpiar"}
            </button>
          )}
          {todo && (
            <button
              type="button"
              onClick={() => router.push("/cargas")}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border transition-colors hover:bg-[var(--surface-2)]"
              style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
            >
              <CalendarRange className="w-3 h-3" /> Volver al período actual
            </button>
          )}
        </div>
        {todo && (
          <p className="text-[10px] hidden sm:block shrink-0" style={{ color: "var(--fg-muted)" }}>
            Mostrando todo el historial
          </p>
        )}
      </div>

      {tipoFiltro === "actividad" ? (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          {itemsFiltrados.length === 0 ? (
            <div className="text-center py-16 text-sm" style={{ color: "var(--fg-muted)" }}>
              {busqueda ? "Sin resultados para esa búsqueda." : "Sin movimientos."}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {itemsFiltrados.map((item) => {
                const isCarga = item._tipo === "carga";
                const isRecarga = item._tipo === "recarga";
                const Icon = isCarga ? ClipboardList : isRecarga ? ArrowUpCircle : ArrowLeftRight;
                const color = isCarga ? "text-indigo-400" : isRecarga ? "text-emerald-500" : "text-violet-400";
                const folio = isCarga ? formatFolioCarga(item) : isRecarga ? (item.folioFactura ?? "—") : formatFolioTransferencia(item);
                const detalle = isCarga
                  ? `${item.unidad?.codigo ?? "—"} · ${item.operador?.nombre ?? "Sin operador"}`
                  : isRecarga
                  ? `${item.tanqueNombre}${item.proveedor ? ` · ${item.proveedor}` : ""}`
                  : `${item.origenNombre} → ${item.destinoNombre}`;
                return (
                  <div
                    key={`${item._tipo}-${item.id}`}
                    className="px-4 py-3 flex items-center gap-3 rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: "var(--surface-2)" }}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="w-28 shrink-0">
                      <p className="font-mono text-sm font-bold" style={{ color: "var(--fg)" }}>{folio}</p>
                      <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>
                        {formatFechaHora(item.fecha, item.createdAt, isCarga ? item.hora : null)}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: "var(--fg)" }}>{detalle}</p>
                      {item.notas && <p className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>{item.notas}</p>}
                    </div>
                    <Badge variant={isCarga ? (item.origen === "campo" ? "warning" : "default") : "secondary"}>
                      {isCarga ? (item.origen === "campo" ? "Campo" : "Patio") : isRecarga ? "Recarga" : "Transfer."}
                    </Badge>
                    <p className={`font-mono font-semibold text-sm w-24 text-right shrink-0 ${isRecarga ? "text-emerald-500" : ""}`}>
                      {isRecarga ? "+" : ""}{item.litros.toLocaleString()} L
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <TableScroll maxHeight="calc(100vh - 19rem)">
            {tipoFiltro === "recarga" ? (
              <table className="w-full min-w-[760px] text-sm">
                <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-[var(--surface)]">
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Fecha", "Tanque", "Proveedor", "Folio factura", "Litros", "Precio/L", "CuentaLT inicio", ""].map((label) => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recargasView.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-16 text-sm" style={{ color: "var(--fg-muted)" }}>Sin recargas.</td></tr>
                  )}
                  {recargasView.map((item) => (
                    <tr key={`recarga-${item.id}`} className="border-b" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3">{formatFecha(item.fecha)}</td>
                      <td className="px-4 py-3 font-semibold text-emerald-500">{item.tanqueNombre}</td>
                      <td className="px-4 py-3" style={{ color: "var(--fg-muted)" }}>{item.proveedor ?? "—"}</td>
                      <td className="px-4 py-3 font-mono">{item.folioFactura ?? "—"}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-500">+{item.litros.toLocaleString()} L</td>
                      <td className="px-4 py-3 font-mono">{item.precioLitro != null ? `$${item.precioLitro.toFixed(2)}` : "—"}</td>
                      <td className="px-4 py-3 font-mono">{item.cuentalitrosInicio?.toLocaleString() ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {canEdit && <div className="flex justify-end"><ActionButtons id={item.id} deletingId={deletingRecargaId} isPending={isPending} onEdit={() => openEditRecarga(item)} onDelete={handleDeleteRecarga} /></div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : tipoFiltro === "transf" ? (
              <table className="w-full min-w-[760px] text-sm">
                <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-[var(--surface)]">
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Folio", "Fecha", "Origen", "Destino", "Litros", "CuentaLT inicio", "CuentaLT fin", ""].map((label) => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transfView.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-16 text-sm" style={{ color: "var(--fg-muted)" }}>Sin transferencias.</td></tr>
                  )}
                  {transfView.map((item) => (
                    <tr key={`transferencia-${item.id}`} className="border-b" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3 font-mono font-semibold">{formatFolioTransferencia(item)}</td>
                      <td className="px-4 py-3">{formatFecha(item.fecha)}</td>
                      <td className="px-4 py-3">{item.origenNombre}</td>
                      <td className="px-4 py-3">{item.destinoNombre}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{item.litros.toLocaleString()} L</td>
                      <td className="px-4 py-3 font-mono">{item.cuentalitrosNissanInicio?.toLocaleString() ?? "—"}</td>
                      <td className="px-4 py-3 font-mono">{item.cuentalitrosDestino?.toLocaleString() ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {canEdit && <div className="flex justify-end"><ActionButtons id={item.id} deletingId={deletingTransfId} isPending={isPending} onEdit={() => openEditTransf(item)} onDelete={handleDeleteTransf} /></div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[640px] text-sm">
                <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-[var(--surface)]">
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {[
                      { col: "folio"    as SortCol, label: "Folio",      cls: "" },
                      { col: "fecha"    as SortCol, label: "Fecha",      cls: "" },
                      { col: "unidad"   as SortCol, label: "Unidad",     cls: "" },
                      { col: "operador" as SortCol, label: "Operador",   cls: "hidden sm:table-cell" },
                      { col: "litros"   as SortCol, label: "Litros",     cls: "text-right" },
                      { col: "odometro" as SortCol, label: "Odóm./HRS",  cls: "hidden md:table-cell" },
                    ].map(({ col, label, cls }) => (
                      <th key={col} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${cls}`} style={{ color: "var(--fg-muted)" }}>
                        <SortBtn col={col} label={label} />
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--fg-muted)" }}>CuentaLT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-muted)" }}>Origen</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {cargasView.length === 0 && (
                    <tr><td colSpan={9} className="text-center py-16 text-sm" style={{ color: "var(--fg-muted)" }}>{busqueda ? "Sin resultados para esa búsqueda." : "Sin cargas."}</td></tr>
                  )}
                  {cargasView.map((item) => (
                    <CargaRow
                      key={`carga-${item.id}`}
                      item={item}
                      canEdit={canEdit}
                      onEdit={openEditCarga}
                      onDelete={handleDeleteCarga}
                      onFoto={(url, folio) => setFotoViewer({ url, folio })}
                      isDeleting={deletingCargaId === item.id}
                      isPending={isPending}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </TableScroll>
        </div>
      )}

      {/* Paginación / cargar más */}
      {tipoFiltro === "cargas" || tipoFiltro === "patio" || tipoFiltro === "campo" ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3">
          <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
            Mostrando {cargasView.length.toLocaleString()} de {total.toLocaleString()} cargas
          </p>
          {puedeCargarMas && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--fg)" }}
            >
              {loadingMore ? "Cargando…" : `Cargar más (${pageSize})`}
            </button>
          )}
        </div>
      ) : tipoFiltro === "recarga" ? (
        <p className="text-xs mt-3" style={{ color: "var(--fg-muted)" }}>
          Mostrando {recargasView.length.toLocaleString()} recargas
        </p>
      ) : tipoFiltro === "transf" ? (
        <p className="text-xs mt-3" style={{ color: "var(--fg-muted)" }}>
          Mostrando {transfView.length.toLocaleString()} transferencias
        </p>
      ) : (
        <p className="text-xs mt-3" style={{ color: "var(--fg-muted)" }}>
          Mostrando {itemsFiltrados.length.toLocaleString()} movimientos
        </p>
      )}

      {/* ─── Modal: editar carga ────────────────────────────────── */}
      <Dialog open={!!editCarga} onOpenChange={(open) => { if (!open) setEditCarga(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar carga {editCarga ? formatFolioCarga(editCarga) : ""}</DialogTitle>
          </DialogHeader>

          {editCarga && (
            <div className="rounded-xl border p-3 grid grid-cols-3 gap-3 text-xs"
              style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)" }}>
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "var(--fg-muted)" }}>Unidad</p>
                <p className="font-mono font-bold mt-0.5" style={{ color: "var(--fg)" }}>{editCarga.unidad?.codigo ?? "—"}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "var(--fg-muted)" }}>Origen</p>
                <p className="mt-0.5" style={{ color: "var(--fg)" }}>{editCarga.origen === "campo" ? "Campo" : "Patio"}</p>
              </div>
              <div>
                <p className="font-semibold uppercase tracking-wider text-[10px]" style={{ color: "var(--fg-muted)" }}>Tipo diesel</p>
                <p className="mt-0.5" style={{ color: "var(--fg)" }}>{editCarga.tipoDiesel ?? "normal"}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input name="fecha" type="date" value={editCargaForm.fecha} onChange={handleCargaFormChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input name="hora" type="time" value={editCargaForm.hora} onChange={handleCargaFormChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Folio</Label>
                <Input name="folio" type="number" value={editCargaForm.folio} onChange={handleCargaFormChange} className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Litros *</Label>
                <Input name="litros" type="number" step="0.5" value={editCargaForm.litros} onChange={handleCargaFormChange}
                  className="font-mono font-bold" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>
                Odómetro / Horas
                {editCarga?.kmEstimado && (
                  <span className="ml-2 text-[10px] text-amber-500 font-normal">fue estimado</span>
                )}
              </Label>
              <Input name="odometroHrs" type="number" step="1" value={editCargaForm.odometroHrs}
                onChange={handleCargaFormChange} className="font-mono" placeholder="Sin registro" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CuentaLT inicio</Label>
                <Input name="cuentaLtInicio" type="number" step="1" value={editCargaForm.cuentaLtInicio}
                  onChange={handleCargaFormChange} className="font-mono" placeholder="—" />
              </div>
              <div className="space-y-1.5">
                <Label>CuentaLT fin</Label>
                <Input name="cuentaLtFin" type="number" step="1" value={editCargaForm.cuentaLtFin}
                  onChange={handleCargaFormChange} className="font-mono" placeholder="—" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operador</Label>
                <Select name="operadorId" value={editCargaForm.operadorId} onChange={handleCargaFormChange}>
                  <option value="">— Ninguno —</option>
                  {operadores.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Obra</Label>
                <Select name="obraId" value={editCargaForm.obraId} onChange={handleCargaFormChange}>
                  <option value="">— Sin obra —</option>
                  {obras.map((o) => (<option key={o.id} value={o.id}>{o.nombre}</option>))}
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea name="notas" value={editCargaForm.notas} onChange={handleCargaFormChange}
                placeholder="Observaciones..." rows={2} />
            </div>
            {editCargaError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editCargaError}
              </p>
            )}
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>
              Cambiar litros ajusta automáticamente el stock del tanque.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button size="sm" disabled={isPending} onClick={saveEditCarga}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal: editar recarga ──────────────────────────────── */}
      <Dialog open={!!editRecarga} onOpenChange={(open) => { if (!open) setEditRecarga(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar recarga — {editRecarga?.tanqueNombre}</DialogTitle>
          </DialogHeader>

          {editRecarga && (
            <div className="rounded-xl border px-3 py-2 text-xs flex items-center gap-2"
              style={{ backgroundColor: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.3)" }}>
              <Fuel className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span style={{ color: "var(--fg-muted)" }}>
                Actual: <strong className="font-mono">{editRecarga.litros.toLocaleString()} L</strong>.
                Cambiar litros ajustará el stock del tanque por la diferencia.
              </span>
            </div>
          )}

          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input name="fecha" type="date" value={editRecargaForm.fecha} onChange={handleRecargaFormChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Litros *</Label>
                <Input name="litros" type="number" step="1" value={editRecargaForm.litros}
                  onChange={handleRecargaFormChange} className="font-mono font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Proveedor</Label>
                <Input name="proveedor" value={editRecargaForm.proveedor}
                  onChange={handleRecargaFormChange} placeholder="Ej. PEMEX" />
              </div>
              <div className="space-y-1.5">
                <Label>Folio factura</Label>
                <Input name="folioFactura" value={editRecargaForm.folioFactura}
                  onChange={handleRecargaFormChange} className="font-mono" placeholder="—" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Precio / litro</Label>
                <Input name="precioLitro" type="number" step="0.01" value={editRecargaForm.precioLitro}
                  onChange={handleRecargaFormChange} className="font-mono" placeholder="—" />
              </div>
              <div className="space-y-1.5">
                <Label>CuentaLT inicio</Label>
                <Input name="cuentalitrosInicio" type="number" step="1" value={editRecargaForm.cuentalitrosInicio}
                  onChange={handleRecargaFormChange} className="font-mono" placeholder="—" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea name="notas" value={editRecargaForm.notas} onChange={handleRecargaFormChange}
                placeholder="Observaciones..." rows={2} />
            </div>
            {editRecargaError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editRecargaError}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button size="sm" disabled={isPending} onClick={saveEditRecarga}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Lightbox: foto odómetro ────────────────────────────── */}
      <Dialog open={!!fotoViewer} onOpenChange={(open) => { if (!open) setFotoViewer(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-violet-400" />
              Foto odómetro{fotoViewer?.folio != null ? ` — Folio ${fotoViewer.folio}` : ""}
            </DialogTitle>
          </DialogHeader>
          {fotoViewer && (
            <div className="space-y-3">
              <img
                src={fotoViewer.url}
                alt="Foto odómetro"
                className="w-full rounded-xl object-contain max-h-[65vh] border"
                style={{ borderColor: "var(--border)" }}
              />
              <div className="flex justify-end">
                <a
                  href={fotoViewer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-[var(--surface-2)]"
                  style={{ color: "var(--fg-muted)", borderColor: "var(--border)" }}
                >
                  Abrir original ↗
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Modal: eliminar carga de período cerrado ──────────── */}
      <Dialog open={!!deleteNoteState} onOpenChange={(open) => { if (!open) setDeleteNoteState(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Eliminar de período cerrado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="rounded-xl border px-3 py-2.5 text-xs space-y-1"
              style={{ backgroundColor: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)" }}>
              <p className="font-semibold" style={{ color: "var(--fg)" }}>Atención: período cerrado</p>
              <p style={{ color: "var(--fg-muted)" }}>
                Esta carga pertenece a un período cerrado. Al eliminarla, el rendimiento
                de la unidad será recalculado automáticamente.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo de la eliminación *</Label>
              <Textarea
                value={deleteNoteState?.nota ?? ""}
                onChange={(e) =>
                  setDeleteNoteState((prev) => prev ? { ...prev, nota: e.target.value } : prev)
                }
                placeholder="Ej. Folio duplicado, error de captura, carga registrada en unidad incorrecta…"
                rows={3}
                autoFocus
              />
            </div>
            {deleteCargaError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {deleteCargaError}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isPending || !deleteNoteState?.nota.trim()}
              onClick={confirmDeleteConNota}
            >
              {isPending ? "Eliminando…" : "Confirmar eliminación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal: editar transferencia ───────────────────────── */}
      <Dialog open={!!editTransf} onOpenChange={(open) => { if (!open) setEditTransf(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar transferencia {editTransf ? formatFolioTransferencia(editTransf) : ""}</DialogTitle>
          </DialogHeader>

          {editTransf && (
            <div className="rounded-xl border px-3 py-2 text-xs flex items-center gap-2"
              style={{ backgroundColor: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.3)" }}>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "rgb(139,92,246)" }} />
              <span style={{ color: "var(--fg-muted)" }}>
                {editTransf.origenNombre} → {editTransf.destinoNombre} &nbsp;|&nbsp;
                Actual: <strong className="font-mono">{editTransf.litros.toLocaleString()} L</strong>.
                Cambiar litros ajustará ambos tanques.
              </span>
            </div>
          )}

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Folio del ticket</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--fg-muted)" }} />
                <Input name="folio" type="number" step="1" min="1" max={99999}
                  value={editTransfForm.folio} onChange={handleTransfFormChange}
                  placeholder="00000" className="font-mono font-bold pl-9" />
              </div>
              <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                Edita para corregir el folio — máx. 5 dígitos
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input name="fecha" type="date" value={editTransfForm.fecha} onChange={handleTransfFormChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Litros *</Label>
                <Input name="litros" type="number" step="1" value={editTransfForm.litros}
                  onChange={handleTransfFormChange} className="font-mono font-bold" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cuenta LT Inicio</Label>
                <Input name="cuentalitrosNissanInicio" type="number" step="1" min="0"
                  value={editTransfForm.cuentalitrosNissanInicio}
                  onChange={handleTransfFormChange}
                  className="font-mono" placeholder="—" />
              </div>
              <div className="space-y-1.5">
                <Label>Cuenta LT Fin</Label>
                <Input name="cuentalitrosDestino" type="number" step="1" min="0"
                  value={editTransfForm.cuentalitrosDestino}
                  onChange={handleTransfFormChange}
                  className="font-mono" placeholder="—" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea name="notas" value={editTransfForm.notas} onChange={handleTransfFormChange}
                placeholder="Observaciones..." rows={2} />
            </div>
            {editTransfError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {editTransfError}
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">Cancelar</Button>
            </DialogClose>
            <Button size="sm" disabled={isPending} onClick={saveEditTransf}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
