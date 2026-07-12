"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { dbPB as db } from "@/db";
import { pbModulos, pbTickets, pbMensajes, pbNovedades } from "@/db/schema";
import { eq, desc, asc, and, inArray, gte } from "drizzle-orm";

const PB_ROLES = ["admin", "gerente"];

async function requirePBView() {
  const user = await currentUser();
  if (!user) throw new Error("No autenticado");
  const role = user.publicMetadata?.role as string;
  if (!PB_ROLES.includes(role)) throw new Error("Sin permiso PoxelBit");
  const isAdmin = role === "admin";
  const nombre = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Usuario";
  return { userId: user.id, nombre, isAdmin };
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULOS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPBModulosAction() {
  await requirePBView();
  return db.query.pbModulos.findMany({
    orderBy: [asc(pbModulos.orden), asc(pbModulos.fase)],
  });
}

export async function getPBModuloAction(id: number) {
  await requirePBView();
  return db.query.pbModulos.findFirst({
    where: eq(pbModulos.id, id),
    with: {
      tickets: {
        orderBy: [desc(pbTickets.createdAt)],
        limit: 5,
        columns: { id: true, titulo: true, estado: true, tipo: true },
      },
    },
  });
}

export async function getPBStatsAction() {
  await requirePBView();
  const all = await db.query.pbModulos.findMany();
  const total      = all.length;
  const aprobados  = all.filter((m) => ["approved", "in_progress", "completed"].includes(m.estado)).length;
  const enDesarrollo = all.filter((m) => m.estado === "in_progress").length;
  const completados  = all.filter((m) => m.estado === "completed").length;
  const inversion = all
    .filter((m) => ["approved", "in_progress", "completed"].includes(m.estado))
    .reduce((a, m) => a + m.costoEstimado, 0);
  const ticketsAbiertos = await db.query.pbTickets.findMany({
    where: inArray(pbTickets.estado, ["open", "in_progress"]),
    columns: { id: true },
  });
  return { total, aprobados, enDesarrollo, completados, inversion, ticketsAbiertos: ticketsAbiertos.length };
}

export async function aprobarModuloPBAction(id: number) {
  await requirePBView();
  const mod = await db.query.pbModulos.findFirst({ where: eq(pbModulos.id, id) });
  if (!mod) throw new Error("Módulo no encontrado");
  if (mod.estado !== "proposed") throw new Error("Solo se pueden aprobar módulos en estado propuesto");
  await db.update(pbModulos)
    .set({ estado: "approved", aprobadoAt: new Date(), updatedAt: new Date() })
    .where(eq(pbModulos.id, id));
  await db.insert(pbNovedades).values({
    titulo: `Módulo aprobado: ${mod.titulo}`,
    contenido: `El módulo "${mod.titulo}" ha sido aprobado. El desarrollo iniciará una vez confirmado el primer pago.`,
    tipo: "milestone",
    moduloId: id,
  });
  revalidatePath("/poxelbit");
  revalidatePath(`/poxelbit/modulos/${id}`);
}

export async function updateEstadoModuloPBAction(
  id: number,
  estado: "proposed" | "approved" | "in_progress" | "completed" | "paused" | "cancelled",
  progreso?: number,
) {
  const { isAdmin } = await requirePBView();
  if (!isAdmin) throw new Error("Solo admin puede cambiar estado de módulos");
  const extra: Record<string, unknown> = {};
  if (estado === "in_progress") extra.iniciadoAt = new Date();
  if (estado === "completed") { extra.completadoAt = new Date(); extra.progreso = 100; }
  if (progreso !== undefined) extra.progreso = progreso;
  await db.update(pbModulos)
    .set({ estado, updatedAt: new Date(), ...extra })
    .where(eq(pbModulos.id, id));
  revalidatePath("/poxelbit");
  revalidatePath(`/poxelbit/modulos/${id}`);
}

export async function getPBOpenTicketsCount() {
  const user = await currentUser();
  if (!user) return 0;
  const role = user.publicMetadata?.role as string;
  if (!PB_ROLES.includes(role)) return 0;
  try {
    const rows = await db.query.pbTickets.findMany({
      where: inArray(pbTickets.estado, ["open", "in_progress"]),
      columns: { id: true },
    });
    return rows.length;
  } catch { return 0; }
}

export async function getPBNovedadesUnreadCount() {
  const user = await currentUser();
  if (!user) return 0;
  const role = user.publicMetadata?.role as string;
  if (!PB_ROLES.includes(role)) return 0;
  try {
    const rows = await db.query.pbNovedades.findMany({
      where: eq(pbNovedades.leido, false),
      columns: { id: true },
    });
    return rows.length;
  } catch { return 0; }
}

export async function getResolvedTicketsRecent(dias = 7) {
  const user = await currentUser();
  if (!user) return [];
  const role = user.publicMetadata?.role as string;
  if (!PB_ROLES.includes(role)) return [];
  try {
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    return db.query.pbTickets.findMany({
      where: and(eq(pbTickets.estado, "resolved"), gte(pbTickets.resueltaAt, desde)),
      columns: { id: true, titulo: true, resueltaAt: true },
      orderBy: [desc(pbTickets.resueltaAt)],
      limit: 5,
    });
  } catch { return []; }
}

// ─────────────────────────────────────────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────────────────────────────────────────

export async function getTicketsPBAction() {
  await requirePBView();
  return db.query.pbTickets.findMany({
    orderBy: [desc(pbTickets.createdAt)],
    with: { modulo: { columns: { id: true, titulo: true } } },
  });
}

export async function getTicketPBAction(id: number) {
  await requirePBView();
  return db.query.pbTickets.findFirst({
    where: eq(pbTickets.id, id),
    with: {
      modulo: { columns: { id: true, titulo: true } },
      mensajes: { orderBy: [asc(pbMensajes.createdAt)] },
    },
  });
}

export async function createTicketPBAction(data: {
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: string;
  moduloId?: number;
}) {
  const { userId, nombre } = await requirePBView();
  const [ticket] = await db.insert(pbTickets).values({
    titulo: data.titulo,
    descripcion: data.descripcion,
    tipo: data.tipo,
    prioridad: data.prioridad,
    moduloId: data.moduloId ?? null,
    creadoPorId: userId,
    creadoPorNombre: nombre,
  }).returning();
  revalidatePath("/poxelbit/tickets");
  return ticket;
}

export async function updateEstadoTicketPBAction(
  id: number,
  estado: "open" | "in_progress" | "resolved" | "closed",
) {
  await requirePBView();
  const extra: Record<string, unknown> = {};
  if (estado === "resolved" || estado === "closed") extra.resueltaAt = new Date();
  await db.update(pbTickets)
    .set({ estado, updatedAt: new Date(), ...extra })
    .where(eq(pbTickets.id, id));
  revalidatePath("/poxelbit/tickets");
  revalidatePath(`/poxelbit/tickets/${id}`);
}

export async function addMensajePBAction(ticketId: number, contenido: string) {
  const { userId, nombre, isAdmin } = await requirePBView();
  await db.insert(pbMensajes).values({
    ticketId,
    contenido,
    autorId: userId,
    autorNombre: nombre,
    autorRol: isAdmin ? "developer" : "client",
  });
  const otroRol = isAdmin ? "client" : "developer";
  await db.update(pbMensajes)
    .set({ leido: true })
    .where(and(eq(pbMensajes.ticketId, ticketId), eq(pbMensajes.autorRol, otroRol)));
  revalidatePath(`/poxelbit/tickets/${ticketId}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// NOVEDADES
// ─────────────────────────────────────────────────────────────────────────────

export async function getNovedadesPBAction(limit = 20) {
  await requirePBView();
  return db.query.pbNovedades.findMany({
    orderBy: [desc(pbNovedades.createdAt)],
    limit,
    with: { modulo: { columns: { id: true, titulo: true } } },
  });
}

export async function createNovedadPBAction(data: {
  titulo: string;
  contenido: string;
  tipo: string;
  moduloId?: number;
}) {
  const { isAdmin } = await requirePBView();
  if (!isAdmin) throw new Error("Solo admin puede crear novedades");
  await db.insert(pbNovedades).values({ ...data, moduloId: data.moduloId ?? null });
  revalidatePath("/poxelbit");
  revalidatePath("/poxelbit/novedades");
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED — 12 módulos del plan
// ─────────────────────────────────────────────────────────────────────────────

export async function seedPBModulosAction() {
  const { isAdmin } = await requirePBView();
  if (!isAdmin) throw new Error("Solo admin puede sembrar módulos");
  const existing = await db.query.pbModulos.findMany({ columns: { titulo: true } });
  const existingTitles = new Set(existing.map((m) => m.titulo));

  const modulos = [
    // ── TEMA: operaciones ──────────────────────────────────────────
    {
      titulo: "Cargas Externas (Gasolineras y Socios)",
      resumen: "Registra litros cargados fuera del taller sin afectar el stock interno.",
      descripcion: `Cuando una unidad está en obra y necesita combustible de emergencia, recarga en gasolineras locales o recibe diesel de socios. Actualmente esas cargas se pierden del sistema: no aparecen en el historial ni cuentan para el rendimiento.\n\nEste módulo agrega un flujo de "Carga Externa" desde la ficha de cada unidad. El operador registra: litros, odómetro, fuente (gasolinera, Amigo, socio) y una nota. La carga queda en el historial con un badge visual "Externa", cuenta para el cálculo de rendimiento (km/L o L/Hr), y NO descuenta ningún tanque interno.\n\nResultado: visibilidad completa de todo el combustible que consume cada unidad, sin importar dónde se cargue.`,
      categoria: "operaciones",
      costoEstimado: 2500,
      diasEstimados: 2,
      tema: "operaciones",
      fasePackage: 1,
      orden: 1,
      casosUso: JSON.stringify(["Unidad en obra carga en gasolinera cercana", "Socio presta diesel en campo", "Emergencia: NISSAN no llegó a tiempo"]),
      beneficios: JSON.stringify(["Rendimiento más preciso (sin litros faltantes)", "Historial completo de consumo por unidad", "Sin impacto en cuentas de tanques"]),
      impacto: "Rendimientos más exactos. Se eliminan los 'litros fantasma' que no aparecen en el sistema pero sí se consumen.",
    },
    {
      titulo: "App Campo (PWA Móvil)",
      resumen: "Interfaz optimizada para teléfono que funciona con señal débil.",
      descripcion: `El operador NISSAN actualmente necesita acceso a una PC o teléfono con buena señal para registrar cargas en campo. En muchos sitios de obra la señal es intermitente o nula.\n\nEste módulo convierte la app en una PWA (Progressive Web App) instalable en el teléfono. La interfaz de campo es ultra-simple: fecha, unidad, litros, odómetro. Si no hay señal, guarda localmente y sincroniza automáticamente cuando regresa la conexión.\n\nEl flujo no requiere login nuevo: usa las credenciales existentes del sistema.`,
      categoria: "operaciones",
      costoEstimado: 8000,
      diasEstimados: 5,
      tema: "operaciones",
      fasePackage: 1,
      orden: 2,
      casosUso: JSON.stringify(["Operador registra carga campo desde su celular", "Sincronización automática al regresar señal", "Instalación como app en Android/iOS"]),
      beneficios: JSON.stringify(["Captura inmediata en campo", "Sin errores por transcripción tardía", "Funciona sin internet"]),
      impacto: "Elimina el retraso entre que ocurre una carga y cuando se registra en el sistema.",
    },
    {
      titulo: "Firma Digital en Carga",
      resumen: "El chofer firma con el dedo en pantalla al recibir el diesel.",
      descripcion: `En cada carga de campo, el chofer que recibe el diesel firma con el dedo en la pantalla del teléfono del operador NISSAN. La firma queda almacenada como imagen adjunta a la carga.\n\nEsto cierra la cadena de custodia del diesel: del taller al NISSAN al chofer, con evidencia de que cada quien confirmó la recepción. Reduce disputas sobre "cuántos litros recibí" y sirve como comprobante ante el cliente.`,
      categoria: "operaciones",
      costoEstimado: 5000,
      diasEstimados: 3,
      tema: "operaciones",
      fasePackage: 1,
      orden: 3,
      casosUso: JSON.stringify(["Carga campo: operador NISSAN pide firma al chofer", "Auditoría: demostrar que se entregó X litros a Y persona", "Disputas de litros entre operador y chofer"]),
      beneficios: JSON.stringify(["Cadena de custodia completa", "Evidencia digital de entrega", "Menos conflictos internos"]),
      impacto: "Trazabilidad de punta a punta: desde que llega la pipa hasta que el chofer acepta el diesel.",
    },
    {
      titulo: "Alertas WhatsApp",
      resumen: "Notificaciones automáticas al gerente por WhatsApp ante eventos críticos.",
      descripcion: `El sistema detecta anomalías y cierra períodos, pero nadie recibe aviso inmediato. El gerente tiene que entrar al sistema para darse cuenta.\n\nEste módulo envía mensajes de WhatsApp automáticos via Twilio o API de Meta cuando ocurren eventos importantes: carga anómala detectada (más del doble del promedio), unidad fuera de tolerancia al cerrar período, tanque Taller bajo de stock (configurable: ej. menos de 500L), período cerrado exitosamente.\n\nLos mensajes incluyen el nombre de la unidad, los valores y un link directo a la pantalla relevante del sistema.`,
      categoria: "operaciones",
      costoEstimado: 6500,
      diasEstimados: 3,
      tema: "operaciones",
      fasePackage: 1,
      orden: 4,
      casosUso: JSON.stringify(["Alerta de stock bajo en tanque Taller", "Unidad fuera de tolerancia en período cerrado", "Carga sospechosa: litros excesivos"]),
      beneficios: JSON.stringify(["Respuesta inmediata a anomalías", "Sin necesidad de revisar el sistema constantemente", "Registro de alertas enviadas"]),
      impacto: "El gerente se entera de un problema en minutos, no días.",
    },
    // ── TEMA: analisis ─────────────────────────────────────────────
    {
      titulo: "Costo por Kilómetro y por Hora",
      resumen: "Calcula cuánto cuesta operar cada unidad en pesos, no solo en litros.",
      descripcion: `Saber el rendimiento en km/L es útil, pero lo que realmente importa al negocio es cuánto cuesta mover cada camión o hacer trabajar cada máquina.\n\nEste módulo agrega el campo "precio por litro" a las recargas del tanque (o usa un precio fijo configurable globalmente). Con eso calcula automáticamente: costo por km de cada camión en el período, costo por hora de cada máquina, costo total de combustible por unidad, por obra y por período.\n\nLos costos se muestran en el detalle de cada unidad, en los reportes de período y en el nuevo dashboard gerencial.`,
      categoria: "analisis",
      costoEstimado: 7500,
      diasEstimados: 4,
      tema: "analisis",
      fasePackage: 2,
      orden: 5,
      casosUso: JSON.stringify(["Saber cuánto costó operar CA-12 en el período del 9 al 15", "Comparar costo/km entre camiones del mismo tipo", "Presupuestar combustible para una obra"]),
      beneficios: JSON.stringify(["Datos financieros reales de operación", "Base para presupuestos de obra", "Detección de unidades costosas"]),
      impacto: "De 'gastamos X litros' a 'gastamos $X.XX pesos'. Información que sirve para cotizar y presupuestar.",
    },
    {
      titulo: "Dashboard Gerencial",
      resumen: "Vista ejecutiva con gráficas de consumo, tendencias y KPIs visuales.",
      descripcion: `La vista de Overview actual muestra datos del día y alertas básicas. Para una gestión estratégica se necesita más: tendencias históricas, comparativos, y los datos presentados de forma visual.\n\nEste módulo agrega una sección de Analytics con: gráfica de consumo total por período (barras), tendencia de rendimiento por unidad (líneas), ranking de unidades por consumo o costo, comparativo de rendimiento actual vs referencia para toda la flota, y resumen de litros por obra activa.\n\nTodos los gráficos son interactivos, se pueden filtrar por fecha y exportar como imagen.`,
      categoria: "analisis",
      costoEstimado: 9000,
      diasEstimados: 5,
      tema: "analisis",
      fasePackage: 2,
      orden: 6,
      casosUso: JSON.stringify(["Reunión con dirección: presentar consumo del trimestre", "Detectar qué unidad tiene tendencia descendente de rendimiento", "Comparar consumo de una obra vs el promedio"]),
      beneficios: JSON.stringify(["Decisiones basadas en datos visuales", "Presentaciones profesionales para clientes", "Detección temprana de problemas de flota"]),
      impacto: "Transforma datos crudos en inteligencia operativa que se puede comunicar a dirección.",
    },
    {
      titulo: "Reporte Ejecutivo PDF",
      resumen: "Genera un PDF profesional por período listo para enviar a clientes o dirección.",
      descripcion: `El sistema ya genera un Excel con cargas y rendimientos. Pero para presentar a un cliente o a dirección se necesita algo más presentable: un PDF con el logo de la empresa, resumen ejecutivo, tabla de rendimientos por unidad con semáforo visual (verde/rojo), gráfica de consumo del período y comparativo vs período anterior.\n\nEl PDF se genera en segundos desde la pantalla del período y se puede descargar o enviar directamente por email.`,
      categoria: "analisis",
      costoEstimado: 5500,
      diasEstimados: 3,
      tema: "analisis",
      fasePackage: 2,
      orden: 7,
      casosUso: JSON.stringify(["Enviar reporte semanal al cliente de obra", "Presentar resultados de flota a dirección general", "Archivo mensual formal de rendimientos"]),
      beneficios: JSON.stringify(["Presentación profesional sin trabajo extra", "Mismo dato, mejor formato", "Archivo histórico en PDF"]),
      impacto: "Lo que antes requería armar un reporte en Word/PowerPoint, ahora es un click.",
    },
    {
      titulo: "Presupuesto vs Real por Obra",
      resumen: "Define un presupuesto de diesel para cada obra y monitorea en tiempo real.",
      descripcion: `Antes de iniciar una obra, se puede estimar cuántos litros de diesel va a consumir basado en las máquinas asignadas y los días de trabajo. Este módulo permite registrar ese presupuesto por obra.\n\nDurante la ejecución, el sistema muestra en tiempo real: litros consumidos vs presupuestados, porcentaje de avance del presupuesto, días restantes estimados con el ritmo actual, y alerta automática cuando se supera el 80% del presupuesto.\n\nEsto permite detectar sobreconsumos antes de que se conviertan en un problema financiero.`,
      categoria: "analisis",
      costoEstimado: 6000,
      diasEstimados: 3,
      tema: "analisis",
      fasePackage: 2,
      orden: 8,
      casosUso: JSON.stringify(["Obra Incasa: presupuesto 2,000L - consumido 1,450L (72%)", "Alerta: obra Roble superó el 80% del presupuesto en día 10 de 20", "Cotización: ¿cuánto diesel usó la obra similar anterior?"]),
      beneficios: JSON.stringify(["Control financiero de combustible por obra", "Alertas proactivas de sobreconsumo", "Datos históricos para cotizaciones futuras"]),
      impacto: "Prevenir que una obra se salga del presupuesto de diesel antes de que sea demasiado tarde.",
    },
    // ── TEMA: expansion ────────────────────────────────────────────
    {
      titulo: "Portal de Obras (Clientes Externos)",
      resumen: "Cada cliente de obra tiene su propio portal donde ve solo sus datos.",
      descripcion: `Los clientes de las obras que ejecutas preguntan cuánto diesel se está consumiendo en su proyecto. Actualmente hay que generar un reporte manual y enviárselo.\n\nEste módulo crea un portal web independiente donde cada cliente de obra recibe sus credenciales de acceso. Al entrar, ve únicamente los datos de su obra: litros consumidos por período, unidades que trabajaron en su sitio, gráfica de consumo semanal, y botón para descargar el reporte del período en PDF.\n\nNo puede ver otras obras, datos internos del taller, precios, ni información de otros clientes.`,
      categoria: "expansion",
      costoEstimado: 12000,
      diasEstimados: 7,
      tema: "expansion",
      fasePackage: 3,
      orden: 9,
      casosUso: JSON.stringify(["Cliente de Incasa entra a su portal y ve el consumo semanal", "Cliente descarga reporte PDF del período sin llamar a nadie", "Gerente da acceso a nuevo cliente en 2 minutos"]),
      beneficios: JSON.stringify(["Transparencia total con clientes", "Menos tiempo respondiendo preguntas de consumo", "Diferenciador competitivo: pocos contratistas ofrecen esto"]),
      impacto: "Convierte el sistema interno en un valor agregado para los clientes de tus obras.",
    },
    {
      titulo: "Importación Masiva Mejorada",
      resumen: "Importador Excel más robusto: validaciones claras y soporte para cargas externas.",
      descripcion: `El importador actual procesa archivos Excel pero los errores no son claros: si una fila falla, el mensaje es genérico. Tampoco soporta el nuevo tipo de carga "externa" que se agrega con el módulo de Cargas Externas.\n\nEste módulo mejora el importador con: validación fila por fila con reporte detallado de errores (fila 23: unidad CA-99 no existe), vista previa de los datos antes de confirmar la importación, soporte para el campo "origen externo", y plantilla Excel descargable con las columnas correctas y ejemplos.`,
      categoria: "expansion",
      costoEstimado: 4000,
      diasEstimados: 2,
      tema: "expansion",
      fasePackage: 3,
      orden: 10,
      casosUso: JSON.stringify(["Importar historial de 3 meses en una sola operación", "Detectar y corregir errores antes de confirmar", "Importar cargas externas del pasado"]),
      beneficios: JSON.stringify(["Menos errores en importación masiva", "Confianza antes de confirmar cambios", "Compatibilidad con cargas externas"]),
      impacto: "Migrar datos históricos o cargar períodos completos sin riesgo de corrupción.",
    },
    {
      titulo: "Multi-empresa",
      resumen: "El sistema soporta múltiples empresas o sucursales bajo una misma cuenta.",
      descripcion: `Si en el futuro operas más de una empresa o tienes sucursales, actualmente necesitarías sistemas separados. Este módulo agrega la capa de "organización" al sistema: cada empresa tiene sus propios tanques, unidades, operadores, obras y períodos.\n\nEl usuario con rol "superadmin" puede ver el consolidado de todas las empresas. Cada empresa tiene su propio admin que solo ve su información. La estructura de datos y la lógica de cargas/rendimientos se mantienen igual, solo se agrega el nivel de aislamiento por empresa.`,
      categoria: "expansion",
      costoEstimado: 18000,
      diasEstimados: 10,
      tema: "expansion",
      fasePackage: 3,
      orden: 11,
      casosUso: JSON.stringify(["Empresa A y Empresa B con flotas separadas bajo un mismo login", "Gerente general ve consolidado de ambas empresas", "Nueva sucursal operativa en 1 día"]),
      beneficios: JSON.stringify(["Escalabilidad a múltiples operaciones", "Datos separados por empresa", "Vista consolidada para dirección"]),
      impacto: "Preparar el sistema para crecer sin tener que migrar a una plataforma nueva.",
    },
    {
      titulo: "Telemetría GPS",
      resumen: "Obtiene odómetro y ubicación automáticamente desde rastreadores GPS.",
      descripcion: `El mayor punto de error humano en el sistema es la captura del odómetro. Si el chofer escribe un número incorrecto, el rendimiento calculado es erróneo. Adicionalmente, no hay forma de saber dónde estaba la unidad cuando se hizo la carga.\n\nEste módulo integra el sistema con rastreadores GPS (Wialon, GPSGate, o rastreadores simples via API). Al registrar una carga, el sistema consulta automáticamente el odómetro actual de la unidad desde el GPS. El capturista solo confirma el valor, no lo escribe. Además, queda registrada la ubicación GPS de la carga como evidencia.`,
      categoria: "expansion",
      costoEstimado: 15000,
      diasEstimados: 8,
      tema: "expansion",
      fasePackage: 3,
      orden: 12,
      casosUso: JSON.stringify(["Odómetro se auto-llena al seleccionar la unidad", "Mapa de dónde se realizó cada carga", "Alerta: carga registrada lejos de la obra asignada"]),
      beneficios: JSON.stringify(["Elimina error humano en odómetros", "Rendimientos más precisos", "Geofencing: cargas fuera de zona"]),
      impacto: "De captura manual propensa a error a lectura automática desde el vehículo.",
    },
    // ── TEMA: analisis — módulos v2.0 ──────────────────────────────
    {
      titulo: "Consumo Diesel por Obra",
      resumen: "Panel de análisis que muestra cuánto diesel consumió cada proyecto, desglosado por unidad y período.",
      descripcion: `Hoy el sistema registra en qué obra se hizo cada carga de campo, pero nadie tiene una vista que responda la pregunta más importante al costear un proyecto: "¿Cuánto diesel consumió esta obra en total?"\n\nEste módulo agrega un panel de análisis por obra que consolida todo el diesel atribuible a cada proyecto. Primero el diesel de campo (exacto, porque cada carga tiene obra_id asignado), luego el diesel de patio de las unidades que trabajaron en esa obra durante ese período (aproximado, etiquetado claramente como tal). El desglose muestra cada unidad, sus litros, y si el precio/litro está configurado, el costo en pesos.\n\nEjemplo real: Obra Incasa, 3 meses — EX02: 4,200 L / EX13: 3,100 L / CA17: 1,240 L (aprox.) / Total: 8,540 L × $24.50 = $209,230 MXN. Ese número hoy no existe en ningún sistema. Con él, la siguiente cotización de obra similar tiene datos reales detrás, no estimaciones.`,
      categoria: "analisis",
      costoEstimado: 15000,
      diasEstimados: 12,
      tema: "analisis",
      fasePackage: 2,
      orden: 13,
      casosUso: JSON.stringify([
        "Ver cuánto diesel consumió Obra Incasa en sus 3 meses de duración, desglosado por maquinaria",
        "Comparar consumo diesel entre dos obras del mismo tipo para calibrar presupuestos futuros",
        "Detectar que Obra Roble consumió 40% más de lo esperado a mitad del proyecto",
      ]),
      beneficios: JSON.stringify([
        "Costo real por proyecto, no estimado — base para cotizaciones futuras",
        "Diesel de campo (exacto) y diesel de patio (aproximado) presentados por separado con etiquetas claras",
        "Identifica obras que consumen más diesel del promedio histórico",
      ]),
      impacto: "Transforma el costo del diesel de un gasto global a un costo atribuible por proyecto. La siguiente obra similar se cotiza con datos reales, no suposiciones.",
    },
    // ── TEMA: flota ─────────────────────────────────────────────────
    {
      titulo: "Alertas de Mantenimiento Preventivo",
      resumen: "El sistema monitorea km y horas desde el último servicio y genera alertas antes de que el mantenimiento venza.",
      descripcion: `Cada carga de combustible que registra un chofer incluye el odómetro actual. Eso significa que el sistema ya sabe, en todo momento, cuántos kilómetros ha recorrido cada camión desde su último servicio. Solo falta que lo use.\n\nEste módulo agrega la tabla de mantenimientos: cada vez que una unidad recibe un servicio (aceite, llantas, frenos, preventivo), se registra el km/hrs al momento del servicio y el siguiente umbral. El sistema compara ese umbral con el odómetro de la última carga, y cuando la diferencia llega al 80%, genera una alerta "próximo mantenimiento". Al llegar al 100%, la alerta es "mantenimiento vencido".\n\nPara maquinaria el mecanismo es idéntico pero con horas acumuladas: cada carga de campo en una excavadora registra las horas actuales del motor. El ciclo de servicio es de 24 horas operativas.\n\nEl cliente actualmente lleva esto en libreta y reconoce que a veces se le escapa. Este módulo lo hace automático: el dato ya entra al sistema en cada carga, el cálculo es inmediato, y la alerta es visible antes de que sea urgente. Si existe el módulo de Tareas/Checklist (B4), cada alerta se convierte automáticamente en una tarea persistente que no desaparece hasta que alguien registra el servicio.`,
      categoria: "flota",
      costoEstimado: 22000,
      diasEstimados: 18,
      tema: "flota",
      fasePackage: 4,
      orden: 14,
      casosUso: JSON.stringify([
        "CA07 a 850 km del servicio → alerta amarilla 'Próximo mantenimiento' visible en dashboard",
        "EX02 a 22 hrs acumuladas desde último servicio → notificación naranja 'Preventivo en 2 hrs'",
        "Gerente ve en una pantalla todas las unidades con mantenimiento próximo o vencido, ordenadas por urgencia",
      ]),
      beneficios: JSON.stringify([
        "Nunca más un mantenimiento vencido por descuido: el sistema avisa al 80% y al 100% del ciclo",
        "Completamente automático: cada carga de combustible alimenta el cálculo sin trabajo extra del usuario",
        "Historial de mantenimientos por unidad: cuándo fue el último servicio, quién lo hizo, qué se revisó",
      ]),
      impacto: "El cliente reconoce que pierde el control de mantenimientos en libreta. Este módulo lo hace imposible de olvidar: el sistema avisa antes de que sea urgente, no después de que ya falló.",
    },
    {
      titulo: "Sistema de Tareas / Checklist",
      resumen: "Las alertas del sistema se convierten en tareas persistentes. El dashboard muestra las tareas pendientes primero, antes que cualquier estadística.",
      descripcion: `El sistema actual detecta cuando algo no está bien: un rendimiento fuera de tolerancia, un stock bajo, una unidad que supera el km de mantenimiento. Pero la alerta aparece, el usuario la ve o no la ve, y desaparece. Si nadie actuó, nadie lo sabe.\n\nEste módulo transforma esas alertas en tareas persistentes. Una tarea no desaparece hasta que alguien la cierra con una acción concreta. El dashboard del administrador muestra las tareas pendientes como primera pantalla, antes que cualquier estadística de diesel:\n\n→ 🔴 CA28 mantenimiento 100,000 km — VENCIDO\n→ 🟡 Stock bajo Taller — ordenar diesel (quedan 320 L)\n→ 🟡 CA17 rendimiento -22% esta semana — revisar\n→ 🟢 EX02 próximo mantenimiento — faltan 2 días\n\nLas tareas tienen dos orígenes: automáticas (generadas por el sistema cuando detecta una condición) y manuales (el administrador crea una tarea de cualquier actividad que necesite seguimiento). Ambas tienen estado: pendiente → en proceso → completada o descartada con justificación.\n\nEl historial de tareas completadas es un registro de qué problemas hubo, cuándo se detectaron y cuándo se resolvieron. En una auditoría o reunión con dirección, esa trazabilidad tiene valor. Este módulo convierte el sistema de una herramienta que el usuario consulta a un sistema que habla con el usuario primero.`,
      categoria: "flota",
      costoEstimado: 38000,
      diasEstimados: 32,
      tema: "flota",
      fasePackage: 4,
      orden: 15,
      casosUso: JSON.stringify([
        "Admin entra al sistema → primera pantalla: 3 tareas pendientes (no estadísticas de diesel)",
        "Alerta de stock bajo → tarea 'Pedir diesel' con estado pendiente hasta que se ordene y se cierre",
        "Mantenimiento CA28 vencido → tarea persistente que sobrevive a cierres de sesión y días sin revisar",
      ]),
      beneficios: JSON.stringify([
        "Nada se pierde: cada problema detectado tiene trazabilidad desde la detección hasta la resolución",
        "El historial de tareas completadas es el registro de decisiones operativas tomadas en el tiempo",
        "Sistema proactivo: el administrador no busca los problemas, los problemas buscan al administrador",
      ]),
      impacto: "Es el módulo más transformador de la propuesta: el sistema deja de ser un registro pasivo y se convierte en el centro de comando de las operaciones del día.",
    },
    {
      titulo: "Bitácora del Taller",
      resumen: "Registro digital de cada entrada de unidad al taller: motivo, quién atendió, materiales usados, resultado. Diseñado para capturar desde el celular en menos de 60 segundos.",
      descripcion: `El cliente lo dice con exactitud: "La neta ya no la llevo al día porque a veces se me pelan las cosas, no traigo la libreta o vienen tantos que se me escapa algún detalle."\n\nEste módulo es la versión digital de esa libreta, diseñada para operar desde el celular en el momento en que pasa. Cuando una unidad entra al taller: se selecciona la unidad, se elige el motivo (categoría + texto libre), se anota quién atiende, y se guarda. Cuando sale: se actualiza el estado (terminado / pendiente de refacción / requiere regreso) y opcionalmente se listan los materiales usados con cantidad y costo.\n\nSi existen consumibles en inventario (B6), los materiales se descuentan automáticamente del stock al registrar su uso. Si no están en inventario, se anotan como texto libre con costo para tener el gasto registrado de todas formas.\n\nEl historial de taller queda accesible desde la ficha de cada unidad: cuántas veces entró en los últimos meses, por qué motivos, qué se usó en cada visita. Con eso el técnico que atiende CA07 puede ver qué se hizo la última vez sin preguntar a nadie. Y el gerente puede detectar si una unidad está entrando al taller con frecuencia anormal, señal de que algo más grave está pasando.`,
      categoria: "flota",
      costoEstimado: 32000,
      diasEstimados: 27,
      tema: "flota",
      fasePackage: 4,
      orden: 16,
      casosUso: JSON.stringify([
        "CA17 entra con fuga hidráulica: técnico registra entrada en el celular en 60 segundos mientras revisa la unidad",
        "Técnico consulta historial de EX02 antes de atenderlo: ve qué se hizo en los últimos 3 meses sin preguntar",
        "Gerente detecta que R02 entró al taller 4 veces en 2 semanas — señal de un problema recurrente mayor",
      ]),
      beneficios: JSON.stringify([
        "El celular siempre está en el bolsillo — no hay libreta que olvidar ni transcripción tardía que perder información",
        "Historial completo de taller por unidad, visible desde su ficha junto con cargas y rendimientos",
        "Costo real de cada servicio calculado automáticamente cuando los materiales están en inventario",
      ]),
      impacto: "La información que hoy se pierde porque 'no traía la libreta' se captura en el momento, en el celular, en menos de un minuto. El taller deja de operar con memoria humana.",
    },
    {
      titulo: "Inventario de Consumibles",
      resumen: "Control de stock de llantas, rines, aceite y filtros. Compras por lote, consumo individual vinculado a entradas al taller.",
      descripcion: `Las llantas y rines se compran por lote. El cliente los va usando de a uno o de a dos cuando entra una unidad al taller. Sin control de inventario, el pedido de llantas nuevas se hace cuando alguien nota que ya no quedan, no cuando el sistema detecta que la existencia está llegando al mínimo.\n\nEste módulo controla el stock de consumibles: cada producto (llanta R22.5, aceite 15W40, filtro de combustible, rin 22) tiene un stock mínimo configurado. Cuando llega un lote nuevo, se registra la entrada con cantidad, costo unitario y proveedor. Cuando se usa en el taller (vinculado a una entrada de la Bitácora, B5), se registra la salida y el stock se actualiza en tiempo real.\n\nEl dashboard de inventario muestra una barra de progreso por producto: verde si hay stock suficiente, amarillo si está por debajo del mínimo, rojo si hay cero. El sistema genera una alerta (y si existe B4, una tarea "Pedir llantas") cuando un producto cae por debajo del mínimo configurado.\n\nEl costo real de cada entrada al taller se calcula automáticamente: si CA17 usó 2 llantas R22.5 a $4,200 c/u y 1 filtro de combustible a $280, el costo del servicio es $8,680 sin que nadie tenga que calcularlo. El historial de compras por proveedor permite ver quién vende más barato a lo largo del tiempo.`,
      categoria: "flota",
      costoEstimado: 28000,
      diasEstimados: 23,
      tema: "flota",
      fasePackage: 4,
      orden: 17,
      casosUso: JSON.stringify([
        "Llegan 8 llantas R22.5 de Llantera López → se registra entrada de lote con proveedor y costo unitario",
        "CA17 usa 2 llantas en taller (entrada Bitácora #47) → stock baja automáticamente de 8 a 6, costo registrado",
        "Stock de llantas R20 llega a 2 piezas → alerta de mínimo y tarea 'Pedir llantas' generada automáticamente",
      ]),
      beneficios: JSON.stringify([
        "Siempre se sabe cuántos consumibles quedan sin necesidad de hacer inventario físico",
        "Costo real de cada entrada al taller: materiales a precio real, calculados automáticamente",
        "Historial de compras por proveedor: quién vende más barato, con qué tiempo de entrega, en qué período",
      ]),
      impacto: "El pedido de consumibles deja de hacerse 'cuando alguien nota que ya no quedan' y pasa a hacerse cuando el sistema detecta que se está llegando al mínimo — con tiempo suficiente para ordenar.",
    },
  ];

  const nuevos = modulos.filter((m) => !existingTitles.has(m.titulo));
  if (nuevos.length === 0) return { seeded: 0, message: "Todos los módulos ya existen" };

  await db.insert(pbModulos).values(nuevos.map((m) => ({
    ...m,
    casosUso: m.casosUso ?? "[]",
    beneficios: m.beneficios ?? "[]",
    dependencias: "[]",
  })));

  // Novedad de bienvenida solo si es la primera vez
  if (existingTitles.size === 0) {
    await db.insert(pbNovedades).values({
      titulo: "Portal PoxelBit activado",
      contenido: "Bienvenido al portal de desarrollo de su sistema de control de diesel. Aquí podrá revisar los módulos propuestos, aprobar los que desee implementar y comunicarse directamente con el equipo de desarrollo.",
      tipo: "milestone",
    });
  }

  revalidatePath("/poxelbit");
  return { seeded: nuevos.length, message: `${nuevos.length} módulo${nuevos.length !== 1 ? "s" : ""} sembrado${nuevos.length !== 1 ? "s" : ""} correctamente` };
}
