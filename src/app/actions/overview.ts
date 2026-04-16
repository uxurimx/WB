"use server";

import { db } from "@/db";
import { tanques, cargas, rendimientos, periodos } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { type AlertaRendimiento } from "@/lib/alertas-config";

export async function getOverviewStats() {
  const hoy = new Date().toISOString().split("T")[0];

  const [tanquesData, cargasHoyData, recientes, ultimoPeriodoCerrado] =
    await Promise.all([
      db.select().from(tanques),
      db.select({ litros: cargas.litros }).from(cargas).where(eq(cargas.fecha, hoy)),
      db.query.cargas.findMany({
        with: { unidad: true, operador: true },
        orderBy: [desc(cargas.createdAt)],
        limit: 12,
      }),
      // Último período cerrado — para mostrar alertas de rendimiento
      db.query.periodos.findFirst({
        where: eq(periodos.cerrado, true),
        orderBy: [desc(periodos.fechaFin)],
      }),
    ]);

  const taller = tanquesData.find((t) => t.nombre === "Taller");
  const nissan  = tanquesData.find((t) => t.nombre === "NISSAN");
  const litrosHoy = cargasHoyData.reduce((s, c) => s + (c.litros ?? 0), 0);

  // ── Alertas de rendimiento del último período cerrado ─────────────────────
  let alertasRendimiento: AlertaRendimiento[] = [];

  if (ultimoPeriodoCerrado) {
    const fueraDeTol = await db.query.rendimientos.findMany({
      where: (r, { eq, and }) =>
        and(
          eq(r.periodoId, ultimoPeriodoCerrado.id),
          eq(r.dentroDeTolerancia, false)
        ),
      with: { unidad: true },
      orderBy: (r, { asc }) => [asc(r.diferencia)], // peores primero
    });

    alertasRendimiento = fueraDeTol
      .filter(
        (r) =>
          r.rendimientoActual !== null &&
          r.rendimientoReferencia !== null &&
          r.diferencia !== null &&
          r.unidad !== null
      )
      .map((r) => {
        const difPct = ((r.rendimientoActual! - r.rendimientoReferencia!) /
          r.rendimientoReferencia!) * 100;
        return {
          unidadId:             r.unidadId,
          unidadCodigo:         r.unidad!.codigo,
          tipo:                 r.unidad!.tipo,
          rendimientoActual:    r.rendimientoActual!,
          rendimientoReferencia: r.rendimientoReferencia!,
          diferenciaPct:        difPct,
          periodoNombre:        ultimoPeriodoCerrado.nombre,
        };
      });
  }

  return {
    taller: {
      id:          taller?.id ?? 0,
      litros:      taller?.litrosActuales ?? 0,
      max:         taller?.capacidadMax ?? 10000,
      cuentalitros: taller?.cuentalitrosActual ?? 0,
    },
    nissan: {
      id:     nissan?.id ?? 0,
      litros: nissan?.litrosActuales ?? 0,
      max:    nissan?.capacidadMax ?? 1200,
    },
    cargasHoy:           cargasHoyData.length,
    litrosHoy,
    recientes,
    alertasRendimiento,
    ultimoPeriodoCerrado: ultimoPeriodoCerrado
      ? { id: ultimoPeriodoCerrado.id, nombre: ultimoPeriodoCerrado.nombre }
      : null,
  };
}
