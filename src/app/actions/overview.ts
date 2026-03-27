"use server";

import { db } from "@/db";
import { tanques, cargas } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getOverviewStats() {
  const hoy = new Date().toISOString().split("T")[0];

  const [tanquesData, cargasHoyData, recientes] = await Promise.all([
    db.select().from(tanques),
    db
      .select({ litros: cargas.litros })
      .from(cargas)
      .where(eq(cargas.fecha, hoy)),
    db.query.cargas.findMany({
      with: { unidad: true, operador: true },
      orderBy: [desc(cargas.createdAt)],
      limit: 12,
    }),
  ]);

  const taller = tanquesData.find((t) => t.nombre === "Taller");
  const nissan = tanquesData.find((t) => t.nombre === "NISSAN");

  const litrosHoy = cargasHoyData.reduce((s, c) => s + (c.litros ?? 0), 0);

  return {
    taller: {
      id: taller?.id ?? 0,
      litros: taller?.litrosActuales ?? 0,
      max: taller?.capacidadMax ?? 10000,
      cuentalitros: taller?.cuentalitrosActual ?? 0,
    },
    nissan: {
      id: nissan?.id ?? 0,
      litros: nissan?.litrosActuales ?? 0,
      max: nissan?.capacidadMax ?? 1200,
    },
    cargasHoy: cargasHoyData.length,
    litrosHoy,
    recientes,
  };
}
