import { db } from "@/db";
import {
  tanques, cargas, recargasTanque, transferenciasTanque, auditLog,
} from "@/db/schema";
import { and, eq, gt, desc, sum } from "drizzle-orm";
import type { ConciliacionTanque } from "@/lib/alertas-config";

// Divergencia mínima que se tolera aunque el volumen movido sea poco (litros)
const TOLERANCIA_MINIMA_L = 10;

// Compara el nivel del sistema (litros_actuales, una caché) contra el nivel
// teórico derivado de los movimientos registrados desde el último ajuste
// manual auditado (el "ancla": un humano midió y fijó el nivel).
// Solo lee — nunca corrige ni modifica los tanques.
export async function conciliarTanques(): Promise<ConciliacionTanque[]> {
  const tanquesData = await db.select().from(tanques);

  return Promise.all(
    tanquesData.map(async (t) => {
      const [ancla] = await db
        .select({ datosJson: auditLog.datosJson, createdAt: auditLog.createdAt })
        .from(auditLog)
        .where(and(
          eq(auditLog.accion, "ajuste_stock"),
          eq(auditLog.entidad, "tanques"),
          eq(auditLog.entidadId, String(t.id)),
        ))
        .orderBy(desc(auditLog.createdAt))
        .limit(1);

      let anclaLitros = 0;
      let anclaFecha: Date | null = null;
      if (ancla?.datosJson && ancla.createdAt) {
        try {
          const datos = JSON.parse(ancla.datosJson) as { despues?: number };
          if (typeof datos.despues === "number") {
            anclaLitros = datos.despues;
            anclaFecha = ancla.createdAt;
          }
        } catch {
          // datosJson ilegible → conciliar desde el origen
        }
      }

      const [rec, car, salientes, entrantes] = await Promise.all([
        db.select({ total: sum(recargasTanque.litros) }).from(recargasTanque)
          .where(and(
            eq(recargasTanque.tanqueId, t.id),
            anclaFecha ? gt(recargasTanque.createdAt, anclaFecha) : undefined,
          )),
        db.select({ total: sum(cargas.litros) }).from(cargas)
          .where(and(
            eq(cargas.tanqueId, t.id),
            anclaFecha ? gt(cargas.createdAt, anclaFecha) : undefined,
          )),
        db.select({ total: sum(transferenciasTanque.litros) }).from(transferenciasTanque)
          .where(and(
            eq(transferenciasTanque.tanqueOrigenId, t.id),
            anclaFecha ? gt(transferenciasTanque.createdAt, anclaFecha) : undefined,
          )),
        db.select({ total: sum(transferenciasTanque.litros) }).from(transferenciasTanque)
          .where(and(
            eq(transferenciasTanque.tanqueDestinoId, t.id),
            anclaFecha ? gt(transferenciasTanque.createdAt, anclaFecha) : undefined,
          )),
      ]);

      const recL = Number(rec[0]?.total ?? 0);
      const carL = Number(car[0]?.total ?? 0);
      const outL = Number(salientes[0]?.total ?? 0);
      const innL = Number(entrantes[0]?.total ?? 0);

      const teorico = anclaLitros + recL - carL - outL + innL;
      const actual = t.litrosActuales ?? 0;
      const diferencia = actual - teorico;
      const volumenMovido = recL + carL + outL + innL;
      const tolerancia = Math.max(
        (volumenMovido * (t.ajustePorcentaje ?? 2)) / 100,
        TOLERANCIA_MINIMA_L,
      );

      return {
        tanqueId:    t.id,
        nombre:      t.nombre,
        actual:      Math.round(actual * 10) / 10,
        teorico:     Math.round(teorico * 10) / 10,
        diferencia:  Math.round(diferencia * 10) / 10,
        tolerancia:  Math.round(tolerancia * 10) / 10,
        ok:          Math.abs(diferencia) <= tolerancia,
        anclaFecha:  anclaFecha?.toISOString() ?? null,
        anclaLitros,
      };
    }),
  );
}

export async function registrarConciliacionAlertas(divergentes: ConciliacionTanque[]) {
  if (divergentes.length === 0) return;
  await db.insert(auditLog).values(
    divergentes.map((d) => ({
      usuarioId: null,
      accion: "conciliacion_alerta",
      entidad: "tanques",
      entidadId: String(d.tanqueId),
      datosJson: JSON.stringify(d),
    })),
  );
}
