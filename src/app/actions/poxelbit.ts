"use server";

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { pbModulos, pbTickets, pbMensajes, pbNovedades } from "@/db/schema";
import { eq, desc, asc, and, inArray } from "drizzle-orm";

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
  const existing = await db.query.pbModulos.findMany({ columns: { id: true } });
  if (existing.length > 0) return { seeded: 0, message: "Los módulos ya existen" };

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
  ];

  await db.insert(pbModulos).values(modulos.map((m, i) => ({
    ...m,
    orden: i + 1,
    casosUso: m.casosUso ?? "[]",
    beneficios: m.beneficios ?? "[]",
    dependencias: "[]",
  })));

  // Novedad inicial de bienvenida
  await db.insert(pbNovedades).values({
    titulo: "Portal PoxelBit activado",
    contenido: "Bienvenido al portal de desarrollo de su sistema de control de diesel. Aquí podrá revisar los módulos propuestos, aprobar los que desee implementar y comunicarse directamente con el equipo de desarrollo.",
    tipo: "milestone",
  });

  revalidatePath("/poxelbit");
  return { seeded: modulos.length, message: `${modulos.length} módulos sembrados correctamente` };
}
