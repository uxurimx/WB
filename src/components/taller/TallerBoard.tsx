"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, Fuel, Plus, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import OrdenNuevaForm from "@/components/taller/OrdenNuevaForm";
import { ESTADO_LABEL, type EstadoOrden } from "@/lib/taller-checklist";
import { formatFechaHoraMx, getNowLocal } from "@/lib/date-utils";
import {
  crearIncidenciaTaller,
  crearRegistroUreaTaller,
  getIncidenciasTaller,
  recibirIncidenciaTaller,
} from "@/app/actions/taller";
import type { AlertaMantenimiento } from "@/app/actions/mantenimiento";
import type { getBitacoraGeneralTaller, getUreaTaller } from "@/app/actions/taller";
import { CATEGORIAS_SIN_TALLER, etiquetaCategoriaTaller, formatoFolioTaller, TALLER_CATEGORIAS, TALLER_FALLAS, type CategoriaTaller } from "@/lib/taller-incidencias";

type Incidencia = Awaited<ReturnType<typeof getIncidenciasTaller>>[number];
type Evento = Awaited<ReturnType<typeof getBitacoraGeneralTaller>>[number];
type UreaRegistro = Awaited<ReturnType<typeof getUreaTaller>>[number];
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
  diagnosticoFinal?: string | null;
  trabajoRealizado?: string | null;
  observacionesSalida?: string | null;
  refacciones: { descripcion?: string; proveedor?: string | null; precio: number | null; cantidad: number | null; iva: boolean }[];
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
  const [unidadIncidencia, setUnidadIncidencia] = useState("");
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
  const [desdeIncidencias, setDesdeIncidencias] = useState("");
  const [hastaIncidencias, setHastaIncidencias] = useState("");
  const [filtroUnidadIncidencia, setFiltroUnidadIncidencia] = useState("todas");
  const [soloConObservaciones, setSoloConObservaciones] = useState(false);
  const [busquedaIncidencia, setBusquedaIncidencia] = useState("");
  const [filtroTipoUnidad, setFiltroTipoUnidad] = useState("todas");
  const [filtroCategoriaBitacora, setFiltroCategoriaBitacora] = useState("todas");
  const [filtroEstadoBitacora, setFiltroEstadoBitacora] = useState("todas");
  const [incluirUrea, setIncluirUrea] = useState(true);
  const [cargandoIncidencias, setCargandoIncidencias] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => setIncidenciasVista(incidencias), [incidencias]);

  useEffect(() => {
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
    const ordenesActivas = new Set(ordenes.filter((o) => o.estado === "abierta" || o.estado === "en_proceso").map((o) => o.unidad?.id).filter((id): id is number => Boolean(id)));
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

  const conteos = useMemo(() => {
    const rows = unidades.map((u) => {
      const conOrden = ordenes.some((o) => o.unidad?.id === u.id && (o.estado === "abierta" || o.estado === "en_proceso"));
      const conIncidencia = incidenciasActivas.some((i) => i.unidadId === u.id);
      const programada = programados.some((p) => p.unidadId === u.id);
      return conOrden ? "taller" : conIncidencia ? "incidencia" : programada ? "programada" : "disponible";
    });
    return {
      unidades: unidades.length,
      taller: rows.filter((s) => s === "taller").length,
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
      const status = orden?.estado === "cerrada" ? "Terminada"
        : orden?.estado === "cancelada" ? "Cancelada"
          : proveedor ? "Proveedor externo"
            : orden?.estado === "abierta" ? "En piso"
              : orden ? "En reparación"
        : CATEGORIAS_SIN_TALLER.includes(incidencia.categoria as typeof CATEGORIAS_SIN_TALLER[number]) ? "Cerrada"
          : incidencia.estado === "resuelta" ? "Terminada"
                : incidencia.estado === "cancelada" ? "Cancelada"
                  : incidencia.estado === "en_revision" ? "Reportada" : "Por ingresar";
      const historial = eventos.filter((evento) => evento.incidenciaId === incidencia.id || (orden && evento.ordenId === orden.id)).map((evento) => ({
        tipo: evento.tipo,
        detalle: evento.detalle,
        createdAt: evento.createdAt,
        usuarioNombre: evento.usuarioNombre,
      }));
      return {
        id: `incidencia-${incidencia.id}`,
        fecha: incidencia.fecha,
        folio: orden?.folio ?? incidencia.folio,
        unidadId: incidencia.unidadId,
        unidad: incidencia.unidad?.codigo ?? "—",
        tipoUnidad: incidencia.unidad?.tipo ?? "otro",
        categoria: etiquetaCategoriaTaller(orden?.categoria ?? incidencia.categoria),
        falla: textoFallaReportada(incidencia.fallas, incidencia.descripcion),
        operador: incidencia.operador?.nombre ?? "—",
        atendio: orden?.quienAtendio ?? incidencia.atendio ?? "—",
        lugar: proveedor ? `Proveedor externo · ${proveedor}` : orden ? "Piso de taller" : incidencia.ubicacion ?? "—",
        resolucion: orden?.trabajoRealizado || orden?.diagnosticoFinal || orden?.observacionesSalida || incidencia.resolucion || incidencia.observaciones || orden?.comentarios || "—",
        costo,
        status,
        ordenId: orden?.id ?? incidencia.orden?.id ?? null,
        observaciones: incidencia.observaciones ?? "",
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
        folio: orden.folio,
        unidadId: orden.unidad?.id ?? orden.unidadId,
        unidad: orden.unidad?.codigo ?? "—",
        tipoUnidad: orden.unidad?.tipo ?? "otro",
        categoria: etiquetaCategoriaTaller(orden.categoria),
        falla: orden.motivo ?? "Servicio de taller",
        operador: orden.operador?.nombre ?? "—",
        atendio: orden.quienAtendio ?? "—",
        lugar: proveedor ? `Proveedor externo · ${proveedor}` : "Piso de taller",
        resolucion: orden.trabajoRealizado || orden.diagnosticoFinal || orden.observacionesSalida || orden.comentarios || "—",
        costo,
        status: orden.estado === "cerrada" ? "Terminada" : orden.estado === "cancelada" ? "Cancelada" : proveedor ? "Proveedor externo" : orden.estado === "abierta" ? "En piso" : "En reparación",
        ordenId: orden.id,
        observaciones: "",
        historial: eventos.filter((evento) => evento.ordenId === orden.id).map((evento) => ({ tipo: evento.tipo, detalle: evento.detalle, createdAt: evento.createdAt, usuarioNombre: evento.usuarioNombre })),
      });
    }
    if (incluirUrea) {
      registros.push(...urea.map((registro) => ({
        id: `urea-${registro.id}`,
        fecha: registro.fecha,
        folio: null,
        unidadId: registro.unidadId,
        unidad: registro.unidadCodigo,
        tipoUnidad: unidades.find((item) => item.id === registro.unidadId)?.tipo ?? "otro",
        categoria: "Urea",
        falla: `${Number(registro.litros).toLocaleString("es-MX")} L de urea`,
        operador: registro.operadorNombre ?? "—",
        atendio: "—",
        lugar: "Carga de urea",
        resolucion: registro.observaciones ?? "—",
        costo: 0,
        status: "Cerrada",
        ordenId: null,
        observaciones: registro.observaciones ?? "",
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
        && (!soloConObservaciones || Boolean(registro.observaciones.trim()))
        && (!query || texto.includes(query));
    });
  }, [registrosBitacora, desdeIncidencias, hastaIncidencias, filtroUnidadIncidencia, filtroTipoUnidad, filtroCategoriaBitacora, filtroEstadoBitacora, soloConObservaciones, busquedaIncidencia]);

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
  const litrosUreaMesActual = ureaPorMes.litros;
  const etiquetaMesUrea = new Date(`${mesVigente}-15T12:00:00`).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const llantasMes = useMemo(() => incidencias.filter((i) => i.fecha.startsWith(mesVigente) && (i.categoria === "llanta_danada" || leerFallas(i.fallas, i.descripcion).includes("Llantas"))), [incidencias, mesVigente]);

  async function exportarBitacora() {
    const XLSX = await import("xlsx");
    const data = registrosBitacoraFiltrados.map((row) => ({
      Fecha: row.fecha,
      Folio: row.folio != null ? formatoFolioTaller(row.folio) : "",
      Categoría: row.categoria,
      Unidad: row.unidad,
      Tipo: row.tipoUnidad,
      Falla: row.falla,
      Operador: row.operador,
      Atiende: row.atendio,
      Lugar: row.lugar,
      Resolución: row.resolucion,
      Costo: row.costo,
      Status: row.status,
    }));
    const sheet = XLSX.utils.json_to_sheet(data);
    sheet["!cols"] = [{ wch: 13 }, { wch: 13 }, { wch: 14 }, { wch: 16 }, { wch: 38 }, { wch: 24 }, { wch: 24 }, { wch: 28 }, { wch: 45 }, { wch: 14 }, { wch: 20 }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Bitácora general");
    XLSX.writeFile(book, `bitacora-taller-${getNowLocal().fecha}.xlsx`);
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

  function capturarIncidencia(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      try {
        await crearIncidenciaTaller({
          unidadId: Number(unidadIncidencia),
          operadorId: operadorIncidencia ? Number(operadorIncidencia) : null,
          fecha: getNowLocal().fecha,
          categoria: categoriaIncidencia,
          prioridad,
          fallas: fallasSeleccionadas,
          descripcion,
          ubicacion,
          observaciones,
        });
        setDescripcion("");
        setUbicacion("");
        setObservaciones("");
        setFallasSeleccionadas([]);
        setModalIncidencia(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo registrar la incidencia.");
      }
    });
  }

  function abrirNuevaIncidencia(unidadId = "") {
    const unidad = unidades.find((u) => String(u.id) === unidadId);
    setError("");
    setUnidadIncidencia(unidadId);
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
            <div className="flex flex-col items-center">
              <button type="button" onClick={abrirCapturaUrea} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-xs font-semibold text-amber-950 disabled:opacity-40"><Fuel className="h-3.5 w-3.5" />UREA</button>
              <span className="mt-0.5 rounded-md bg-amber-100 px-2 py-1 text-[10px] font-semibold leading-none text-amber-900">{etiquetaMesUrea}: {new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(litrosUreaMesActual)} L</span>
            </div>
            <button type="button" onClick={abrirCapturaLlanta} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40" style={{ borderColor: "var(--border)" }}>🛞 LLANTA DAÑADA</button>
            <button type="button" onClick={() => abrirOrden()} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--border)" }}><Wrench className="h-3.5 w-3.5" />NUEVO INGRESO</button>
            <button type="button" onClick={() => abrirNuevaIncidencia()} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Plus className="h-3.5 w-3.5" />INCIDENCIA</button>
          </>
        </div>
      </header>

      {seccion === "tablero" && <section className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 xl:grid-cols-7">
        {[
          ["Flota completa", conteos.unidades],
          ["Disponibles", conteos.disponibles],
          ["Con incidencias", conteos.incidencias],
          ["En taller", conteos.taller],
          ["Preventivos próximos", conteos.programadas],
          ["Órdenes activas", ordenes.filter((o) => o.estado === "abierta" || o.estado === "en_proceso").length],
          ["Incidencias pendientes", incidencias.filter((i) => !i.orden && !["resuelta", "cancelada"].includes(i.estado)).length],
        ].map(([label, count]) => (
          <div key={label} className="min-w-0 rounded-lg border border-l-[3px] p-2" style={{ borderColor: "var(--border)", borderLeftColor: label === "En taller" ? "#167d86" : label === "Con incidencias" ? "#ea7a13" : label === "Incidencias pendientes" ? "#d64832" : "#4455bd", backgroundColor: "var(--surface)" }}>
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
            <div className="grid grid-cols-1 gap-3 overflow-x-auto p-3 lg:grid-cols-3">
              {([ ["abierta", "ABIERTA"], ["en_proceso", "EN REPARACIÓN"], ["cerrada", "TERMINADA"] ] as const).map(([estado, label]) => {
                const allRows = ordenes.filter((o) => o.estado === estado);
                const rows = allRows.slice(0, estado === "cerrada" ? 5 : undefined);
                return <div key={estado} className="min-w-0 rounded-xl p-3" style={{ backgroundColor: "var(--surface-2)" }}><div className="mb-2 flex justify-between text-xs font-bold uppercase"><span>{label}</span><span>{allRows.length}</span></div>
                  {rows.length ? rows.map((o) => <Link key={o.id} href={`/taller/${o.id}`} className="mb-2 block rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold">{formatoFolioTaller(o.folio)} · {o.unidad?.codigo ?? "—"}</span><Badge variant={estadoOrdenVariant(o.estado)}>{ESTADO_LABEL[o.estado as EstadoOrden] ?? o.estado}</Badge></div><p className="mt-1 line-clamp-2 text-xs">{o.motivo || "Sin motivo registrado"}</p><p className="mt-1 text-xs" style={{ color: "var(--fg-muted)" }}>{fechaMx(o.createdAt)}{o.operador?.nombre ? ` · ${o.operador.nombre}` : ""}</p></Link>) : <p className="py-4 text-center text-xs" style={{ color: "var(--fg-muted)" }}>Sin órdenes en esta etapa.</p>}
                </div>;
              })}
            </div>
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}><div><h2 className="text-sm font-bold">Nuevas incidencias</h2><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Pendientes de recibir en taller</p></div><Link href="/taller/bitacora" className="text-xs text-indigo-600 underline">Ver bitácora</Link></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead><tr className="border-b text-left text-xs uppercase" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Equipo</th><th className="px-3 py-2">Falla</th><th className="px-3 py-2">Prioridad</th><th className="px-3 py-2">Acción</th></tr></thead><tbody>
              {incidencias.filter((i) => !i.orden && !CATEGORIAS_SIN_TALLER.includes(i.categoria as typeof CATEGORIAS_SIN_TALLER[number]) && !["resuelta", "cancelada"].includes(i.estado)).map((i) => <tr key={i.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}><td className="px-3 py-2">{i.fecha}</td><td className="px-3 py-2">{i.unidad?.codigo ?? "—"}</td><td className="px-3 py-2">{textoFallaReportada(i.fallas, i.descripcion)}<span className="ml-2 text-[10px]" style={{ color: "var(--fg-muted)" }}>{etiquetaCategoriaTaller(i.categoria)}</span></td><td className="px-3 py-2 capitalize">{i.prioridad}</td><td className="px-3 py-2"><button type="button" onClick={() => recibirIncidencia(i)} className="rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white">Pasar a taller</button></td></tr>)}
              {!incidencias.some((i) => !i.orden && !CATEGORIAS_SIN_TALLER.includes(i.categoria as typeof CATEGORIAS_SIN_TALLER[number]) && !["resuelta", "cancelada"].includes(i.estado)) && <tr><td colSpan={5} className="py-6 text-center text-sm" style={{ color: "var(--fg-muted)" }}>No hay incidencias pendientes de recepción.</td></tr>}
            </tbody></table></div>
          </div>
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="border-b px-3 py-2.5 sm:px-4" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold">Flota completa</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]" style={{ color: "var(--fg-muted)" }}>
                  {([ ["disponible", "Por ingresar"], ["taller", "En piso"], ["incidencia", "Reportada"], ["programada", "Próximo"] ] as const).map(([estado, label]) => <span key={estado} className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: estado === "disponible" ? "#e7edf7" : estado === "taller" ? "#fff2cf" : estado === "incidencia" ? "#ffe5cf" : "#d6a400" }} />{label}</span>)}
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
                  disponible: { backgroundColor: "#f6f7f9", borderColor: "#dce1e8", punto: "#d6a400" },
                  taller: { backgroundColor: "#fff5dc", borderColor: "#f4d28b", punto: "#e9aa00" },
                  incidencia: { backgroundColor: "#ffeadc", borderColor: "#ffc99e", punto: "#ce4935" },
                  programada: { backgroundColor: "#f2eafa", borderColor: "#dac5f3", punto: "#8750b4" },
                }[u.estado];
                return <button key={u.id} type="button" onClick={() => setEquipoSeleccionado(u)} className="relative min-w-0 rounded-lg border px-2.5 py-2 text-left transition-shadow hover:shadow-sm" style={{ backgroundColor: estilosEstado.backgroundColor, borderColor: estilosEstado.borderColor, color: "var(--fg)" }} title={`${u.codigo} · ${ETIQUETA_ESTADO[u.estado]}`}>
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full" style={{ backgroundColor: estilosEstado.punto }} />
                  <span className="block truncate pr-3 font-mono text-sm font-bold leading-tight">{u.codigo}</span>
                  <span className="mt-1 block truncate text-[10px] leading-tight" style={{ color: "var(--fg-muted)" }}>{ETIQUETA_ESTADO[u.estado]}</span>
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
              <div className="mb-3 flex items-center justify-between gap-2"><div><h2 className="text-sm font-bold">🛞 Llantas dañadas</h2><p className="text-xs" style={{ color: "var(--fg-muted)" }}>Incidencias de llantas del mes activo</p></div><Badge variant="secondary">{llantasMes.length} este mes</Badge></div>
              {llantasMes.length ? <div className="space-y-2">{llantasMes.slice(0, 8).map((i) => <div key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}><div><p className="text-sm font-semibold">{i.unidad?.codigo ?? "Unidad"} · {i.operador?.nombre ?? "Sin chofer"}</p><p className="text-xs" style={{ color: "var(--fg-muted)" }}>{i.fecha} · {textoFallaReportada(i.fallas, i.descripcion)}</p></div><Badge variant={i.orden ? "warning" : i.estado === "resuelta" ? "success" : "default"}>{i.orden ? "En taller" : i.categoria === "llanta_danada" ? "Cerrada" : ESTADOS_INCIDENCIA[i.estado] ?? i.estado}</Badge></div>)}</div> : <p className="py-4 text-center text-sm" style={{ color: "var(--fg-muted)" }}>Sin llantas dañadas registradas este mes.</p>}
            </div>
          </div>
        </section>
      )}

      {seccion === "ordenes" && (
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {ordenes.map((o) => (
            <Link key={o.id} href={`/taller/${o.id}`} className="rounded-2xl border p-4 hover:border-indigo-400/50" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
              <div className="flex items-center justify-between gap-2"><p className="font-mono font-bold">{formatoFolioTaller(o.folio)} · {o.unidad?.codigo ?? "—"}</p><Badge variant={estadoOrdenVariant(o.estado)}>{ESTADO_LABEL[o.estado as EstadoOrden] ?? o.estado}</Badge></div>
              <p className="text-sm mt-2 line-clamp-2">{o.motivo || "Sin motivo"}</p>
              <p className="text-xs mt-2" style={{ color: "var(--fg-muted)" }}>{fechaMx(o.createdAt)}{o.operador?.nombre ? ` · ${o.operador.nombre}` : ""}</p>
            </Link>
          ))}
          {ordenes.length === 0 && <p className="col-span-full rounded-2xl border p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>No hay órdenes registradas.</p>}
        </section>
      )}

      {seccion === "bitacora" && (
        <section className="space-y-3">
          <div className="rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <label className="space-y-1 text-xs font-semibold"><span>Desde</span><Input type="date" value={desdeIncidencias} onChange={(e) => setDesdeIncidencias(e.target.value)} /></label>
              <label className="space-y-1 text-xs font-semibold"><span>Hasta</span><Input type="date" value={hastaIncidencias} onChange={(e) => setHastaIncidencias(e.target.value)} /></label>
              <label className="space-y-1 text-xs font-semibold"><span>Unidad</span><Select value={filtroUnidadIncidencia} onChange={(e) => setFiltroUnidadIncidencia(e.target.value)}><option value="todas">Todas las unidades</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}</Select></label>
              <label className="space-y-1 text-xs font-semibold"><span>Tipo de unidad</span><Select value={filtroTipoUnidad} onChange={(e) => setFiltroTipoUnidad(e.target.value)}><option value="todas">Todos</option><option value="camion">Camión</option><option value="maquina">Maquinaria</option><option value="nissan">NISSAN</option><option value="otro">Otro</option></Select></label>
              <label className="space-y-1 text-xs font-semibold"><span>Categoría</span><Select value={filtroCategoriaBitacora} onChange={(e) => setFiltroCategoriaBitacora(e.target.value)}><option value="todas">Todas</option>{TALLER_CATEGORIAS.map((item) => <option key={item.value} value={item.label}>{item.label}</option>)}</Select></label>
              <label className="space-y-1 text-xs font-semibold"><span>Status</span><Select value={filtroEstadoBitacora} onChange={(e) => setFiltroEstadoBitacora(e.target.value)}><option value="todas">Todos</option>{["Por ingresar", "Reportada", "En piso", "En reparación", "Proveedor externo", "Terminada", "Cerrada", "Cancelada", "Carga registrada"].map((status) => <option key={status} value={status}>{status}</option>)}</Select></label>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input className="min-w-[180px] flex-1 sm:max-w-[260px]" value={busquedaIncidencia} onChange={(e) => setBusquedaIncidencia(e.target.value)} placeholder="Buscar en la bitácora…" />
              <button type="button" onClick={() => { const hoy = getNowLocal().fecha; setDesdeIncidencias(`${hoy.slice(0, 7)}-01`); setHastaIncidencias(hoy); }} className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--border)" }}>Este mes</button>
              <button type="button" onClick={() => { setDesdeIncidencias(""); setHastaIncidencias(""); setFiltroUnidadIncidencia("todas"); setFiltroTipoUnidad("todas"); setFiltroCategoriaBitacora("todas"); setFiltroEstadoBitacora("todas"); setBusquedaIncidencia(""); setSoloConObservaciones(false); setIncluirUrea(true); }} className="rounded-lg border px-3 py-2 text-xs font-semibold" style={{ borderColor: "var(--border)" }}>Limpiar filtros</button>
              <label className="flex items-center gap-2 px-1 text-xs"><input type="checkbox" checked={incluirUrea} onChange={(e) => setIncluirUrea(e.target.checked)} className="h-4 w-4 accent-indigo-600" />Incluir cargas de urea</label>
              <label className="flex items-center gap-2 px-1 text-xs"><input type="checkbox" checked={soloConObservaciones} onChange={(e) => setSoloConObservaciones(e.target.checked)} className="h-4 w-4 accent-indigo-600" />Solo con observaciones</label>
              <button type="button" disabled={!registrosBitacoraFiltrados.length} onClick={exportarBitacora} className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#207783] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Download className="h-3.5 w-3.5" />Bitácora general Excel ({registrosBitacoraFiltrados.length})</button>
            </div>
          </div>

          {cargandoIncidencias && <p className="text-xs" aria-live="polite" style={{ color: "var(--fg-muted)" }}>Actualizando resultados…</p>}

          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {[
              ["Folios en la vista", registrosBitacoraFiltrados.filter((r) => r.folio != null).length],
              ["Activos", registrosBitacoraFiltrados.filter((r) => ["Por ingresar", "Reportada", "En piso", "En reparación", "Proveedor externo"].includes(r.status)).length],
              ["Pasaron a taller", registrosBitacoraFiltrados.filter((r) => r.ordenId != null).length],
              ["Refacciones (con IVA)", registrosBitacoraFiltrados.reduce((total, row) => total + row.costo, 0)],
            ].map(([label, value]) => <div key={label} className="rounded-lg border p-2.5" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}><p className="text-xl font-bold leading-none">{typeof value === "number" && label === "Refacciones (con IVA)" ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}</p><p className="mt-1 text-[11px] font-medium" style={{ color: "var(--fg-muted)" }}>{label}</p></div>)}
          </div>

          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
            <table className="w-full min-w-[1180px] text-sm">
              <thead><tr className="border-b text-left text-[10px] font-semibold uppercase tracking-wide" style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}>
                {(["Fecha", "Folio", "Unidad", "Falla", "Operador", "Atiende", "Lugar", "Resolución", "Costo", "Status"] as const).map((label) => <th key={label} className="px-2.5 py-2.5">{label}</th>)}
              </tr></thead>
              <tbody>
                {registrosBitacoraFiltrados.map((row) => {
                  const badgeVariant = row.status === "Terminada" || row.status === "Cerrada" || row.status === "Carga registrada" ? "success" : row.status === "Proveedor externo" ? "secondary" : row.status === "En reparación" || row.status === "En piso" ? "warning" : row.status === "Reportada" ? "danger" : row.status === "Cancelada" ? "secondary" : "default";
                  return <tr key={row.id} className="align-top border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-xs">{fechaMx(row.fecha)}</td>
                    <td className="px-2.5 py-2.5 font-mono text-xs font-bold text-[#207783]">{row.folio != null ? formatoFolioTaller(row.folio) : row.categoria === "Urea" ? "UREA" : "Pendiente"}{row.ordenId && <Link href={`/taller/${row.ordenId}`} className="mt-1 block text-[10px] font-normal text-indigo-600 underline">Abrir orden</Link>}</td>
                    <td className="px-2.5 py-2.5"><Link href={`/catalogo/unidades/${row.unidadId}`} className="rounded-md bg-neutral-800 px-2 py-1 font-mono text-xs font-bold text-white hover:underline">{row.unidad}</Link></td>
                    <td className="max-w-[240px] px-2.5 py-2.5 text-xs">{row.falla}<p className="mt-0.5 text-[10px]" style={{ color: "var(--fg-muted)" }}>{row.categoria}</p></td>
                    <td className="px-2.5 py-2.5 text-xs">{row.operador}</td>
                    <td className="px-2.5 py-2.5 text-xs">{row.atendio}</td>
                    <td className="max-w-[180px] px-2.5 py-2.5 text-xs">{row.lugar}</td>
                    <td className="max-w-[250px] px-2.5 py-2.5 text-xs">{row.resolucion}{row.historial.length > 0 && <details className="mt-1"><summary className="cursor-pointer text-[10px] text-indigo-600">Actualizaciones ({row.historial.length})</summary><ol className="mt-1 space-y-1">{row.historial.map((item, index) => <li key={`${row.id}-h-${index}`}><span className="font-semibold">{item.tipo.replaceAll("_", " ")}</span>{item.detalle ? ` · ${item.detalle}` : ""}{item.usuarioNombre ? ` · ${item.usuarioNombre}` : ""}</li>)}</ol></details>}</td>
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-xs">{row.costo > 0 ? `$${row.costo.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}</td>
                    <td className="px-2.5 py-2.5"><Badge variant={badgeVariant}>{row.status}</Badge></td>
                  </tr>;
                })}
                {registrosBitacoraFiltrados.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-sm" style={{ color: "var(--fg-muted)" }}>No hay registros para estos filtros.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Dialog open={modalIncidencia} onOpenChange={setModalIncidencia}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nueva incidencia</DialogTitle></DialogHeader>
          <form onSubmit={capturarIncidencia} className="space-y-3">
            <div><Label>Equipo</Label><Select value={unidadIncidencia} onChange={(e) => { const id = e.target.value; setUnidadIncidencia(id); const unidad = unidades.find((u) => String(u.id) === id); setOperadorIncidencia(unidad?.operadorDefaultId ? String(unidad.operadorDefaultId) : ""); }} required><option value="">Elegir equipo…</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}</Select></div>
            <div><Label>Categoría</Label><Select value={categoriaIncidencia} onChange={(e) => setCategoriaIncidencia(e.target.value as CategoriaTaller)}>{TALLER_CATEGORIAS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</Select>{CATEGORIAS_SIN_TALLER.includes(categoriaIncidencia as typeof CATEGORIAS_SIN_TALLER[number]) && <p className="mt-1 text-xs text-amber-700">Esta categoría quedará en Bitácora General y no se podrá pasar a taller.</p>}</div>
            <div><Label>Chofer (opcional)</Label><Select value={operadorIncidencia} onChange={(e) => setOperadorIncidencia(e.target.value)}><option value="">Sin asignar</option>{operadores.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}</Select></div>
            <div><Label>Prioridad</Label><Select value={prioridad} onChange={(e) => setPrioridad(e.target.value)}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></Select></div>
            <fieldset className="space-y-2"><legend className="text-sm font-medium">Fallas observadas · selección múltiple</legend><div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>{TALLER_FALLAS.map((falla) => <label key={falla} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={fallasSeleccionadas.includes(falla)} onChange={(e) => setFallasSeleccionadas((actuales) => e.target.checked ? [...actuales, falla] : actuales.filter((x) => x !== falla))} />{falla}</label>)}</div></fieldset>
            <div><Label>Descripción o detalle adicional (opcional)</Label><textarea autoFocus={fallasSeleccionadas.length > 0} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={2000} rows={3} placeholder="Describe brevemente qué se observó" className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} /></div>
            <div><Label>Ubicación (opcional)</Label><Input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} maxLength={200} placeholder="Lugar donde se detectó" /></div>
            <div><Label>Observaciones (opcional)</Label><textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} maxLength={2000} rows={2} placeholder="Notas adicionales" className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm" style={{ borderColor: "var(--border)" }} /></div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={pending} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white disabled:opacity-50">{pending ? "Registrando…" : "Registrar incidencia"}</button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={modalUrea} onOpenChange={setModalUrea}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar carga de urea</DialogTitle></DialogHeader>
          <form noValidate onSubmit={guardarUrea} className="space-y-3">
            <div><Label>Unidad</Label><Select value={unidadUrea} onChange={(e) => { const id = e.target.value; setUnidadUrea(id); const unidad = unidades.find((u) => String(u.id) === id); setOperadorUrea(unidad?.operadorDefaultId ? String(unidad.operadorDefaultId) : ""); }} required><option value="">Elegir unidad…</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}</Select></div>
            <div><Label>Fecha</Label><Input type="date" value={fechaUrea} onChange={(e) => setFechaUrea(e.target.value)} required /></div>
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
            <div className="grid grid-cols-2 gap-3"><div><Label>Unidad</Label><Select value={unidadLlanta} onChange={(e) => { const id = e.target.value; setUnidadLlanta(id); const unidad = unidades.find((u) => String(u.id) === id); setOperadorLlanta(unidad?.operadorDefaultId ? String(unidad.operadorDefaultId) : ""); }} required><option value="">Elegir unidad…</option>{unidades.map((u) => <option key={u.id} value={u.id}>{u.codigo}</option>)}</Select></div><div><Label>Fecha</Label><Input type="date" value={fechaLlanta} onChange={(e) => setFechaLlanta(e.target.value)} required /></div></div>
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
          <p className="text-sm" style={{ color: "var(--fg-muted)" }}>{equipoSeleccionado ? ETIQUETA_ESTADO[unidadesEnVista.find((u) => u.id === equipoSeleccionado.id)?.estado ?? "disponible"] : ""}</p>
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
            <div className="grid grid-cols-2 gap-3"><div><Label>Fecha de recepción</Label><Input type="date" value={fechaRecepcion} onChange={(e) => setFechaRecepcion(e.target.value)} required /></div><div><Label>Lectura</Label><Input type="number" inputMode="decimal" value={lecturaRecepcion} onChange={(e) => setLecturaRecepcion(e.target.value)} /></div></div>
            <div><Label>Quién recibe</Label><Input value={recibioRecepcion} onChange={(e) => setRecibioRecepcion(e.target.value)} placeholder="Nombre" /></div>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Al continuar se abrirá la orden y el checklist de ingreso.</p>
            <button type="submit" disabled={pending} className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white disabled:opacity-50">{pending ? "Recibiendo…" : "Crear orden y abrir checklist"}</button>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
