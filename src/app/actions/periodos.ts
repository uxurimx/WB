"use server";

import { db } from "@/db";
import { periodos } from "@/db/schema";
import { and, lte, gte } from "drizzle-orm";
import { getLocalDateString, getLocalDayOfWeek, subtractDaysLocal, addDaysLocal, parseLocalDate } from "@/lib/date-utils";

function toLocalDate(fecha?: Date | string): Date {
  if (!fecha) return new Date();
  if (typeof fecha === "string") return parseLocalDate(fecha);
  return fecha;
}

export async function getPeriodoForFecha(fechaStr: string) {
  return db.query.periodos.findFirst({
    where: and(
      lte(periodos.fechaInicio, fechaStr),
      gte(periodos.fechaFin, fechaStr),
    ),
    orderBy: (p, { desc }) => [desc(p.fechaInicio)],
  });
}

// Obtiene el período que contiene la fecha (cerrado o abierto). Si no existe, lo crea.
// Períodos van de sábado a viernes.
export async function getOrCreatePeriodoActual(fecha?: Date | string) {
  const hoy = toLocalDate(fecha);
  const fechaStr = getLocalDateString(hoy);

  const existente = await getPeriodoForFecha(fechaStr);
  if (existente) return existente;

  // Calcular inicio (sábado anterior) y fin (viernes siguiente) usando hora LOCAL
  const diaSemana = getLocalDayOfWeek(hoy); // 0=dom, 1=lun, ..., 6=sab
  const diasHastaSabado = diaSemana === 6 ? 0 : diaSemana + 1;
  const sabado = subtractDaysLocal(hoy, diasHastaSabado);
  const viernes = addDaysLocal(sabado, 6);

  const inicio = getLocalDateString(sabado);
  const fin = getLocalDateString(viernes);

  // Formatear nombre del período
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  const nombreInicio = sabado.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
  const nombreFin = viernes.toLocaleDateString("es-MX", opts);
  const nombre = `${nombreInicio} al ${nombreFin}`;

  const [nuevo] = await db
    .insert(periodos)
    .values({ nombre, fechaInicio: inicio, fechaFin: fin })
    .returning();

  return nuevo;
}

// Rango de fechas por defecto para el historial (solo lectura, NO crea períodos).
// Devuelve el período que contiene hoy; si no, el más reciente; fallback: últimos 30 días.
export async function getPeriodoActualRange(): Promise<{ desde: string; hasta: string }> {
  const hoyStr = getLocalDateString();

  const actual = await db.query.periodos.findFirst({
    where: and(lte(periodos.fechaInicio, hoyStr), gte(periodos.fechaFin, hoyStr)),
    orderBy: (p, { desc }) => [desc(p.fechaInicio)],
  });
  if (actual) return { desde: actual.fechaInicio, hasta: actual.fechaFin };

  const reciente = await db.query.periodos.findFirst({
    orderBy: (p, { desc }) => [desc(p.fechaInicio)],
  });
  if (reciente) return { desde: reciente.fechaInicio, hasta: reciente.fechaFin };

  const hace30 = subtractDaysLocal(new Date(), 30);
  return { desde: getLocalDateString(hace30), hasta: hoyStr };
}

export async function getPeriodosRecientes(limit = 10) {
  return db.query.periodos.findMany({
    orderBy: (p, { desc }) => [desc(p.fechaInicio)],
    limit,
  });
}
