"use server";

import { db } from "@/db";
import { periodos } from "@/db/schema";
import { eq, and, lte, gte } from "drizzle-orm";

// Obtiene el período activo para una fecha dada (o hoy)
// Períodos van de sábado a viernes
export async function getOrCreatePeriodoActual(fecha?: Date) {
  const hoy = fecha ?? new Date();

  // Buscar período existente que contenga esta fecha
  const fechaStr = hoy.toISOString().split("T")[0];

  const existente = await db.query.periodos.findFirst({
    where: and(
      lte(periodos.fechaInicio, fechaStr),
      gte(periodos.fechaFin, fechaStr),
      eq(periodos.cerrado, false)
    ),
  });

  if (existente) return existente;

  // Calcular inicio (sábado anterior) y fin (viernes siguiente)
  const diaSemana = hoy.getDay(); // 0=dom, 1=lun, ..., 6=sab
  const diasHastaSabado = diaSemana === 6 ? 0 : diaSemana + 1;
  const sabado = new Date(hoy);
  sabado.setDate(hoy.getDate() - diasHastaSabado);

  const viernes = new Date(sabado);
  viernes.setDate(sabado.getDate() + 6);

  const inicio = sabado.toISOString().split("T")[0];
  const fin = viernes.toISOString().split("T")[0];

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

export async function getPeriodosRecientes(limit = 10) {
  return db.query.periodos.findMany({
    orderBy: (p, { desc }) => [desc(p.fechaInicio)],
    limit,
  });
}
