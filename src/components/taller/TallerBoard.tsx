"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Fuel, Plus, Search, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import OrdenNuevaForm from "@/components/taller/OrdenNuevaForm";
import FotoLightbox from "@/components/taller/FotoLightbox";
import { CHECKLIST_PUNTOS, ESTADO_LABEL, type EstadoOrden } from "@/lib/taller-checklist";
import { formatFechaDmy, formatFechaHoraMx, getNowLocal } from "@/lib/date-utils";
import DateDmyInput from "@/components/taller/DateDmyInput";
import {
  crearIncidenciaTaller,
  crearRegistroUreaTaller,
  getIncidenciasTaller,
  recibirIncidenciaTaller,
  cerrarOrdenTaller,
  terminarOrdenTaller,
  cancelarOrdenTaller,
  getOrdenTaller,
} from "@/app/actions/taller";
import type { AlertaMantenimiento } from "@/app/actions/mantenimiento";
import type { getBitacoraGeneralTaller, getUreaTaller } from "@/app/actions/taller";
import { CATEGORIAS_SIN_TALLER, etiquetaCategoriaTaller, formatoFolioTaller, TALLER_CATEGORIAS, TALLER_FALLAS, type CategoriaTaller } from "@/lib/taller-incidencias";
import { parseActividadesTaller, textoActividadesTaller } from "@/lib/taller-actividades";

type Incidencia = Awaited<ReturnType<typeof getIncidenciasTaller>>[number];
type Evento = Awaited<ReturnType<typeof getBitacoraGeneralTaller>>[number];
type UreaRegistro = Awaited<ReturnType<typeof getUreaTaller>>[number];
type OrdenDetalleBitacora = NonNullable<Awaited<ReturnType<typeof getOrdenTaller>>>;
type RegistroBitacora = {
  id: string;
  fecha: string;
  folio: number | null;
  unidadId: number;
  unidad: string;
  tipoUnidad: string;
  categoria: string;
  falla: string;
  operador: string;
  atendio: string;
  lugar: string;
  resolucion: string;
  costo: number;
  status: string;
  ordenId: number | null;
  observaciones: string;
  fechaEgreso: string | null;
  diasAbierta: number | null;
  historial: { tipo: string; detalle: string | null; createdAt: string | Date | null; usuarioNombre: string | null }[];
};
type Orden = {
  id: number;
  unidadId: number;
  incidenciaId: number | null;
  folio: number | null;
  fecha: string;
  createdAt: string | Date | null;
  kmHrs: number | null;
  motivo: string | null;
  estado: string;
  categoria?: string;
  quienAtendio?: string | null;
  proveedorExterno?: string | null;
  comentarios?: string | null;
  fechaSalida?: string | Date | null;
  cerradoAt?: string | Date | null;
  diagnosticoFinal?: string | null;
  trabajoRealizado?: string | null;
  observacionesSalida?: string | null;
  refacciones: { descripcion?: string; unidadMedida?: string | null; proveedor?: string | null; folioFactura?: string | null; origen?: string | null; precio: number | null; cantidad: number | null; iva: boolean }[];
  unidad: { id: number; codigo: string; tipo: string } | null;
  operador: { nombre: string } | null;
};
type Unidad = {
  id: number;
  codigo: string;
  tipo: string;
  odometroActual: number | null;
  odometroOffset: number | null;
  operadorDefaultId: number | null;
};
type Operador = { id: number; nombre: string };
type Seccion = "tablero" | "ordenes" | "bitacora";
type EstadoUnidad = "disponible" | "incidencia" | "taller" | "programada";

const ETIQUETA_ESTADO: Record<EstadoUnidad, string> = {
  disponible: "Disponible",
  incidencia: "Con incidencia",
  taller: "En taller",
  programada: "Mantenimiento próximo",
};
const ESTADOS_INCIDENCIA: Record<string, string> = {
  abierta: "Abierta",
  en_revision: "En proceso",
  recibida: "Recibida en taller",
  resuelta: "Resuelta",
  cancelada: "Descartada",
};

function fechaMx(value: string | Date | null) {
  if (!value) return "—";
  return formatFechaHoraMx(value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10), value instanceof Date ? value.toISOString() : null);
}

function estadoOrdenVariant(estado: string) {
  if (estado === "abierta") return "warning" as const;
  if (estado === "en_proceso") return "default" as const;
  if (estado === "terminada") return "warning" as const;
  if (estado === "cerrada") return "success" as const;
  return "secondary" as const;
}

function leerFallas(value: string | null | undefined, descripcion: string) {
  try {
    const parsed = value ? JSON.parse(value) : null;
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
  } catch { /* registros anteriores pueden tener texto plano */ }
  return descripcion ? [descripcion] : [];
}

function textoFallaReportada(value: string | null | undefined, descripcion: string) {
  const fallas = leerFallas(value, "");
  const detalle = descripcion.trim();
  if (!fallas.length) return detalle || "—";
  const resumen = fallas.join(", ");
  return detalle && detalle !== resumen ? `${resumen} · ${detalle}` : resumen;
}

function resumenProveedores(refacciones: Orden["refacciones"]) {
  return [...new Set(refacciones.flatMap((item) => {
    const proveedor = item.proveedor?.trim();
    if (!proveedor) return [];
    return [`${proveedor}${item.folioFactura ? ` · Factura ${item.folioFactura}` : ""}`];
  }))].join(", ");
}

function fotosChecklistJson(value: string | null | undefined): { url: string; key?: string; tipo?: string }[] {
  try {
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is { url: string; key?: string; tipo?: string } => Boolean(item && typeof item === "object" && "url" in item && typeof item.url === "string")) : [];
  } catch {
    return [];
  }
}

export default function TallerBoard({
  ordenes,
  programados,
  unidades,
  operadores,
  incidencias,
  incidenciasActivas,
  eventos,
  urea = [],
  ureaReady = true,
  canViewExpediente = false,
  canViewBitacora = false,
  canFinishOrders = false,
  canCloseOrders = false,
  canCancelOrders = false,
  extensionReady = true,
  initialNueva = false,
  initialUnidadId = "",
  initialPreventivo = null,
  initialSeccion = "tablero",
  unidadesEnTaller = 0,
}: {
  ordenes: Orden[];
  programados: AlertaMantenimiento[];
  unidades: Unidad[];
  operadores: Operador[];
  incidencias: Incidencia[];
  incidenciasActivas: { id: number; unidadId: number; estado: string }[];
  eventos: Evento[];
  urea?: UreaRegistro[];
  ureaReady?: boolean;
  canViewExpediente?: boolean;
  canViewBitacora?: boolean;
  canFinishOrders?: boolean;
  canCloseOrders?: boolean;
  canCancelOrders?: boolean;
  extensionReady?: boolean;
  initialNueva?: boolean;
  initialUnidadId?: string;
  initialPreventivo?: "km" | "hrs" | null;
  initialMes: string;
  initialSeccion?: Seccion;
  unidadesEnTaller?: number;
}) {
  const router = useRouter();
  const seccion = initialSeccion;
  const [modalOrden, setModalOrden] = useState(initialNueva);
  const [modalIncidencia, setModalIncidencia] = useState(false);
  const [modalUrea, setModalUrea] = useState(false);
  const [modalLlanta, setModalLlanta] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<Unidad | null>(null);
  const [incidenciaRecepcion, setIncidenciaRecepcion] = useState<Incidencia | null>(null);
  const [fechaRecepcion, setFechaRecepcion] = useState(getNowLocal().fecha);
  const [lecturaRecepcion, setLecturaRecepcion] = useState("");
  const [recibioRecepcion, setRecibioRecepcion] = useState("");
  const [unidadInicial, setUnidadInicial] = useState(initialUnidadId);
  const [preventivoInicial, setPreventivoInicial] = useState<"km" | "hrs" | null>(initialPreventivo);
  const [filtroCategoria, setFiltroCategoria] = useState<"todas" | "camion" | "maquina" | "equipo_ligero">("todas");
  const [filtroEstado, setFiltroEstado] = useState<"todas" | EstadoUnidad>("todas");
  const [filtroEstatusOrden, setFiltroEstatusOrden] = useState("activas");
  const [desdeOrdenes, setDesdeOrdenes] = useState("");
  const [hastaOrdenes, setHastaOrdenes] = useState("");
  const [filtroEquipoOrden, setFiltroEquipoOrden] = useState("todos");
  const [filtroCategoriaOrden, setFiltroCategoriaOrden] = useState("todas");
  const [filtroLugarOrden, setFiltroLugarOrden] = useState("todos");
  const [busquedaOrden, setBusquedaOrden] = useState("");
  const [unidadIncidencia, setUnidadIncidencia] = useState("");
  const [fechaIncidencia, setFechaIncidencia] = useState(getNowLocal().fecha);
  const [operadorIncidencia, setOperadorIncidencia] = useState("");
  const [categoriaIncidencia, setCategoriaIncidencia] = useState<CategoriaTaller>("otro");
  const [prioridad, setPrioridad] = useState("media");
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [unidadUrea, setUnidadUrea] = useState("");
  const [operadorUrea, setOperadorUrea] = useState("");
  const [fechaUrea, setFechaUrea] = useState(getNowLocal().fecha);
  const [litrosUrea, setLitrosUrea] = useState("");
  const [observacionesUrea, setObservacionesUrea] = useState("");
  const [unidadLlanta, setUnidadLlanta] = useState("");
  const [operadorLlanta, setOperadorLlanta] = useState("");
  const [fechaLlanta, setFechaLlanta] = useState(getNowLocal().fecha);
  const [vidaLlanta, setVidaLlanta] = useState("");
  const [posicionesLlanta, setPosicionesLlanta] = useState<string[]>([]);
  const [observacionesLlanta, setObservacionesLlanta] = useState("");
  const [fallasSeleccionadas, setFallasSeleccionadas] = useState<string[]>([]);
  const [incidenciasVista, setIncidenciasVista] = useState(incidencias);
  const [desdeIncidencias, setDesdeIncidencias] = useState(() => `${getNowLocal().fecha.slice(0, 7)}-01`);
  const [hastaIncidencias, setHastaIncidencias] = useState(() => getNowLocal().fecha);
  const [filtroUnidadIncidencia, setFiltroUnidadIncidencia] = useState("todas");
  const [incluirLlantas, setIncluirLlantas] = useState(true);
  const [busquedaIncidencia, setBusquedaIncidencia] = useState("");
  const [filtroTipoUnidad, setFiltroTipoUnidad] = useState("todas");
  const [filtroCategoriaBitacora, setFiltroCategoriaBitacora] = useState("todas");
  const [filtroEstadoBitacora, setFiltroEstadoBitacora] = useState("todas");
  const [ordenesSeleccionadas, setOrdenesSeleccionadas] = useState<number[]>([]);
  const [registrosSeleccionados, setRegistrosSeleccionados] = useState<string[]>([]);
  const [modalDetalleBitacora, setModalDetalleBitacora] = useState(false);
  const [registroDetalleBitacora, setRegistroDetalleBitacora] = useState<RegistroBitacora | null>(null);
  const [ordenDetalleBitacora, setOrdenDetalleBitacora] = useState<OrdenDetalleBitacora | null>(null);
  const [tabDetalleBitacora, setTabDetalleBitacora] = useState<"datos" | "checklist" | "refacciones">("datos");
  const [cargandoDetalleBitacora, setCargandoDetalleBitacora] = useState(false);
  const [errorDetalleBitacora, setErrorDetalleBitacora] = useState("");
  const [incluirUrea, setIncluirUrea] = useState(true);
  const [cargandoIncidencias, setCargandoIncidencias] = useState(false);
  const skipInitialIncidenciasFetch = useRef(true);
  const [exportandoBitacora, setExportandoBitacora] = useState(false);
  const exportandoBitacoraRef = useRef(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => setIncidenciasVista(incidencias), [incidencias]);

  useEffect(() => {
    if (skipInitialIncidenciasFetch.current) {
      skipInitialIncidenciasFetch.current = false;
      return;
    }
    if (!desdeIncidencias && !hastaIncidencias) {
      setIncidenciasVista(incidencias);
      return;
    }
    if (desdeIncidencias && hastaIncidencias && desdeIncidencias > hastaIncidencias) {
      setIncidenciasVista([]);
      return;
    }
    let vigente = true;
    setCargandoIncidencias(true);
    getIncidenciasTaller({ desde: desdeIncidencias || "2000-01-01", hasta: hastaIncidencias || getNowLocal().fecha }).then((rows) => {
      if (vigente) setIncidenciasVista(rows);
    }).catch((err) => {
      if (vigente) setError(err instanceof Error ? err.message : "No se pudieron cargar las incidencias.");
    }).finally(() => {
      if (vigente) setCargandoIncidencias(false);
    });
    return () => { vigente = false; };
  }, [desdeIncidencias, hastaIncidencias, incidencias]);

  const unidadesEnVista = useMemo(() => {
    const unidadesConIncidencias = new Set(incidenciasActivas.map((i) => i.unidadId));
    const ordenesActivas = new Set(ordenes.filter((o) => ["abierta", "en_proceso", "terminada"].includes(o.estado)).map((o) => o.unidad?.id).filter((id): id is number => Boolean(id)));
    const programadas = new Set(programados.map((p) => p.unidadId));
    return unidades.map((unidad) => {
      const estado: EstadoUnidad = ordenesActivas.has(unidad.id)
        ? "taller"
        : unidadesConIncidencias.has(unidad.id)
          ? "incidencia"
          : programadas.has(unidad.id)
            ? "programada"
            : "disponible";
      return { ...unidad, estado };
    }).filter((unidad) => {
      const categoriaCoincide = filtroCategoria === "todas"
        || unidad.tipo === filtroCategoria
        || (filtroCategoria === "equipo_ligero" && (unidad.tipo === "nissan" || unidad.tipo === "otro"));
      return categoriaCoincide && (filtroEstado === "todas" || unidad.estado === filtroEstado);
    });
  }, [unidades, ordenes, incidenciasActivas, programados, filtroCategoria, filtroEstado]);
  const hoyLocal = getNowLocal().fecha;
  const inicioMesActual = `${hoyLocal.slice(0, 7)}-01`;
  const esteMesActivo = desdeIncidencias === inicioMesActual && hastaIncidencias === hoyLocal;

  const ordenesFiltradas = useMemo(() => {
    const query = busquedaOrden.trim().toLocaleLowerCase("es-MX");
    return ordenes.filter((orden) => {
      const categoria = orden.categoria ?? "otro";
      const esProveedor = Boolean(orden.proveedorExterno?.trim()) || orden.refacciones.some((r) => r.origen === "Proveedor externo");
      const texto = [
        orden.folio != null ? formatoFolioTaller(orden.folio) : "",
        orden.motivo,
        orden.trabajoRealizado,
        orden.diagnosticoFinal,
        orden.comentarios,
        orden.unidad?.codigo,
        orden.proveedorExterno,
        ...orden.refacciones.flatMap((r) => [r.descripcion, r.proveedor, r.folioFactura]),
      ].filter(Boolean).join(" ").toLocaleLowerCase("es-MX");
      const coincideEstado = filtroEstatusOrden === "todas"
        || (filtroEstatusOrden === "activas" && ["abierta", "en_proceso", "terminada"].includes(orden.estado))
        || orden.estado === filtroEstatusOrden;
      return coincideEstado
        && (!desdeOrdenes || orden.fecha >= desdeOrdenes)
        && (!hastaOrdenes || orden.fecha <= hastaOrdenes)
        && (filtroEquipoOrden === "todos" || String(orden.unidad?.id ?? orden.unidadId) === filtroEquipoOrden)
        && (filtroCategoriaOrden === "todas" || categoria === filtroCategoriaOrden)
        && (filtroLugarOrden === "todos" || (filtroLugarOrden === "proveedor" ? esProveedor : !esProveedor))
        && (!query || texto.includes(query));
    });
  }, [ordenes, filtroEstatusOrden, desdeOrdenes, hastaOrdenes, filtroEquipoOrden, filtroCategoriaOrden, filtroLugarOrden, busquedaOrden]);

  const columnasOrdenes = [
    { estado: "abierta", titulo: "ABIERTO" },
    { estado: "en_proceso", titulo: "EN PROCESO" },
    { estado: "terminada", titulo: "TERMINADO · EN PROCESO DE CIERRE" },
  ].map((columna) => ({ ...columna, ordenes: ordenesFiltradas.filter((orden) => orden.estado === columna.estado) }));
  const ordenesNoActivasFiltradas = ordenesFiltradas.filter((orden) => !["abierta", "en_proceso", "terminada"].includes(orden.estado));

  const conteos = useMemo(() => {
    const rows = unidades.map((u) => {
      const conOrden = ordenes.some((o) => o.unidad?.id === u.id && ["abierta", "en_proceso", "terminada"].includes(o.estado));
      const conIncidencia = incidenciasActivas.some((i) => i.unidadId === u.id);
      const programada = programados.some((p) => p.unidadId === u.id);
      return conOrden ? "taller" : conIncidencia ? "incidencia" : programada ? "programada" : "disponible";
    });
    const proveedorExterno = new Set(ordenes
      .filter((o) => ["abierta", "en_proceso", "terminada"].includes(o.estado) && Boolean(o.proveedorExterno?.trim()))
      .map((o) => o.unidad?.id ?? o.unidadId));
    const unidadesEnTaller = rows.filter((estado) => estado === "taller").length;
    return {
      unidades: unidades.length,
      taller: Math.max(0, unidadesEnTaller - proveedorExterno.size),
      proveedorExterno: proveedorExterno.size,
      incidencias: rows.filter((s) => s === "incidencia").length,
      programadas: rows.filter((s) => s === "programada").length,
      disponibles: rows.filter((s) => s === "disponible").length,
    };
  }, [unidades, ordenes, incidenciasActivas, programados]);

  const conteosCategoria = useMemo(() => ({
    todas: unidades.length,
    camion: unidades.filter((u) => u.tipo === "camion").length,
    maquina: unidades.filter((u) => u.tipo === "maquina").length,
    equipo_ligero: unidades.filter((u) => u.tipo === "nissan" || u.tipo === "otro").length,
  }), [unidades]);

  const registrosBitacora = useMemo(() => {
    const incidenciasConOrden = new Set<number>();
    const registros: RegistroBitacora[] = incidenciasVista.map((incidencia) => {
      const orden = ordenes.find((item) => item.incidenciaId === incidencia.id)
        ?? (incidencia.orden ? ordenes.find((item) => item.id === incidencia.orden?.id) : undefined);
      if (orden) incidenciasConOrden.add(orden.id);
      const proveedor = orden?.proveedorExterno?.trim() ?? "";
      const refs = orden?.refacciones ?? [];
      const costo = refs.reduce((total, ref) => {
        const base = (Number(ref.precio) || 0) * (Number(ref.cantidad) || 1);
        return total + (ref.iva ? base * 1.16 : base);
      }, 0);
      const status = orden?.estado === "cerrada" ? "CERRADO"
        : orden?.estado === "terminada" ? "PENDIENTE DE CIERRE"
        : orden?.estado === "cancelada" ? "CANCELADO"
          : orden?.estado === "en_proceso" ? "EN PROCESO"
            : orden ? "ABIERTO"
        : CATEGORIAS_SIN_TALLER.includes(incidencia.categoria as typeof CATEGORIAS_SIN_TALLER[number]) ? "CERRADO"
          : incidencia.estado === "resuelta" ? "TERMINADO"
            : incidencia.estado === "cancelada" ? "CANCELADO"
              : incidencia.estado === "en_revision" || incidencia.estado === "recibida" ? "EN PROCESO" : "ABIERTO";
      const historial = eventos.filter((evento) => evento.incidenciaId === incidencia.id || (orden && evento.ordenId === orden.id)).map((evento) => ({
        tipo: evento.tipo,
        detalle: evento.detalle,
        createdAt: evento.createdAt,
        usuarioNombre: evento.usuarioNombre,
      }));
      const esLlantaInformativa = incidencia.categoria === "llanta_danada";
      return {
        id: `incidencia-${incidencia.id}`,
        fecha: orden?.fecha ?? incidencia.fecha,
        fechaEgreso: fechaComoTexto(orden?.fechaSalida) ?? fechaComoTexto(orden?.cerradoAt),
        diasAbierta: orden ? diasEntre(orden.fecha, fechaComoTexto(orden.fechaSalida) ?? fechaComoTexto(orden.cerradoAt) ?? getNowLocal().fecha) : null,
        folio: orden?.folio ?? incidencia.folio,
        unidadId: incidencia.unidadId,
        unidad: incidencia.unidad?.codigo ?? "—",
        tipoUnidad: incidencia.unidad?.tipo ?? "otro",
        categoria: etiquetaCategoriaTaller(orden?.categoria ?? incidencia.categoria),
        falla: textoFallaReportada(incidencia.fallas, incidencia.descripcion),
        operador: incidencia.operador?.nombre ?? "—",
        atendio: orden ? [...new Set(parseActividadesTaller(orden.trabajoRealizado, orden.quienAtendio ?? "").map((a) => a.atendio).filter(Boolean))].join(", ") || orden.quienAtendio || incidencia.atendio || "—" : incidencia.atendio ?? "—",
        lugar: esLlantaInformativa ? "" : proveedor ? proveedor : orden ? "TALLER" : incidencia.ubicacion ?? "—",
        resolucion: esLlantaInformativa ? "" : [...new Set([textoActividadesTaller(orden?.trabajoRealizado, orden?.quienAtendio ?? ""), orden?.diagnosticoFinal, orden?.observacionesSalida, incidencia.resolucion, incidencia.observaciones, orden?.comentarios].map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].join(", ") || "—",
        costo,
        status,
        ordenId: orden?.id ?? incidencia.orden?.id ?? null,
        observaciones: esLlantaInformativa ? "" : incidencia.observaciones ?? "",
        historial,
      };
    });
    for (const orden of ordenes) {
      if (incidenciasConOrden.has(orden.id) || (orden.incidenciaId != null && incidenciasVista.some((item) => item.id === orden.incidenciaId))) continue;
      const proveedor = orden.proveedorExterno?.trim() ?? "";
      const refs = orden.refacciones ?? [];
      const costo = refs.reduce((total, ref) => {
        const base = (Number(ref.precio) || 0) * (Number(ref.cantidad) || 1);
        return total + (ref.iva ? base * 1.16 : base);
      }, 0);
      registros.push({
        id: `orden-${orden.id}`,
        fecha: orden.fecha,
        fechaEgreso: fechaComoTexto(orden.fechaSalida) ?? fechaComoTexto(orden.cerradoAt),
        diasAbierta: diasEntre(orden.fecha, fechaComoTexto(orden.fechaSalida) ?? fechaComoTexto(orden.cerradoAt) ?? getNowLocal().fecha),
        folio: orden.folio,
        unidadId: orden.unidad?.id ?? orden.unidadId,
        unidad: orden.unidad?.codigo ?? "—",
        tipoUnidad: orden.unidad?.tipo ?? "otro",
        categoria: etiquetaCategoriaTaller(orden.categoria),
        falla: orden.motivo ?? "Servicio de taller",
        operador: orden.operador?.nombre ?? "—",
        atendio: [...new Set(parseActividadesTaller(orden.trabajoRealizado, orden.quienAtendio ?? "").map((a) => a.atendio).filter(Boolean))].join(", ") || orden.quienAtendio || "—",
        lugar: proveedor || "TALLER",
        resolucion: [...new Set([textoActividadesTaller(orden.trabajoRealizado, orden.quienAtendio ?? ""), orden.diagnosticoFinal, orden.observacionesSalida, orden.comentarios].map((value) => value?.trim()).filter((value): value is string => Boolean(value)))].join(", ") || "—",
        costo,
        status: orden.estado === "cerrada" ? "CERRADO" : orden.estado === "terminada" ? "PENDIENTE DE CIERRE" : orden.estado === "cancelada" ? "CANCELADO" : orden.estado === "abierta" ? "ABIERTO" : "EN PROCESO",
        ordenId: orden.id,
        observaciones: "",
        historial: eventos.filter((evento) => evento.ordenId === orden.id).map((evento) => ({ tipo: evento.tipo, detalle: evento.detalle, createdAt: evento.createdAt, usuarioNombre: evento.usuarioNombre })),
      });
    }
    if (incluirUrea) {
      registros.push(...urea.map((registro) => ({
        id: `urea-${registro.id}`,
        fecha: registro.fecha,
        fechaEgreso: null,
        diasAbierta: null,
        folio: null,
        unidadId: registro.unidadId,
        unidad: registro.unidadCodigo,
        tipoUnidad: unidades.find((item) => item.id === registro.unidadId)?.tipo ?? "otro",
        categoria: "Urea",
        falla: `${Number(registro.litros).toLocaleString("es-MX")} L de urea`,
        operador: registro.operadorNombre ?? "—",
        atendio: "—",
        lugar: "",
        resolucion: "",
        costo: 0,
        status: "CERRADO",
        ordenId: null,
        observaciones: "",
        historial: [],
      })));
    }
    return registros.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [incidenciasVista, ordenes, eventos, incluirUrea, urea, unidades]);

  const registrosBitacoraFiltrados = useMemo(() => {
    const query = busquedaIncidencia.trim().toLocaleLowerCase("es-MX");
    return registrosBitacora.filter((registro) => {
      const texto = [registro.folio != null ? formatoFolioTaller(registro.folio) : "", registro.categoria, registro.unidad, registro.falla, registro.operador, registro.atendio, registro.lugar, registro.resolucion, registro.status, registro.observaciones, ...registro.historial.map((item) => item.detalle)]
        .filter(Boolean).join(" ").toLocaleLowerCase("es-MX");
      return (!desdeIncidencias || registro.fecha >= desdeIncidencias)
        && (!hastaIncidencias || registro.fecha <= hastaIncidencias)
        && (filtroUnidadIncidencia === "todas" || String(registro.unidadId) === filtroUnidadIncidencia)
        && (filtroTipoUnidad === "todas" || registro.tipoUnidad === filtroTipoUnidad)
        && (filtroCategoriaBitacora === "todas" || registro.categoria === filtroCategoriaBitacora)
        && (filtroEstadoBitacora === "todas" || registro.status === filtroEstadoBitacora)
        && (incluirLlantas || !registro.categoria.toLocaleLowerCase("es-MX").includes("llanta"))
        && (!query || texto.includes(query));
    });
  }, [registrosBitacora, desdeIncidencias, hastaIncidencias, filtroUnidadIncidencia, filtroTipoUnidad, filtroCategoriaBitacora, filtroEstadoBitacora, incluirLlantas, busquedaIncidencia]);

  const mesVigente = getNowLocal().fecha.slice(0, 7);
  const ureaPorMes = useMemo(() => {
    const rows = urea.filter((r) => r.fecha.startsWith(mesVigente));
    const porUnidad = new Map<number, { codigo: string; litros: number; cargas: number }>();
    for (const row of rows) {
      const current = porUnidad.get(row.unidadId) ?? { codigo: row.unidadCodigo, litros: 0, cargas: 0 };
      current.litros += Number(row.litros) || 0;
      current.cargas += 1;
      porUnidad.set(row.unidadId, current);
    }
    return { rows, litros: rows.reduce((total, row) => total + (Number(row.litros) || 0), 0), porUnidad: [...porUnidad.values()].sort((a, b) => b.litros - a.litros) };
  }, [urea, mesVigente]);
  const etiquetaMesUrea = new Date(`${mesVigente}-15T12:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const llantasMes = useMemo(() => incidencias.filter((i) =>
    i.fecha.startsWith(mesVigente)
    && i.categoria === "llanta_danada"
    && /·\s*\d+(?:[.,]\d+)?%\s+de vida$/i.test(i.descripcion)
  ), [incidencias, mesVigente]);

  async function exportarBitacora() {
    if (exportandoBitacoraRef.current) return;
    exportandoBitacoraRef.current = true;
    setExportandoBitacora(true);
    try {
    const ExcelJS = await import("exceljs");
    const response = await fetch("/templates/bitacora-taller-cliente-template.xlsx");
    if (!response.ok) throw new Error("No se pudo cargar la plantilla de Bitácora.");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await response.arrayBuffer());
    const general = workbook.getWorksheet("BITACORA GENERAL");
    const desglose = workbook.getWorksheet("BITACORA DESGLOSE");
    const costos = workbook.getWorksheet("COSTOS");
    if (!general || !desglose || !costos) throw new Error("La plantilla debe contener BITACORA GENERAL, BITACORA DESGLOSE y COSTOS.");
    for (const sheet of [general, desglose, costos]) {
      sheet.views = [{ showGridLines: false }];
      sheet.pageSetup.showGridLines = false;
    }

    const actualRows = registrosSeleccionados.length
      ? registrosBitacora.filter((row) => registrosSeleccionados.includes(row.id))
      : registrosBitacoraFiltrados;

    const rowStyles = (sheet: NonNullable<typeof general>, sourceRow: number, firstColumn: number, lastColumn: number) => ({
      height: sheet.getRow(sourceRow).height,
      cells: Array.from({ length: lastColumn - firstColumn + 1 }, (_, index) => structuredClone(sheet.getRow(sourceRow).getCell(firstColumn + index).style)),
    });
    const applyRowStyles = (sheet: NonNullable<typeof general>, targetRow: number, source: ReturnType<typeof rowStyles>, firstColumn: number) => {
      const row = sheet.getRow(targetRow);
      if (source.height != null) row.height = source.height;
      source.cells.forEach((style, index) => { row.getCell(firstColumn + index).style = structuredClone(style); });
      return row;
    };
    // La plantilla declara dimensiones hasta la fila 1,048,576 en dos hojas,
    // aunque sus bloques de captura solo llegan a la fila 38. No usar rowCount
    // como límite: ExcelJS lo interpreta como una hoja con un millón de filas.
    const templateLastRow = 40;
    const clearValues = (sheet: NonNullable<typeof general>, fromRow: number, toRow: number) => {
      for (let rowNo = fromRow; rowNo <= toRow; rowNo += 1) {
        sheet.getRow(rowNo).eachCell({ includeEmpty: true }, (cell) => { cell.value = null; });
      }
    };
    const clearStyles = (sheet: NonNullable<typeof general>, fromRow: number, toRow: number, fromColumn: number, toColumn: number) => {
      for (let rowNo = fromRow; rowNo <= toRow; rowNo += 1) {
        const row = sheet.getRow(rowNo);
        for (let col = fromColumn; col <= toColumn; col += 1) row.getCell(col).style = {};
      }
    };
    const dateOnly = (value: string | Date | null | undefined) => {
      if (!value) return "";
      return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
    };
    const excelDate = (value: string | Date | null | undefined) => {
      const date = dateOnly(value);
      return date ? new Date(`${date}T12:00:00.000Z`) : "";
    };
    const folioLabel = (row: RegistroBitacora) => row.categoria === "Urea"
      ? "UREA"
      : row.categoria === "Llanta dañada"
        ? "LLANTA DAÑADA"
        : row.folio != null ? formatoFolioTaller(row.folio) : "Pendiente";
    const esInformativo = (row: RegistroBitacora) => row.categoria === "Urea" || row.categoria === "Llanta dañada";

    // Hoja general: se conserva el formato del cliente y se repite la fila modelo.
    const generalModel = rowStyles(general, 5, 2, 11);
    const generalTemplateEnd = templateLastRow;
    clearValues(general, 5, generalTemplateEnd);
    clearStyles(general, 5, generalTemplateEnd, 2, 11);
    actualRows.forEach((row, index) => {
      const n = index + 5;
      const target = applyRowStyles(general, n, generalModel, 2);
      target.getCell(2).value = excelDate(row.fecha);
      target.getCell(2).numFmt = "dd/mm/yyyy";
      const values = [folioLabel(row), row.unidad, row.falla, row.operador, row.atendio, esInformativo(row) ? "" : row.lugar, esInformativo(row) ? "" : row.resolucion, row.costo || "—", row.status];
      values.forEach((value, offset) => {
        const cell = target.getCell(offset + 3);
        cell.value = typeof value === "string" ? value.toLocaleUpperCase("es-MX") : value;
        cell.alignment = { ...cell.alignment, vertical: "top", wrapText: true };
      });
      const estado = target.getCell(11);
      estado.fill = { type: "pattern", pattern: "none" };
      estado.font = { ...structuredClone(estado.font), bold: true, color: { argb: "FF000000" } };
    });
    if (!actualRows.length) general.getCell("B5").value = "SIN REGISTROS PARA LOS FILTROS SELECCIONADOS";
    const generalLastRow = actualRows.length ? actualRows.length + 4 : 5;
    general.autoFilter = { from: "B4", to: `K${generalLastRow}` };
    general.pageSetup.printArea = `B3:K${generalLastRow}`;

    // Prepara datos de órdenes una sola vez para las hojas de actividades y costos.
    const rowsByOrder = new Map<number, RegistroBitacora>();
    for (const row of actualRows) if (row.ordenId != null && !esInformativo(row)) rowsByOrder.set(row.ordenId, row);
    const selectedOrders = ordenes
      .filter((order) => rowsByOrder.has(order.id))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id);
    const groupedOrders = new Map<number, Orden[]>();
    for (const order of selectedOrders) {
      const key = order.unidad?.id ?? order.unidadId;
      groupedOrders.set(key, [...(groupedOrders.get(key) ?? []), order]);
    }

    // BITACORA DESGLOSE: un bloque por unidad y una fila por actividad registrada.
    const detailStyles = new Map<number, ReturnType<typeof rowStyles>>();
    const detailTemplateEnd = 32;
    for (let row = 1; row <= detailTemplateEnd; row += 1) detailStyles.set(row, rowStyles(desglose, row, 2, 4));
    for (const merge of [...desglose.model.merges]) desglose.unMergeCells(merge);
    clearValues(desglose, 2, detailTemplateEnd);
    clearStyles(desglose, 2, detailTemplateEnd, 2, 4);
    let detailLastRow = 1;
    let detailStart = 3;
    const detailGroups = [...groupedOrders.entries()].sort((a, b) => (a[1][0]?.unidad?.codigo ?? "").localeCompare(b[1][0]?.unidad?.codigo ?? "", "es-MX"));
    const activityRows = (orders: Orden[]) => orders.flatMap((order) => {
      const source = rowsByOrder.get(order.id);
      const work = parseActividadesTaller(order.trabajoRealizado, order.quienAtendio ?? "");
      const fallback = [order.diagnosticoFinal, order.observacionesSalida, order.comentarios, source?.resolucion]
        .find((value) => value?.trim())?.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) ?? [];
      const activities = work.length ? work.map((activity) => activity.trabajo) : fallback;
      const notes = [order.comentarios, order.observacionesSalida]
        .map((value) => value?.trim())
        .filter((value): value is string => typeof value === "string" && value.length > 0 && !activities.includes(value));
      const note = [
        `OS ${formatoFolioTaller(order.folio)} · ingreso ${dateOnly(order.fecha)}`,
        ...notes,
      ].join(" · ");
      return activities.map((activity) => ({ order, activity, note, atendio: work.find((row) => row.trabajo === activity)?.atendio || order.quienAtendio || "—" }));
    });
    for (const [, orders] of detailGroups) {
      const activities = activityRows(orders);
      const metaLabels = ["No. ECONOMICO:", "OPERADOR:", "KM/HRS", "FECHA DE INGRESO:", "FECHA DE SALIDA:", "FOLIO OS:"];
      const exitDates = orders.map((order) => dateOnly(order.fechaSalida) || dateOnly(order.cerradoAt)).filter(Boolean).sort();
      const tieneOrdenAbierta = orders.some((order) => !["cerrada", "cancelada"].includes(order.estado));
      const entries = [
        orders[0]?.unidad?.codigo ?? "—",
        [...new Set(orders.map((order) => order.operador?.nombre).filter((name): name is string => Boolean(name)))].join(", ") || "—",
        orders.at(-1)?.kmHrs ?? "—",
        excelDate(orders[0]?.fecha),
        tieneOrdenAbierta && exitDates.length === 0 ? "PENDIENTE" : excelDate(exitDates.at(-1)),
        orders.map((order) => formatoFolioTaller(order.folio)).join(", "),
      ];
      metaLabels.forEach((label, index) => {
        const rowNo = detailStart + index;
        const target = applyRowStyles(desglose, rowNo, detailStyles.get(index + 3)!, 2);
        target.getCell(2).value = label;
        target.getCell(3).value = entries[index];
        target.getCell(3).alignment = { ...target.getCell(3).alignment, wrapText: true, vertical: "top" };
        desglose.mergeCells(rowNo, 3, rowNo, 4);
        if (index === 3 || index === 4) target.getCell(3).numFmt = "dd/mm/yyyy";
      });
      const issueRowNo = detailStart + 7;
      const issue = applyRowStyles(desglose, issueRowNo, detailStyles.get(10)!, 2);
      issue.getCell(2).value = "FALLA / REVISION";
      issue.getCell(3).value = [...new Set(orders.map((order) => rowsByOrder.get(order.id)?.falla || order.motivo).filter(Boolean))].join("\n") || "—";
      issue.getCell(3).alignment = { ...issue.getCell(3).alignment, wrapText: true, vertical: "top" };
      desglose.mergeCells(issueRowNo, 3, issueRowNo, 4);
      const tableHeaderNo = detailStart + 9;
      if (activities.length) {
        const tableHeader = applyRowStyles(desglose, tableHeaderNo, detailStyles.get(12)!, 2);
        ["ATIENDE", "NOTAS", "RESOLUCION"].forEach((value, index) => { tableHeader.getCell(index + 2).value = value; });
      }
      const dataStart = detailStart + 10;
      activities.forEach((activity, index) => {
        const sourceRowNo = 13 + (index % 7);
        const target = applyRowStyles(desglose, dataStart + index, detailStyles.get(sourceRowNo)!, 2);
        const values = [activity.atendio, activity.note, activity.activity];
        values.forEach((value, offset) => {
          const cell = target.getCell(offset + 2);
          cell.value = value;
          cell.alignment = { ...cell.alignment, wrapText: true, vertical: "top" };
        });
        const lines = Math.max(1, ...values.map((value) => Math.ceil(String(value).length / (value === activity.activity ? 78 : 26))));
        target.height = Math.max(target.height ?? 0, Math.min(120, lines * 15));
      });
      detailLastRow = activities.length ? dataStart + activities.length - 1 : issueRowNo;
      detailStart = detailLastRow + 3;
    }
    if (!detailGroups.length) {
      const empty = applyRowStyles(desglose, 3, detailStyles.get(3)!, 2);
      empty.getCell(2).value = "SIN ÓRDENES CON ACTIVIDADES EN LA SELECCIÓN";
      detailLastRow = 3;
    }
    desglose.pageSetup.printArea = `B1:D${detailLastRow}`;

    // COSTOS: una sección por orden con sus refacciones, proveedor, factura y total con IVA.
    const costStyles = new Map<number, ReturnType<typeof rowStyles>>();
    const costTemplateEnd = templateLastRow;
    for (let row = 1; row <= costTemplateEnd; row += 1) costStyles.set(row, rowStyles(costos, row, 2, 8));
    for (const merge of [...costos.model.merges]) if (merge !== "B1:D1") costos.unMergeCells(merge);
    clearValues(costos, 2, costTemplateEnd);
    clearStyles(costos, 2, costTemplateEnd, 2, 8);
    const ordersWithCosts = selectedOrders.filter((order) => order.refacciones?.length);
    let costLastRow = 1;
    let costStart = 3;
    for (const order of ordersWithCosts) {
      const metadata = [
        ["No. ECONOMICO:", order.unidad?.codigo ?? "—", 3],
        ["OPERADOR:", order.operador?.nombre ?? "—", 4],
        ["KM/HRS", order.kmHrs ?? "—", 5],
        ["FECHA DE INGRESO:", excelDate(order.fecha), 6],
        ["FECHA DE SALIDA:", excelDate(order.fechaSalida ?? order.cerradoAt) || (!["cerrada", "cancelada"].includes(order.estado) ? "PENDIENTE" : ""), 7],
        ["FOLIO OS:", formatoFolioTaller(order.folio), 32],
      ] as const;
      metadata.forEach(([label, value, sourceRow], index) => {
        const rowNo = costStart + index;
        const target = applyRowStyles(costos, rowNo, costStyles.get(sourceRow)!, 2);
        target.getCell(2).value = label;
        target.getCell(3).value = value;
        target.getCell(3).alignment = { ...target.getCell(3).alignment, wrapText: true };
        costos.mergeCells(rowNo, 3, rowNo, 4);
        if (index === 3 || index === 4) target.getCell(3).numFmt = "dd/mm/yyyy";
      });
      const costLabelRow = costStart + 6;
      const costLabel = applyRowStyles(costos, costLabelRow, costStyles.get(9)!, 2);
      costLabel.getCell(2).value = "COSTO:";
      const sectionTitleRow = costStart + 8;
      const sectionTitle = applyRowStyles(costos, sectionTitleRow, costStyles.get(11)!, 2);
      sectionTitle.getCell(2).value = "DETALLE DE GASTOS Y REFACCIONES";
      costos.mergeCells(sectionTitleRow, 2, sectionTitleRow, 6);
      const headerRowNo = costStart + 9;
      const header = applyRowStyles(costos, headerRowNo, costStyles.get(12)!, 2);
      ["CANT.", "MATERIAL UTILIZADO:", "COSTO U.", "IMPORTE", "IMPUESTO", "PROVEEDOR:", "FACTURA:"].forEach((value, index) => { header.getCell(index + 2).value = value; });
      const itemStart = headerRowNo + 1;
      order.refacciones.forEach((ref, index) => {
        const rowNo = itemStart + index;
        const item = applyRowStyles(costos, rowNo, costStyles.get(13)!, 2);
        item.getCell(2).value = ref.cantidad ?? 1;
        item.getCell(3).value = [ref.descripcion, ref.unidadMedida && ref.unidadMedida !== "pz" ? `(${ref.unidadMedida})` : ""].filter(Boolean).join(" ").toLocaleUpperCase("es-MX");
        item.getCell(4).value = ref.precio ?? 0;
        item.getCell(4).numFmt = "$#,##0.00";
        item.getCell(5).value = { formula: `D${rowNo}*B${rowNo}` };
        item.getCell(5).numFmt = "$#,##0.00";
        item.getCell(6).value = { formula: `E${rowNo}*${ref.iva === false ? "1" : "1.16"}` };
        item.getCell(6).numFmt = "$#,##0.00";
        item.getCell(7).value = ref.proveedor?.toLocaleUpperCase("es-MX") ?? "—";
        item.getCell(8).value = ref.folioFactura?.toLocaleUpperCase("es-MX") ?? "—";
        item.getCell(3).alignment = { ...item.getCell(3).alignment, wrapText: true, vertical: "top" };
      });
      const totalRowNo = itemStart + order.refacciones.length;
      const total = applyRowStyles(costos, totalRowNo, costStyles.get(21)!, 2);
      total.getCell(5).value = "TOTAL";
      total.getCell(6).value = { formula: `SUM(F${itemStart}:F${totalRowNo - 1})` };
      total.getCell(6).numFmt = "$#,##0.00";
      costLabel.getCell(3).value = { formula: `F${totalRowNo}` };
      costLabel.getCell(3).numFmt = "$#,##0.00";
      costLastRow = totalRowNo;
      costStart = totalRowNo + 3;
    }
    if (!ordersWithCosts.length) {
      const empty = applyRowStyles(costos, 3, costStyles.get(3)!, 2);
      empty.getCell(2).value = "SIN REFACCIONES EN LA SELECCIÓN";
      costLastRow = 3;
    }
    costos.pageSetup.printArea = `B1:H${costLastRow}`;
    workbook.calcProperties.fullCalcOnLoad = true;

    for (const sheet of [general, desglose, costos]) {
      sheet.eachRow({ includeEmpty: false }, (row) => row.eachCell({ includeEmpty: false }, (cell) => {
        if (typeof cell.value === "string") cell.value = cell.value.toLocaleUpperCase("es-MX");
      }));
    }

    const bytes = await workbook.xlsx.writeBuffer();
    const blob = new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bitacora-taller-${getNowLocal().fecha}.xlsx`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 1000);
    } finally {
      exportandoBitacoraRef.current = false;
      setExportandoBitacora(false);
    }
  }

  function puedeSeleccionarOrden(row: RegistroBitacora) {
    return canCancelOrders && row.ordenId != null && ["ABIERTO", "EN PROCESO", "PENDIENTE DE CIERRE"].includes(row.status);
  }

  function tarjetaOrden(orden: Orden) {
    return <Link key={orden.id} href={`/taller/${orden.id}`} className="block rounded-xl border p-3 hover:border-indigo-400/50" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
      <div className="flex items-center justify-between gap-2"><p className="font-mono text-sm font-bold">{formatoFolioTaller(orden.folio)} · {orden.unidad?.codigo ?? "—"}</p><Badge variant={estadoOrdenVariant(orden.estado)}>{ESTADO_LABEL[orden.estado as EstadoOrden] ?? orden.estado}</Badge></div>
      <p className="mt-2 line-clamp-2 text-sm">{orden.motivo || "Sin motivo"}</p>
      {orden.trabajoRealizado && <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--fg-muted)" }}>{textoActividadesTaller(orden.trabajoRealizado, orden.quienAtendio ?? "")}</p>}
      <p className="mt-2 text-xs" style={{ color: "var(--fg-muted)" }}>{fechaMx(orden.createdAt)}{orden.operador?.nombre ? ` · ${orden.operador.nombre}` : ""}</p>
    </Link>;
  }

  function fechaComoTexto(value: string | Date | null | undefined) {
    if (!value) return null;
    return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  }

  function diasEntre(inicio: string | null, fin: string | null) {
    if (!inicio || !fin) return null;
    const a = Date.parse(`${inicio}T12:00:00Z`);
    const b = Date.parse(`${fin}T12:00:00Z`);
    return Number.isFinite(a) && Number.isFinite(b) ? Math.max(0, Math.floor((b - a) / 86_400_000)) : null;
  }

  async function ejecutarCancelacionOrdenes() {
    const ids = ordenesSeleccionadas.filter((id) => ordenes.some((orden) => orden.id === id && ["abierta", "en_proceso", "terminada"].includes(orden.estado)));
    if (!ids.length) return;
    if (!confirm(`¿Cancelar ${ids.length} orden(es) seleccionada(s)?`)) return;
    start(async () => {
      try {
        for (const id of ids) await cancelarOrdenTaller(id);
        setOrdenesSeleccionadas([]);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible actualizar las órdenes.");
      }
    });
  }

  function accionDesdeEstado(row: RegistroBitacora): "terminar" | "cierre" | null {
    if (row.ordenId == null) return null;
    if (["ABIERTO", "EN PROCESO"].includes(row.status) && canFinishOrders) return "terminar";
    if (row.status === "PENDIENTE DE CIERRE" && canCloseOrders) return "cierre";
    return null;
  }

  function ejecutarAccionDesdeEstado(row: RegistroBitacora) {
    const accion = accionDesdeEstado(row);
    if (!accion || row.ordenId == null) return;
    const mensaje = accion === "terminar"
      ? "¿Marcar el trabajo como terminado y dejar la orden pendiente de cierre?"
      : "¿Cerrar esta orden de servicio?";
    if (!confirm(mensaje)) return;
    start(async () => {
      try {
        if (accion === "terminar") await terminarOrdenTaller(row.ordenId!);
        else await cerrarOrdenTaller(row.ordenId!);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No fue posible actualizar la orden.");
      }
    });
  }

  async function abrirDetalleBitacora(registro: RegistroBitacora) {
    setRegistroDetalleBitacora(registro);
    setOrdenDetalleBitacora(null);
    setTabDetalleBitacora("datos");
    setErrorDetalleBitacora("");
    setModalDetalleBitacora(true);
    if (registro.ordenId == null) return;
    setCargandoDetalleBitacora(true);
    try {
      setOrdenDetalleBitacora(await getOrdenTaller(registro.ordenId));
    } catch (err) {
      setErrorDetalleBitacora(err instanceof Error ? err.message : "No fue posible cargar la orden.");
    } finally {
      setCargandoDetalleBitacora(false);
    }
  }

  function abrirOrden(unidadId = "", preventivo: "km" | "hrs" | null = null) {
    setUnidadInicial(unidadId);
    setPreventivoInicial(preventivo);
    setModalOrden(true);
  }

  function onOrdenCreada(id: number, tipo: "orden" | "incidencia") {
    setModalOrden(false);
    if (tipo === "orden") router.push(`/taller/${id}?tab=ingreso`);
    else router.refresh();
  }

  function capturarIncidencia(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const pasarATaller = submitter instanceof HTMLButtonElement && submitter.value === "pasar-taller";
    setError("");
    start(async () => {
      let incidenciaCreada = false;
      try {
        const creada = await crearIncidenciaTaller({
          unidadId: Number(unidadIncidencia),
          operadorId: operadorIncidencia ? Number(operadorIncidencia) : null,
          fecha: fechaIncidencia,
          categoria: categoriaIncidencia,
          prioridad,
          fallas: fallasSeleccionadas,
          descripcion,
          ubicacion,
          observaciones,
        });
        incidenciaCreada = true;
        if (pasarATaller) {
          setModalIncidencia(false);
          const incidenciasDeFecha = await getIncidenciasTaller({ desde: fechaIncidencia, hasta: fechaIncidencia });
          const incidencia = incidenciasDeFecha.find((item) => item.id === creada.id);
          if (!incidencia) {
            router.refresh();
            setError("La incidencia se guardó, pero no se pudo abrir el formulario de recepción. Busca el registro en el tablero y usa Pasar a taller.");
            return;
          }
          recibirIncidencia(incidencia);
          return;
        }
        setDescripcion("");
        setUbicacion("");
        setObservaciones("");
        setFallasSeleccionadas([]);
        setModalIncidencia(false);
        router.refresh();
      } catch (err) {
        setError(incidenciaCreada
          ? "La incidencia se guardó, pero no se pudo abrir el formulario de recepción. Busca el registro en el tablero y usa Pasar a taller."
          : err instanceof Error ? err.message : "No se pudo registrar la incidencia.");
      }
    });
  }

  function abrirNuevaIncidencia(unidadId = "") {
    const unidad = unidades.find((u) => String(u.id) === unidadId);
    setError("");
    setUnidadIncidencia(unidadId);
    setFechaIncidencia(getNowLocal().fecha);
    setOperadorIncidencia(unidad?.operadorDefaultId ? String(unidad.operadorDefaultId) : "");
    setFallasSeleccionadas([]);
    setCategoriaIncidencia("otro");
    setDescripcion("");
    setUbicacion("");
    setObservaciones("");
    setPrioridad("media");
    setModalIncidencia(true);
  }

  function abrirCapturaUrea() {
    setError("");
    setUnidadUrea("");
    setOperadorUrea("");
    setFechaUrea(getNowLocal().fecha);
    setLitrosUrea("");
    setObservacionesUrea("");
    setModalUrea(true);
  }

  function guardarUrea(e: React.FormEvent) {
    e.preventDefault();
    const cantidad = Number(litrosUrea);
    if (!unidadUrea) {
      setError("Selecciona el equipo para registrar la carga.");
      return;
    }
    if (!fechaUrea || !/^\d{4}-\d{2}-\d{2}$/.test(fechaUrea)) {
      setError("Selecciona una fecha válida.");
      return;
    }
    if (!litrosUrea || !Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 10000) {
      setError("Captura una cantidad de litros mayor a 0 y hasta 10,000.");
      return;
    }
    setError("");
    start(async () => {
      try {
        await crearRegistroUreaTaller({
          unidadId: Number(unidadUrea),
          operadorId: operadorUrea ? Number(operadorUrea) : null,
          fecha: fechaUrea,
          litros: Number(litrosUrea),
          observaciones: observacionesUrea,
        });
        setModalUrea(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo registrar la carga de urea.");
      }
    });
  }

  function abrirCapturaLlanta() {
    setError("");
    setUnidadLlanta("");
    setOperadorLlanta("");
    setFechaLlanta(getNowLocal().fecha);
    setVidaLlanta("");
    setPosicionesLlanta([]);
    setObservacionesLlanta("");
    setModalLlanta(true);
  }

  function guardarLlanta(e: React.FormEvent) {
    e.preventDefault();
    const vida = Number(vidaLlanta);
    if (!vidaLlanta || !Number.isFinite(vida) || vida < 0 || vida > 100) {
      setError("Indica el porcentaje de vida de la llanta entre 0 y 100.");
      return;
    }
    setError("");
    start(async () => {
      try {
        await crearIncidenciaTaller({
          unidadId: Number(unidadLlanta),
          operadorId: operadorLlanta ? Number(operadorLlanta) : null,
          fecha: fechaLlanta,
          categoria: "llanta_danada",
          prioridad: vida <= 25 ? "alta" : "media",
          fallas: ["Llantas"],
          descripcion: `Llanta dañada${posicionesLlanta.length ? ` · posición${posicionesLlanta.length > 1 ? "es" : ""} ${posicionesLlanta.join(", ")}` : ""} · ${vida}% de vida`,
          observaciones: observacionesLlanta,
        });
        setModalLlanta(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo registrar la llanta dañada.");
      }
    });
  }

  function recibirIncidencia(incidencia: Incidencia) {
    const unidad = unidades.find((u) => u.id === incidencia.unidadId);
    const lectura = unidad ? (unidad.odometroActual ?? 0) + (unidad.odometroOffset ?? 0) : 0;
    setIncidenciaRecepcion(incidencia);
    setFechaRecepcion(getNowLocal().fecha);
    setLecturaRecepcion(lectura > 0 ? String(Math.round(lectura)) : "");
    setRecibioRecepcion("");
  }

  function confirmarRecepcion(e: React.FormEvent) {
    e.preventDefault();
    if (!incidenciaRecepcion) return;
    setError("");
    start(async () => {
      try {
        const result = await recibirIncidenciaTaller(incidenciaRecepcion.id, {
          fecha: fechaRecepcion,
          kmHrs: lecturaRecepcion ? Number(lecturaRecepcion) : null,
          quienRecibio: recibioRecepcion,
        });
        setIncidenciaRecepcion(null);
        router.push(`/taller/${result.id}?tab=ingreso`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo recibir la unidad.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <header className="sticky top-0 z-40 -mx-3 flex flex-col gap-3 border-b bg-[var(--surface)] px-3 pb-3 pt-2 md:-mx-5 md:flex-row md:items-center md:justify-between md:px-5" style={{ borderColor: "var(--border)" }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--fg-muted)" }}>Taller</p>
          <h1 className="font-outfit text-2xl font-bold leading-tight" style={{ color: "var(--fg)" }}>{seccion === "tablero" ? "Tablero" : seccion === "ordenes" ? "Órdenes de servicio" : "Bitácora general"}</h1>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{seccion === "bitacora" ? "Historial completo con filtros y descarga a Excel" : unidadesEnTaller > 0 ? `${unidadesEnTaller} unidad${unidadesEnTaller === 1 ? "" : "es"} en taller` : "Estado del taller en tiempo real"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <>
            <button type="button" onClick={abrirCapturaUrea} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-amber-950 disabled:opacity-40"><Fuel className="h-3.5 w-3.5" />UREA</button>
            <button type="button" onClick={abrirCapturaLlanta} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ borderColor: "var(--border)" }}>🛞 LLANTA DAÑADA</button>
            <button type="button" onClick={() => abrirOrden()} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--border)" }}><Wrench className="h-3.5 w-3.5" />NUEVO INGRESO</button>
            <button type="button" onClick={() => abrirNuevaIncidencia()} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Plus className="h-3.5 w-3.5" />INCIDENCIA</button>
          </>
        </div>
      </header>

      {seccion === "tablero" && <section className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {[
          ["CON INCIDENCIAS", conteos.incidencias],
          ["EN TALLER", conteos.taller],
          ["EN PROVEEDOR EXTERNO", conteos.proveedorExterno],
          ["PREVENTIVOS PRÓXIMOS", conteos.programadas],
        ].map(([label, count]) => (
          <div key={label} className="min-w-0 rounded-lg border border-l-[3px] p-2" style={{ borderColor: "var(--border)", borderLeftColor: label === "EN TALLER" ? "#167d86" : label === "CON INCIDENCIAS" ? "#ea7a13" : label === "EN PROVEEDOR EXTERNO" ? "#d64832" : "#4455bd", backgroundColor: "var(--surface)" }}>
            <p className="text-[10px] font-semibold leading-tight sm:text-[11px]" style={{ color: "var(--fg-muted)" }}>{label}</p>
            <p className="mt-0.5 text-xl font-bold leading-none sm:text-2xl">{count}</p>
          </div>
        ))}
      </section>}

      {!extensionReady && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        El tablero y las órdenes existentes están disponibles. Para habilitar incidencias, historial y folio común, aplica el esquema de Taller de pruebas, incluido <code>scripts/taller-folios-incidencias.sql</code>.
      </div>}
      {!ureaReady && (seccion === "tablero" || seccion === "bitacora") && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Para habilitar el control de urea aplica el esquema <code>scripts/taller-urea.sql</code> en la base de pruebas.</div>}

      {error && <p className="text-sm text-red-600 rounded-xl border border-red-200 bg-red-50 px-3 py-2">{error}</p>}

      {seccion === "tablero" && (
        <section className="space-y-3">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}><div><h2 className="text-sm font-bold">Control de piso de taller</h2><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Órdenes activas por etapa</p></div><Link href="/taller/ordenes" className="text-xs text-indigo-600 underline">Ver órdenes</Link></div>
            <div className="grid grid-cols-1 gap-3 overflow-x-auto p-3 lg:grid-cols-4">
              {([ ["abierta", "ABIERTA"], ["en_proceso", "EN REPARACIÓN"], ["terminada", "PENDIENTE DE CIERRE"], ["cerrada", "CERRADA"] ] as const).map(([estado, label]) => {
                const allRows = ordenes.filter((o) => o.estado === estado);
                const rows = allRows.slice(0, estado === "cerrada" ? 5 : undefined);
                return <div key={estado} className="min-w-0 rounded-xl p-3" style={{ backgroundColor: "var(--surface-2)" }}><div className="mb-2 flex justify-between text-xs font-bold uppercase"><span>{label}</span><span>{allRows.length}</span></div>
                  {rows.length ? rows.map((o) => <Link key={o.id} href={`/taller/${o.id}`} className="mb-2 block rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold">{formatoFolioTaller(o.folio)} · {o.unidad?.codigo ?? "—"}</span><Badge variant={estadoOrdenVariant(o.estado)}>{ESTADO_LABEL[o.estado as EstadoOrden] ?? o.estado}</Badge></div><p className="mt-1 line-clamp-2 text-xs">{o.motivo || "Sin motivo registrado"}</p><p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>{fechaMx(o.createdAt)}{o.operador?.nombre ? ` · ${o.operador.nombre}` : ""}</p></Link>) : <p className="py-4 text-center text-xs" style={{ color: "var(--fg-muted)" }}>Sin órdenes en esta etapa.</p>}
                </div>;
              })}
            </div>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}><div><h2 className="text-sm font-bold">Nuevas incidencias</h2><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Pendientes de recibir en taller</p></div>{canViewBitacora && <Link href="/taller/bitacora" className="text-xs text-indigo-600 underline">Ver bitácora</Link>}</div>
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left text-xs uppercase" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Equipo</th><th className="px-3 py-2">Falla</th><th className="px-3 py-2">Prioridad</th><th className="px-3 py-2">Acción</th></tr></thead><tbody>
              {incidencias.filter((i) => !i.orden && !CATEGORIAS_SIN_TALLER.includes(i.categoria as typeof CATEGORIAS_SIN_TALLER[number]) && !["resuelta", "cancelada"].includes(i.estado)).map((i) => <tr key={i.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="px-3 py-2">{formatFechaDmy(i.fecha)}</td><td className="px-3 py-2">{i.unidad?.codigo ?? "—"}</td><td className="px-3 py-2">{textoFallaReportada(i.fallas, i.descripcion)}<span className="ml-2 text-[10px]" style={{ color: "var(--fg-muted)" }}>{etiquetaCategoriaTaller(i.categoria)}</span></td><td className="px-3 py-2 capitalize">{i.prioridad}</td><td className="px-3 py-2"><button type="button" onClick={() => recibirIncidencia(i)} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white">Pasar a taller</button></td></tr>)}
              {!incidencias.some((i) => !i.orden && !CATEGORIAS_SIN_TALLER.includes(i.categoria as typeof CATEGORIAS_SIN_TALLER[number]) && !["resuelta", "cancelada"].includes(i.estado)) && <tr><td colSpan={5} className="py-6 text-center text-sm" style={{ color: "var(--fg-muted)" }}>No hay incidencias pendientes de recepción.</td></tr>}
            </tbody></table></div>
          </div>
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="border-b px-3 py-2.5 sm:px-4" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Flota completa</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]" style={{ color: "var(--fg-muted)" }}>
                  {([ ["taller", "En piso"], ["incidencia", "Reportada"], ["programada", "Próximo"] ] as const).map(([estado, label]) => <span key={estado} className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: estado === "taller" ? "#fff5dc" : estado === "incidencia" ? "#ffeadc" : "#f2eafa" }} />{label}</span>)}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {([ ["todas", "Todas"], ["camion", "Camiones"], ["maquina", "Maquinaria"], ["equipo_ligero", "Equipo ligero"] ] as const).map(([categoria, label]) => <button key={categoria} type="button" onClick={() => setFiltroCategoria(categoria)} aria-pressed={filtroCategoria === categoria} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${filtroCategoria === categoria ? "border-neutral-800 bg-neutral-800 text-white" : "bg-transparent"}`} style={filtroCategoria === categoria ? undefined : { borderColor: "var(--border)", color: "var(--fg-muted)" }}>{label} <span className="ml-0.5 opacity-70">{conteosCategoria[categoria]}</span></button>)}
                <Select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as "todas" | EstadoUnidad)} className="ml-auto h-8 w-auto min-w-[135px] rounded-full px-3 py-1 text-xs">
                  <option value="todas">Todos los estados</option>
                  <option value="disponible">Por ingresar</option>
                  <option value="taller">En piso</option>
                  <option value="incidencia">Reportadas</option>
                  <option value="programada">Próximos</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-1.5 p-3 sm:grid-cols-[repeat(auto-fill,minmax(128px,1fr))]">
              {unidadesEnVista.map((u) => {
                const estilosEstado = {
                  disponible: { backgroundColor: "var(--surface)", borderColor: "var(--border)", punto: "transparent" },
                  taller: { backgroundColor: "#fff5dc", borderColor: "#f4d28b", punto: "#e9aa00" },
                  incidencia: { backgroundColor: "#ffeadc", borderColor: "#ffc99e", punto: "#ce4935" },
                  programada: { backgroundColor: "#f2eafa", borderColor: "#dac5f3", punto: "#8750b4" },
                }[u.estado];
                return <button key={u.id} type="button" onClick={() => setEquipoSeleccionado(u)} className="relative min-w-0 rounded-lg border px-2.5 py-2 text-left transition-shadow hover:shadow-sm" style={{ backgroundColor: estilosEstado.backgroundColor, borderColor: estilosEstado.borderColor, color: "var(--fg)" }} title={u.estado === "disponible" ? u.codigo : `${u.codigo} · ${ETIQUETA_ESTADO[u.estado]}`}>
                  {u.estado !== "disponible" && <span className="absolute right-2 top-2 h-2 w-2 rounded-full" style={{ backgroundColor: estilosEstado.punto }} />}
                  <span className="block truncate pr-3 font-mono text-sm font-bold leading-tight">{u.codigo}</span>
                  {u.estado !== "disponible" && <span className="mt-1 block truncate text-[10px] leading-tight" style={{ color: "var(--fg-muted)" }}>{ETIQUETA_ESTADO[u.estado]}</span>}
                </button>;
              })}
              {unidadesEnVista.length === 0 && <p className="col-span-full py-8 text-center text-sm" style={{ color: "var(--fg-muted)" }}>No hay unidades para estos filtros.</p>}
            </div>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div><h2 className="text-sm font-bold">Mantenimientos programados</h2><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Alertas preventivas por km u horas</p></div>
              <span className="text-xs font-semibold">{programados.length}</span>
            </div>
            {programados.length === 0 ? <p className="text-sm text-center py-6 px-4" style={{ color: "var(--fg-muted)" }}>No hay mantenimientos próximos o vencidos.</p> : (
              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {programados.map((p) => <li key={`${p.unidadId}-${p.tipoControl}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div><p className="font-mono font-bold text-sm">{p.unidadCodigo}</p><p className="text-xs" style={{ color: "var(--fg-muted)" }}>{p.tipoControl.toUpperCase()} · faltan {Math.round(p.faltante).toLocaleString("es-MX")} {p.tipoControl === "hrs" ? "hrs" : "km"}</p></div>
                  <div className="flex items-center gap-2"><Badge variant={p.estado === "vencido" ? "danger" : "warning"}>{p.estado === "vencido" ? "Vencido" : "Próximo"}</Badge><button type="button" onClick={() => abrirOrden(String(p.unidadId), p.tipoControl)} className="px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 text-white">Atender</button></div>
                </li>)}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="mb-3 flex items-center justify-between gap-2"><div><h2 className="text-sm font-bold">⛽ Control de urea</h2><p className="text-xs capitalize" style={{ color: "var(--fg-muted)" }}>{etiquetaMesUrea}</p></div></div>
              <div className="mb-3 flex items-end gap-5"><div><p className="text-2xl font-bold">{ureaPorMes.litros.toLocaleString("es-MX", { maximumFractionDigits: 1 })} L</p><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Acumulado del mes · {ureaPorMes.rows.length} cargas</p></div></div>
              {ureaPorMes.porUnidad.length ? <div className="space-y-2">{ureaPorMes.porUnidad.map((row) => <div key={row.codigo} className="grid grid-cols-[minmax(56px,72px)_1fr_auto] items-center gap-2 text-xs"><span className="truncate rounded bg-neutral-800 px-2 py-1 font-mono font-bold text-white">{row.codigo}</span><div className="h-3 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(4, row.litros / Math.max(...ureaPorMes.porUnidad.map((item) => item.litros)) * 100)}%` }} /></div><span className="whitespace-nowrap font-semibold">{row.litros.toLocaleString("es-MX", { maximumFractionDigits: 1 })} L</span></div>)}</div> : <p className="py-4 text-center text-sm" style={{ color: "var(--fg-muted)" }}>Sin cargas de urea en este mes.</p>}
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="mb-3 flex items-center justify-between gap-2"><div><h2 className="text-sm font-bold">🛞 Llantas dañadas</h2><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Registros del botón Llanta dañada · mes activo</p></div><Badge variant="secondary">{llantasMes.length} este mes</Badge></div>
              {llantasMes.length ? <div className="space-y-2">{llantasMes.slice(0, 8).map((i) => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}><div><p className="text-sm font-semibold">{i.unidad?.codigo ?? "Unidad"} · {i.operador?.nombre ?? "Sin chofer"}</p><p className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatFechaDmy(i.fecha)} · {textoFallaReportada(i.fallas, i.descripcion)}</p></div><Badge variant={i.orden ? "warning" : i.estado === "resuelta" ? "success" : "default"}>{i.orden ? "En taller" : i.categoria === "llanta_danada" ? "Cerrada" : ESTADOS_INCIDENCIA[i.estado] ?? i.estado}</Badge></div>)}</div> : <p className="py-4 text-center text-sm" style={{ color: "var(--fg-muted)" }}>Sin llantas dañadas registradas este mes.</p>}
            </div>
          </div>
        </section>
      )}

      {seccion === "ordenes" && (
        <section className="space-y-3">
          <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => { setFiltroEstatusOrden("todas"); setDesdeOrdenes(""); setHastaOrdenes(""); setFiltroEquipoOrden("todos"); setFiltroCategoriaOrden("todas"); setFiltroLugarOrden("todos"); setBusquedaOrden(""); }} className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--border)" }}>Todos</button>
              <label className="min-w-[135px] flex-1 space-y-1 text-[10px] font-semibold sm:flex-none"><span>Desde</span><DateDmyInput value={desdeOrdenes} onChange={setDesdeOrdenes} className="h-9 text-xs" /></label>
              <label className="min-w-[135px] flex-1 space-y-1 text-[10px] font-semibold sm:flex-none"><span>Hasta</span><DateDmyInput value={hastaOrdenes} onChange={setHastaOrdenes} className="h-9 text-xs" /></label>
              <label className="min-w-[150px] flex-1 space-y-1 text-[10px] font-semibold sm:flex-none"><span>Estatus</span><Select value={filtroEstatusOrden} onChange={(e) => setFiltroEstatusOrden(e.target.value)} className="h-9 text-xs"><option value="activas">Activas</option><option value="todas">Todos</option><option value="abierta">Abierto</option><option value="en_proceso">En proceso</option><option value="terminada">Terminado · En proceso de cierre</option><option value="cerrada">Cerradas</option><option value="cancelada">Canceladas</option></Select></label>
              <label className="min-w-[150px] flex-1 space-y-1 text-[10px] font-semibold sm:flex-none"><span>Equipo</span><Select value={filtroEquipoOrden} onChange={(e) => setFiltroEquipoOrden(e.target.value)} className="h-9 text-xs"><option value="todos">Todos los equipos</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}</Select></label>
              <label className="min-w-[145px] flex-1 space-y-1 text-[10px] font-semibold sm:flex-none"><span>Categoría</span><Select value={filtroCategoriaOrden} onChange={(e) => setFiltroCategoriaOrden(e.target.value)} className="h-9 text-xs"><option value="todas">Todas</option>{TALLER_CATEGORIAS.filter((item) => !CATEGORIAS_SIN_TALLER.includes(item.value as typeof CATEGORIAS_SIN_TALLER[number])).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></label>
              <label className="min-w-[145px] flex-1 space-y-1 text-[10px] font-semibold sm:flex-none"><span>Lugar</span><Select value={filtroLugarOrden} onChange={(e) => setFiltroLugarOrden(e.target.value)} className="h-9 text-xs"><option value="todos">Todos</option><option value="piso">TALLER</option><option value="proveedor">Proveedor externo</option></Select></label>
              <label className="min-w-[220px] flex-[2] space-y-1 text-[10px] font-semibold"><span>Buscar por falla o trabajo realizado</span><span className="relative block"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--fg-muted)" }} /><Input value={busquedaOrden} onChange={(e) => setBusquedaOrden(e.target.value)} placeholder="Falla, reparación, proveedor…" className="h-9 pl-8 text-xs" /></span></label>
            </div>
            <p className="text-[11px]" style={{ color: "var(--fg-muted)" }}>{ordenesFiltradas.length} de {ordenes.length} órdenes</p>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {columnasOrdenes.map((columna) => <section key={columna.estado} className="min-w-0 rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
              <header className="mb-2 flex items-center justify-between gap-2"><h2 className="text-xs font-bold">{columna.titulo}</h2><span className="text-xs" style={{ color: "var(--fg-muted)" }}>{columna.ordenes.length}</span></header>
              <div className="space-y-2">{columna.ordenes.map(tarjetaOrden)}{!columna.ordenes.length && <p className="rounded-lg border border-dashed p-4 text-center text-xs" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>Sin órdenes</p>}</div>
            </section>)}
          </div>
          {ordenesNoActivasFiltradas.length > 0 && <section className="space-y-2 rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-xs font-bold">{filtroEstatusOrden === "cerrada" ? "CERRADAS" : filtroEstatusOrden === "cancelada" ? "CANCELADAS" : "CERRADAS Y CANCELADAS"}</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">{ordenesNoActivasFiltradas.map(tarjetaOrden)}</div>
          </section>}
          {ordenesFiltradas.length === 0 && <p className="rounded-2xl border p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>{ordenes.length ? "Ninguna orden coincide con estos filtros." : "No hay órdenes registradas."}</p>}
        </section>
      )}

      {seccion === "bitacora" && (
        <section className="space-y-3">
          <div className="rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <label className="space-y-1 text-xs font-semibold"><span>Desde</span><DateDmyInput value={desdeIncidencias} onChange={setDesdeIncidencias} /></label>
              <label className="space-y-1 text-xs font-semibold"><span>Hasta</span><DateDmyInput value={hastaIncidencias} onChange={setHastaIncidencias} /></label>
              <label className="space-y-1 text-xs font-semibold"><span>Unidad</span><Select value={filtroUnidadIncidencia} onChange={(e) => setFiltroUnidadIncidencia(e.target.value)}><option value="todas">Todas las unidades</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}</Select></label>
              <label className="space-y-1 text-xs font-semibold"><span>Tipo de unidad</span><Select value={filtroTipoUnidad} onChange={(e) => setFiltroTipoUnidad(e.target.value)}><option value="todas">Todos</option><option value="camion">Camión</option><option value="maquina">Maquinaria</option><option value="nissan">NISSAN</option><option value="otro">Otro</option></Select></label>
              <label className="space-y-1 text-xs font-semibold"><span>Categoría</span><Select value={filtroCategoriaBitacora} onChange={(e) => setFiltroCategoriaBitacora(e.target.value)}><option value="todas">Todas</option>{TALLER_CATEGORIAS.map((item) => <option key={item.value} value={item.label}>{item.label}</option>)}</Select></label>
              <label className="space-y-1 text-xs font-semibold"><span>Estado</span><Select value={filtroEstadoBitacora} onChange={(e) => setFiltroEstadoBitacora(e.target.value)}><option value="todas">Todos</option>{["ABIERTO", "EN PROCESO", "PENDIENTE DE CIERRE", "TERMINADO", "CERRADO", "CANCELADO"].map((status) => <option key={status} value={status}>{status}</option>)}</Select></label>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input className="min-w-[180px] flex-1 sm:max-w-[260px]" value={busquedaIncidencia} onChange={(e) => setBusquedaIncidencia(e.target.value)} placeholder="Buscar en la bitácora…" />
              <button type="button" aria-pressed={esteMesActivo} onClick={() => { setDesdeIncidencias(inicioMesActual); setHastaIncidencias(hoyLocal); }} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${esteMesActivo ? "border-indigo-600 bg-indigo-600 text-white" : ""}`} style={esteMesActivo ? undefined : { borderColor: "var(--border)" }}>Este mes</button>
              <button type="button" onClick={() => { setDesdeIncidencias(inicioMesActual); setHastaIncidencias(hoyLocal); setFiltroUnidadIncidencia("todas"); setFiltroTipoUnidad("todas"); setFiltroCategoriaBitacora("todas"); setFiltroEstadoBitacora("todas"); setBusquedaIncidencia(""); setIncluirLlantas(true); setIncluirUrea(true); }} className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--border)" }}>Limpiar filtros</button>
              <label className="flex items-center gap-2 px-1 text-xs"><input type="checkbox" checked={incluirUrea} onChange={(e) => setIncluirUrea(e.target.checked)} className="h-4 w-4 accent-indigo-600" />Incluir cargas de urea</label>
              <label className="flex items-center gap-2 px-1 text-xs"><input type="checkbox" checked={incluirLlantas} onChange={(e) => setIncluirLlantas(e.target.checked)} className="h-4 w-4 accent-indigo-600" />Incluir llanta dañada</label>
              {canCancelOrders && <button type="button" disabled={pending || !ordenesSeleccionadas.length} onClick={ejecutarCancelacionOrdenes} className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40">Cancelar</button>}
              <button type="button" disabled={exportandoBitacora || !registrosBitacoraFiltrados.length} aria-live="polite" onClick={() => { void exportarBitacora().catch((err) => setError(err instanceof Error ? err.message : "No se pudo generar el Excel.")); }} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#207783] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Download className="h-3.5 w-3.5" />{exportandoBitacora ? "Generando Excel…" : registrosSeleccionados.length ? `Descargar seleccionados (${registrosSeleccionados.length})` : `Bitácora general Excel (${registrosBitacoraFiltrados.length})`}</button>
            </div>
          </div>

          {cargandoIncidencias && <p className="text-xs" aria-live="polite" style={{ color: "var(--fg-muted)" }}>Actualizando resultados…</p>}

          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {[
              ["Folios en la vista", registrosBitacoraFiltrados.filter((r) => r.folio != null).length],
              ["Activos", registrosBitacoraFiltrados.filter((r) => ["ABIERTO", "EN PROCESO", "PENDIENTE DE CIERRE"].includes(r.status)).length],
              ["Pasaron a taller", registrosBitacoraFiltrados.filter((r) => r.ordenId != null).length],
              ["Refacciones (con IVA)", registrosBitacoraFiltrados.reduce((total, row) => total + row.costo, 0)],
            ].map(([label, value]) => <div key={label} className="rounded-lg border p-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}><p className="text-xl font-bold leading-none">{typeof value === "number" && label === "Refacciones (con IVA)" ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}</p><p className="mt-1 text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>{label}</p></div>)}
          </div>

          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <table className="w-full min-w-[1180px] text-sm">
              <thead><tr className="border-b text-left text-[10px] font-semibold uppercase tracking-wide" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
                {(["Ingreso / egreso · días", "Folio", "Unidad", "Falla", "Operador", "Atiende", "Lugar", "Resolución", "Costo", "Estado"] as const).map((label) => <th key={label} className="px-2.5 py-2.5">{label}</th>)}
                <th className="w-8 px-2 py-2.5"><input aria-label="Seleccionar registros para descargar" type="checkbox" checked={registrosBitacoraFiltrados.length > 0 && registrosBitacoraFiltrados.every((row) => registrosSeleccionados.includes(row.id))} onChange={(e) => { const ids = registrosBitacoraFiltrados.map((row) => row.id); setRegistrosSeleccionados((prev) => e.target.checked ? [...new Set([...prev, ...ids])] : prev.filter((id) => !ids.includes(id))); setOrdenesSeleccionadas((prev) => e.target.checked ? [...new Set([...prev, ...registrosBitacoraFiltrados.filter(puedeSeleccionarOrden).flatMap((row) => row.ordenId == null ? [] : [row.ordenId])])] : prev.filter((id) => !registrosBitacoraFiltrados.some((row) => row.ordenId === id))); }} className="h-4 w-4 accent-indigo-600" /></th>
              </tr></thead>
              <tbody>
                {registrosBitacoraFiltrados.map((row) => {
                  const badgeVariant = row.status === "TERMINADO" || row.status === "CERRADO" ? "success" : row.status === "EN PROCESO" || row.status === "PENDIENTE DE CIERRE" ? "warning" : row.status === "CANCELADO" ? "danger" : "default";
                  return <tr key={row.id} className="align-top border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-[10px]">Ingreso: {formatFechaDmy(row.fecha)}<br />Egreso: {row.fechaEgreso ? formatFechaDmy(row.fechaEgreso) : "—"}{row.diasAbierta != null && <p className="mt-0.5 font-semibold">{row.diasAbierta} días</p>}</td>
                    <td className="px-2.5 py-2.5 font-mono text-xs font-bold text-[#207783]"><button type="button" onClick={() => { void abrirDetalleBitacora(row); }} className="text-left hover:underline">{row.categoria === "Urea" ? "UREA" : row.categoria === "Llanta dañada" ? "LLANTA DAÑADA" : row.folio != null ? formatoFolioTaller(row.folio) : "Pendiente"}</button></td>
                    <td className="px-2.5 py-2.5"><button type="button" onClick={() => { void abrirDetalleBitacora(row); }} className="rounded-md bg-neutral-800 px-2 py-1 font-mono text-xs font-bold text-white hover:underline">{row.unidad}</button></td>
                    <td className="max-w-[240px] px-2.5 py-2.5 text-xs">{row.falla}<p className="mt-0.5 text-[10px]" style={{ color: "var(--fg-muted)" }}>{row.categoria}</p></td>
                    <td className="px-2.5 py-2.5 text-xs">{row.operador}</td>
                    <td className="px-2.5 py-2.5 text-xs">{row.atendio}</td>
                    <td className="max-w-[180px] px-2.5 py-2.5 text-xs">{row.lugar}</td>
                    <td className="max-w-[250px] px-2.5 py-2.5 text-xs">{row.resolucion}</td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-xs">{row.costo > 0 ? `$${row.costo.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}</td>
                    <td className="px-2.5 py-2.5">
                      {accionDesdeEstado(row) ? <button type="button" disabled={pending} onClick={() => ejecutarAccionDesdeEstado(row)} title={row.status === "PENDIENTE DE CIERRE" ? "Cerrar orden" : "Marcar como pendiente de cierre"} aria-label={`${row.status}: ${row.status === "PENDIENTE DE CIERRE" ? "cerrar orden" : "marcar pendiente de cierre"}`} className="rounded-full text-left transition hover:brightness-95 disabled:opacity-60"><Badge variant={badgeVariant}>{row.status}</Badge></button> : <Badge variant={badgeVariant}>{row.status}</Badge>}
                    </td>
                    <td className="px-2 py-2.5"><input aria-label={`Seleccionar registro ${row.folio ?? row.unidad}`} type="checkbox" checked={registrosSeleccionados.includes(row.id)} onChange={(e) => { setRegistrosSeleccionados((prev) => e.target.checked ? [...new Set([...prev, row.id])] : prev.filter((id) => id !== row.id)); if (row.ordenId != null && puedeSeleccionarOrden(row)) setOrdenesSeleccionadas((prev) => e.target.checked ? [...new Set([...prev, row.ordenId!])] : prev.filter((id) => id !== row.ordenId)); }} className="h-4 w-4 accent-indigo-600" /></td>
                  </tr>;
                })}
                {registrosBitacoraFiltrados.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-sm" style={{ color: "var(--fg-muted)" }}>No hay registros para estos filtros.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Dialog open={modalDetalleBitacora} onOpenChange={setModalDetalleBitacora}>
        <DialogContent className="flex h-[min(88vh,760px)] max-h-[88vh] max-w-4xl flex-col overflow-hidden">
          <DialogHeader><DialogTitle>{ordenDetalleBitacora?.folio ? `${formatoFolioTaller(ordenDetalleBitacora.folio)} · ${ordenDetalleBitacora.unidad?.codigo ?? registroDetalleBitacora?.unidad}` : `Bitácora · ${registroDetalleBitacora?.unidad ?? "Registro"}`}</DialogTitle></DialogHeader>
          {cargandoDetalleBitacora && <p className="py-8 text-center text-sm" style={{ color: "var(--fg-muted)" }}>Cargando expediente…</p>}
          {errorDetalleBitacora && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorDetalleBitacora}</p>}
          {registroDetalleBitacora && !ordenDetalleBitacora && !cargandoDetalleBitacora && <div className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2" style={{ borderColor: "var(--border)" }}>
            <p><b>Fecha:</b> {formatFechaDmy(registroDetalleBitacora.fecha)}</p><p><b>Estado:</b> {registroDetalleBitacora.status}</p>
            <p><b>Categoría:</b> {registroDetalleBitacora.categoria}</p><p><b>Unidad:</b> {registroDetalleBitacora.unidad}</p>
            <p><b>Falla:</b> {registroDetalleBitacora.falla}</p><p><b>Operador:</b> {registroDetalleBitacora.operador}</p>
            <p><b>Atiende:</b> {registroDetalleBitacora.atendio}</p><p><b>Lugar:</b> {registroDetalleBitacora.lugar}</p>
            <p className="sm:col-span-2"><b>Resolución / observaciones:</b> {registroDetalleBitacora.resolucion}</p>
            <p className="sm:col-span-2 text-xs" style={{ color: "var(--fg-muted)" }}>Este registro no tiene una orden de servicio vinculada.</p>
          </div>}
          {ordenDetalleBitacora && <>
            <div className="grid grid-cols-3 gap-1 rounded-xl border p-1" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
              {([["datos", "Datos"], ["checklist", "Checklist"], ["refacciones", "Refacciones"]] as const).map(([tab, label]) => <button key={tab} type="button" onClick={() => setTabDetalleBitacora(tab)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${tabDetalleBitacora === tab ? "bg-indigo-600 text-white" : ""}`}>{label}</button>)}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
            {tabDetalleBitacora === "datos" && <div className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2" style={{ borderColor: "var(--border)" }}>
              <p><b>Fecha:</b> {formatFechaDmy(ordenDetalleBitacora.fecha)}</p><p><b>Fecha de salida:</b> {formatFechaDmy(ordenDetalleBitacora.fechaSalida) || "—"}</p>
              <p><b>Estado:</b> <Badge variant={estadoOrdenVariant(ordenDetalleBitacora.estado)}>{ESTADO_LABEL[ordenDetalleBitacora.estado as EstadoOrden] ?? ordenDetalleBitacora.estado}</Badge></p><p><b>Equipo:</b> {ordenDetalleBitacora.unidad?.codigo ?? "—"}</p>
              <p><b>Categoría:</b> {etiquetaCategoriaTaller(ordenDetalleBitacora.categoria)}</p><p><b>Quién recibió:</b> {ordenDetalleBitacora.quienRecibio ?? "—"}</p>
              <p><b>Operador:</b> {ordenDetalleBitacora.operador?.nombre ?? "—"}</p><p><b>Atiende:</b> {ordenDetalleBitacora.quienAtendio ?? "—"}</p>
              <p><b>Lectura (KM / HRS):</b> {ordenDetalleBitacora.kmHrs ?? "—"}</p><p><b>Proveedor / ubicación:</b> {ordenDetalleBitacora.proveedorExterno ?? "TALLER"}</p>
              <p className="sm:col-span-2"><b>Motivo:</b> {ordenDetalleBitacora.motivo ?? "—"}</p>
              <p className="sm:col-span-2 whitespace-pre-wrap"><b>Trabajo realizado / comentarios:</b> {textoActividadesTaller(ordenDetalleBitacora.trabajoRealizado, ordenDetalleBitacora.quienAtendio ?? "") || ordenDetalleBitacora.comentarios || "—"}</p>
              <p className="sm:col-start-2"><b>Próximo mantenimiento:</b> {ordenDetalleBitacora.proximoMto ?? "—"}</p>
              {fotosChecklistJson(ordenDetalleBitacora.fotosSalida).length > 0 && <div className="sm:col-span-2"><b>Fotos del lugar / ubicación</b><div className="mt-2 flex flex-wrap gap-2">{fotosChecklistJson(ordenDetalleBitacora.fotosSalida).map((foto, index) => <a key={foto.key ?? `salida-${index}`} href={foto.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>{foto.tipo === "video" ? <video src={foto.url} controls className="h-20 w-28 object-cover" /> : <img src={foto.url} alt="Foto del lugar o ubicación" className="h-20 w-28 object-cover" />}</a>)}</div></div>}
            </div>}
            {tabDetalleBitacora === "checklist" && <div className="grid grid-cols-1 content-start gap-2 md:grid-cols-2">
              {[ordenDetalleBitacora.checklist.slice(0, 5), ordenDetalleBitacora.checklist.slice(5, 10)].map((columna, columnaIndex) => <div key={columnaIndex} className="space-y-2">
              {columna.map((item) => {
                const punto = CHECKLIST_PUNTOS.find((x) => x.clave === item.clave);
                const fotos = fotosChecklistJson(item.fotos);
                const respuesta = item.respuesta === "si" ? "SÍ" : item.respuesta === "no" ? "NO" : item.respuesta === "na" ? "N/A" : item.ok == null ? "SIN MARCAR" : item.ok ? "SÍ" : "NO";
                return <div key={item.id} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{punto?.label ?? item.clave}</p><Badge variant={respuesta === "NO" ? "danger" : respuesta === "SÍ" ? "success" : "secondary"}>{respuesta}</Badge></div>
                  {item.nota && <p className="mt-1 whitespace-pre-wrap text-sm">{item.nota}</p>}
                  {fotos.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{fotos.map((foto, index) => foto.tipo === "video"
                    ? <a key={foto.key ?? `${item.id}-${index}`} href={foto.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}><video src={foto.url} className="h-12 w-16 object-cover" /></a>
                    : <FotoLightbox key={foto.key ?? `${item.id}-${index}`} foto={{ url: foto.url, key: foto.key ?? `${item.id}-${index}`, alt: `Evidencia ${punto?.label ?? item.clave}` }} />)}</div>}
                </div>;
              })}
              </div>)}
              {fotosChecklistJson(ordenDetalleBitacora.fotosIngreso).length > 0 && <section className="rounded-xl border p-3 md:col-span-2" style={{ borderColor: "var(--border)" }}><p className="text-sm font-semibold">Fotos y videos de ingreso</p><div className="mt-2 flex flex-wrap gap-2">{fotosChecklistJson(ordenDetalleBitacora.fotosIngreso).map((foto, index) => foto.tipo === "video"
                ? <a key={foto.key ?? `ingreso-${index}`} href={foto.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}><video src={foto.url} className="h-12 w-16 object-cover" /></a>
                : <FotoLightbox key={foto.key ?? `ingreso-${index}`} foto={{ url: foto.url, key: foto.key ?? `ingreso-${index}`, alt: "Evidencia de ingreso" }} />)}</div></section>}
            </div>}
            {tabDetalleBitacora === "refacciones" && <div className="space-y-2">
              {ordenDetalleBitacora.refacciones.map((ref, index) => <div key={ref.id ?? index} className="grid gap-2 rounded-xl border p-3 text-sm sm:grid-cols-[2fr_0.7fr_1fr_1fr]" style={{ borderColor: "var(--border)" }}>
                <p className="font-semibold">{ref.descripcion}</p><p>{ref.cantidad ?? 1} {ref.unidadMedida}</p><p>{ref.proveedor || "Sin proveedor"}</p><p>{ref.folioFactura ? `Factura ${ref.folioFactura}` : "Sin factura"}</p>
                <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Unitario: {Number(ref.precio ?? 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" })} · IVA {ref.iva ? "incluido" : "no incluido"}</p>
              </div>)}
              {ordenDetalleBitacora.refacciones.length === 0 && <p className="rounded-xl border p-4 text-sm" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>Sin refacciones registradas.</p>}
            </div>}
            </div>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={modalIncidencia} onOpenChange={setModalIncidencia}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Nueva incidencia</DialogTitle></DialogHeader>
          <form onSubmit={capturarIncidencia} className="space-y-3">
            <div><Label>Equipo</Label><Select value={unidadIncidencia} onChange={(e) => { const id = e.target.value; setUnidadIncidencia(id); const unidad = unidades.find((u) => String(u.id) === id); setOperadorIncidencia(unidad?.operadorDefaultId ? String(unidad.operadorDefaultId) : ""); }} required><option value="">Elegir equipo…</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}</Select></div>
            <div><Label>Fecha</Label><DateDmyInput value={fechaIncidencia} onChange={setFechaIncidencia} required /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Categoría</Label><Select value={categoriaIncidencia} onChange={(e) => setCategoriaIncidencia(e.target.value as CategoriaTaller)}>{TALLER_CATEGORIAS.filter((item) => !CATEGORIAS_SIN_TALLER.includes(item.value as typeof CATEGORIAS_SIN_TALLER[number])).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select></div>
              <div><Label>Prioridad</Label><Select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></Select></div>
            </div>
            <div><Label>Chofer (opcional)</Label><Select value={operadorIncidencia} onChange={(e) => setOperadorIncidencia(e.target.value)}><option value="">Sin asignar</option>{operadores.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</Select></div>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">Fallas observadas · selección múltiple</legend><div className="grid grid-cols-2 gap-2 rounded-xl border p-3 sm:grid-cols-3" style={{ borderColor: "var(--border)" }}>{TALLER_FALLAS.map((falla) => <label key={falla} className="flex items-start gap-2 text-xs"><input type="checkbox" checked={fallasSeleccionadas.includes(falla)} onChange={(e) => setFallasSeleccionadas((actuales) => e.target.checked ? [...actuales, falla] : actuales.filter((x) => x !== falla))} />{falla}</label>)}</div></fieldset>
            <div><Label>Descripción o detalle adicional (opcional)</Label><textarea autoFocus={fallasSeleccionadas.length > 0} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={2000} rows={3} placeholder="Describe brevemente qué se observó" className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} /></div>
            <div><Label>Ubicación (opcional)</Label><Input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} maxLength={200} placeholder="Lugar donde se detectó" /></div>
            <div><Label>Observaciones (opcional)</Label><textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} maxLength={2000} rows={2} placeholder="Notas adicionales" className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="submit" value="guardar" disabled={pending} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Guardando…" : "Guardar"}</button>
              <button type="submit" value="pasar-taller" disabled={pending} className="w-full rounded-xl bg-[#207783] py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Procesando…" : "Pasar a Taller"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modalUrea} onOpenChange={setModalUrea}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar carga de urea</DialogTitle></DialogHeader>
          <form noValidate onSubmit={guardarUrea} className="space-y-3">
            <div><Label>Unidad</Label><Select value={unidadUrea} onChange={(e) => { const id = e.target.value; setUnidadUrea(id); const unidad = unidades.find((u) => String(u.id) === id); setOperadorUrea(unidad?.operadorDefaultId ? String(unidad.operadorDefaultId) : ""); }} required><option value="">Elegir unidad…</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}</Select></div>
            <div><Label>Fecha</Label><DateDmyInput value={fechaUrea} onChange={setFechaUrea} required /></div>
            <div><Label>Operador (opcional)</Label><Select value={operadorUrea} onChange={(e) => setOperadorUrea(e.target.value)}><option value="">Sin asignar</option>{operadores.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</Select></div>
            <div><Label>Cantidad (litros)</Label><div className="mb-2 mt-2 flex flex-wrap gap-2">{[5, 10, 20, 40].map((cantidad) => <button key={cantidad} type="button" onClick={() => setLitrosUrea(String(cantidad))} className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${Number(litrosUrea) === cantidad ? "border-amber-500 bg-amber-300 text-amber-950" : ""}`} style={Number(litrosUrea) !== cantidad ? { borderColor: "var(--border)" } : undefined}>{cantidad} L</button>)}</div><Input type="number" inputMode="decimal" min="0.1" max="10000" step="0.1" value={litrosUrea} onChange={(e) => setLitrosUrea(e.target.value)} placeholder="Cantidad exacta" required /></div>
            <div><Label>Observaciones</Label><textarea value={observacionesUrea} onChange={(e) => setObservacionesUrea(e.target.value)} maxLength={2000} rows={3} placeholder="Observaciones de la carga" className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} /></div>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {!ureaReady && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">No se puede guardar: falta habilitar la tabla de Urea en esta base de pruebas.</p>}
            <button type="submit" disabled={pending || !ureaReady} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Guardando…" : "Guardar carga"}</button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modalLlanta} onOpenChange={setModalLlanta}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar llanta dañada</DialogTitle></DialogHeader>
          <form onSubmit={guardarLlanta} className="space-y-3">
            <div className="grid grid-cols-2 gap-3"><div><Label>Unidad</Label><Select value={unidadLlanta} onChange={(e) => { const id = e.target.value; setUnidadLlanta(id); const unidad = unidades.find((u) => String(u.id) === id); setOperadorLlanta(unidad?.operadorDefaultId ? String(unidad.operadorDefaultId) : ""); }} required><option value="">Elegir unidad…</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}</Select></div><div><Label>Fecha</Label><DateDmyInput value={fechaLlanta} onChange={setFechaLlanta} required /></div></div>
            <div><Label>Chofer (opcional)</Label><Select value={operadorLlanta} onChange={(e) => setOperadorLlanta(e.target.value)}><option value="">Sin asignar</option>{operadores.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</Select></div>
            <div><Label>Vida restante (%)</Label><Input type="number" inputMode="decimal" min="0" max="100" step="1" value={vidaLlanta} onChange={(e) => setVidaLlanta(e.target.value)} required /></div>
            <fieldset><legend className="mb-2 text-xs font-semibold">Posición · selección múltiple</legend><div className="flex flex-wrap gap-2">{[...Array(10)].map((_, i) => String(i + 1)).concat("Refacción").map((posicion) => <button key={posicion} type="button" aria-pressed={posicionesLlanta.includes(posicion)} onClick={() => setPosicionesLlanta((actuales) => actuales.includes(posicion) ? actuales.filter((item) => item !== posicion) : [...actuales, posicion])} className={`min-w-10 rounded-lg border px-3 py-1.5 text-xs font-semibold ${posicionesLlanta.includes(posicion) ? "border-[#207783] bg-[#207783] text-white" : ""}`} style={!posicionesLlanta.includes(posicion) ? { borderColor: "var(--border)" } : undefined}>{posicion}</button>)}</div></fieldset>
            <div><Label>Notas (opcional)</Label><textarea value={observacionesLlanta} onChange={(e) => setObservacionesLlanta(e.target.value)} maxLength={2000} rows={2} placeholder="Ponchadura, costado dañado…" className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={pending || !extensionReady} className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Guardando…" : "Guardar llanta dañada"}</button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(equipoSeleccionado)} onOpenChange={(open) => { if (!open) setEquipoSeleccionado(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{equipoSeleccionado?.codigo}</DialogTitle></DialogHeader>
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{equipoSeleccionado && unidadesEnVista.find((u) => u.id === equipoSeleccionado.id)?.estado !== "disponible" ? ETIQUETA_ESTADO[unidadesEnVista.find((u) => u.id === equipoSeleccionado.id)?.estado ?? "disponible"] : ""}</p>
          <div className="grid gap-2">
            <button type="button" onClick={() => { if (!equipoSeleccionado) return; const unidadId = String(equipoSeleccionado.id); setEquipoSeleccionado(null); abrirOrden(unidadId); }} className="w-full rounded-lg bg-[#207783] px-4 py-2.5 text-sm font-semibold text-white">Ingresar</button>
            {canViewExpediente && equipoSeleccionado && <button type="button" onClick={() => router.push(`/catalogo/unidades/${equipoSeleccionado.id}?tab=bitacora`)} className="w-full rounded-lg border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--border)" }}>Ver Expediente</button>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalOrden} onOpenChange={setModalOrden}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Recibir equipo</DialogTitle></DialogHeader>
          <p className="text-sm -mt-2 mb-2" style={{ color: "var(--fg-muted)" }}>Registra la llegada; después abriré el checklist de ingreso y la orden de servicio.</p>
          {modalOrden && <OrdenNuevaForm unidades={unidades} operadores={operadores} initialUnidadId={unidadInicial} initialPreventivo={preventivoInicial} onCreated={onOrdenCreada} onCancel={() => setModalOrden(false)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(incidenciaRecepcion)} onOpenChange={(open) => { if (!open) setIncidenciaRecepcion(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Recepción de unidad</DialogTitle></DialogHeader>
          {incidenciaRecepcion && <form onSubmit={confirmarRecepcion} className="space-y-3">
            <div className="rounded-xl border bg-indigo-50/70 border-indigo-200 px-3 py-2"><p className="text-xs font-semibold text-indigo-700">{incidenciaRecepcion.unidad?.codigo} · Falla reportada</p><p className="text-sm mt-1">{incidenciaRecepcion.descripcion}</p></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Fecha de recepción</Label><DateDmyInput value={fechaRecepcion} onChange={setFechaRecepcion} required /></div><div><Label>Lectura</Label><Input type="number" inputMode="decimal" value={lecturaRecepcion} onChange={(e) => setLecturaRecepcion(e.target.value)} /></div></div>
            <div><Label>Quién recibe</Label><Input value={recibioRecepcion} onChange={(e) => setRecibioRecepcion(e.target.value)} placeholder="Nombre" /></div>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Al continuar se abrirá la orden y el checklist de ingreso.</p>
            <button type="submit" disabled={pending} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white disabled:opacity-50">{pending ? "Recibiendo…" : "Crear orden y abrir checklist"}</button>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
