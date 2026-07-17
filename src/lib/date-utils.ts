/**
 * Utilidades para manejo de fechas en zona horaria LOCAL (no UTC).
 * Todas las funciones convierten a hora local sin pasar por UTC.
 */

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD usando hora LOCAL.
 * No usa toISOString() para evitar conversión a UTC.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene la hora actual en formato HH:MM usando hora LOCAL.
 * No usa toTimeString() para evitar overhead de parsing.
 */
export function getLocalTimeString(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Obtiene fecha y hora actual en formato local.
 * Reemplaza la función getNow() de los formularios.
 */
export function getNowLocal() {
  const now = new Date();
  return {
    fecha: getLocalDateString(now),
    hora: getLocalTimeString(now),
  };
}

/**
 * Obtiene el día de la semana en hora LOCAL (0=domingo, 6=sábado).
 * Necesario para cálculos de períodos que deben respetar zona horaria local.
 */
export function getLocalDayOfWeek(date: Date = new Date()): number {
  return date.getDay();
}

/**
 * Clona una fecha y resta días en hora LOCAL.
 */
export function subtractDaysLocal(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * Clona una fecha y suma días en hora LOCAL.
 */
export function addDaysLocal(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
