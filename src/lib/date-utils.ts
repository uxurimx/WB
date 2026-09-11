/**
 * Fechas de negocio en zona de WB Construcción (Monterrey).
 * Vercel corre en UTC: sin esto, después de las 18:00 en Monterrey "hoy" ya es mañana.
 */
export const APP_TZ = "America/Monterrey";

function tzParts(date: Date) {
  const map: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return map;
}

/** YYYY-MM-DD del calendario en Monterrey (no UTC, no TZ del laptop). */
export function getLocalDateString(date: Date = new Date()): string {
  const p = tzParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

/** HH:MM en Monterrey. */
export function getLocalTimeString(date: Date = new Date()): string {
  const p = tzParts(date);
  return `${p.hour}:${p.minute}`;
}

export function getNowLocal() {
  const now = new Date();
  return {
    fecha: getLocalDateString(now),
    hora: getLocalTimeString(now),
  };
}

/** 0=domingo … 6=sábado, en Monterrey. */
export function getLocalDayOfWeek(date: Date = new Date()): number {
  const wd = tzParts(date).weekday;
  const i = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
  return i >= 0 ? i : date.getUTCDay();
}

/** Instant seguro para un YYYY-MM-DD de negocio: mediodía UTC = 06:00 Monterrey, mismo día. */
export function parseLocalDate(fecha: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha.trim());
  if (!m) throw new Error(`Fecha inválida: ${fecha}`);
  return new Date(`${m[1]}-${m[2]}-${m[3]}T12:00:00.000Z`);
}

export function subtractDaysLocal(date: Date, days: number): Date {
  const base = parseLocalDate(getLocalDateString(date));
  base.setUTCDate(base.getUTCDate() - days);
  return base;
}

export function addDaysLocal(date: Date, days: number): Date {
  const base = parseLocalDate(getLocalDateString(date));
  base.setUTCDate(base.getUTCDate() + days);
  return base;
}

const fechaFmt: Intl.DateTimeFormatOptions = {
  timeZone: APP_TZ,
  weekday: "short",
  day: "numeric",
  month: "short",
};

export function formatFechaMx(fecha: string): string {
  return parseLocalDate(fecha).toLocaleDateString("es-MX", fechaFmt);
}

export function formatFechaHoraMx(fecha: string, createdAt?: string | null, hora?: string | null): string {
  if (createdAt) {
    return new Date(createdAt).toLocaleString("es-MX", {
      timeZone: APP_TZ,
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  const h = hora?.slice(0, 5);
  return h ? `${formatFechaMx(fecha)} · ${h}` : formatFechaMx(fecha);
}
