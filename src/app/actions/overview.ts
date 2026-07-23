"use server";

import { db } from "@/db";
import { tanques, cargas, periodos, configuracion, pbTickets, recargasTanque, transferenciasTanque } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import {
  type AlertaRendimiento,
  type AlertaMantenimiento,
  type AnomaliaActiva,
  ALERTA_RENDIMIENTO_DIAS_DEFAULT,
} from "@/lib/alertas-config";
import { conciliarTanques } from "@/lib/conciliacion";
import { getLocalDateString, subtractDaysLocal } from "@/lib/date-utils";
import { getAlertasMantenimientoOverview } from "@/app/actions/mantenimiento";

// Umbral: más de este número de cargas en el mismo día para la misma unidad = anomalía
const UMBRAL_CARGAS_DIA = 2;
// Umbral: litros en una sola carga de patio considerados excesivos
const UMBRAL_LITROS_CARGA = 400;

export async function getOverviewStats() {
  const hoy = getLocalDateString();

  const hace7dias = subtractDaysLocal(new Date(), 7);

  const [tanquesData, cargasHoyData, recientes, ultimoPeriodoCerrado, periodoActivo, alertaDiasRow, conciliacion, ticketsResueltos, recientesRecargasData, recientesTransfData, alertasMantenimiento] =
    await Promise.all([
      db.select().from(tanques),
      db.select({ litros: cargas.litros }).from(cargas).where(eq(cargas.fecha, hoy)),
      db.query.cargas.findMany({
        with: { unidad: true, operador: true },
        orderBy: [desc(cargas.fecha), desc(cargas.createdAt)],
        limit: 12,
      }),
      db.query.periodos.findFirst({
        where: eq(periodos.cerrado, true),
        orderBy: [desc(periodos.fechaFin)],
      }),
      db.query.periodos.findFirst({
        where: eq(periodos.cerrado, false),
        orderBy: [desc(periodos.fechaInicio)],
      }),
      db.query.configuracion.findFirst({
        where: eq(configuracion.clave, "alerta_rendimiento_dias"),
      }),
      conciliarTanques(),
      db.query.pbTickets.findMany({
        where: and(eq(pbTickets.estado, "resolved"), gte(pbTickets.resueltaAt, hace7dias)),
        columns: { id: true, titulo: true, resueltaAt: true },
        orderBy: [desc(pbTickets.resueltaAt)],
        limit: 5,
      }).catch(() => [] as { id: number; titulo: string; resueltaAt: Date | null }[]),
      db.select({
        id: recargasTanque.id,
        tanqueId: recargasTanque.tanqueId,
        fecha: recargasTanque.fecha,
        litros: recargasTanque.litros,
        proveedor: recargasTanque.proveedor,
        folioFactura: recargasTanque.folioFactura,
        createdAt: recargasTanque.createdAt,
      }).from(recargasTanque).orderBy(desc(recargasTanque.createdAt)).limit(6),
      db.select({
        id: transferenciasTanque.id,
        folio: transferenciasTanque.folio,
        fecha: transferenciasTanque.fecha,
        litros: transferenciasTanque.litros,
        tanqueOrigenId: transferenciasTanque.tanqueOrigenId,
        tanqueDestinoId: transferenciasTanque.tanqueDestinoId,
        createdAt: transferenciasTanque.createdAt,
      }).from(transferenciasTanque).orderBy(desc(transferenciasTanque.createdAt)).limit(6),
      getAlertasMantenimientoOverview(),
    ]);

  const taller   = tanquesData.find((t) => t.nombre === "Taller");
  const nissan   = tanquesData.find((t) => t.nombre === "NISSAN");
  const tanqueNombres = Object.fromEntries(tanquesData.map((t) => [t.id, t.nombre]));
  const litrosHoy = cargasHoyData.reduce((s, c) => s + (c.litros ?? 0), 0);
  const alertaDias = alertaDiasRow
    ? parseInt(alertaDiasRow.valor, 10)
    : ALERTA_RENDIMIENTO_DIAS_DEFAULT;

  // ── Alertas de rendimiento del último período cerrado ─────────────────────
  let alertasRendimiento: AlertaRendimiento[] = [];
  const alertasMantenimientoData: AlertaMantenimiento[] = alertasMantenimiento;
  let rendimientoExpirado = false;

  if (ultimoPeriodoCerrado) {
    // Verificar si el período cerrado está dentro de la ventana configurable
    const fechaCierre = new Date(ultimoPeriodoCerrado.fechaFin + "T12:00:00");
    const diasDesde = Math.floor(
      (Date.now() - fechaCierre.getTime()) / (1000 * 60 * 60 * 24)
    );
    rendimientoExpirado = diasDesde > alertaDias;

    if (!rendimientoExpirado) {
      const fueraDeTol = await db.query.rendimientos.findMany({
        where: (r, { eq, and }) =>
          and(
            eq(r.periodoId, ultimoPeriodoCerrado.id),
            eq(r.dentroDeTolerancia, false)
          ),
        with: { unidad: true },
        orderBy: (r, { asc }) => [asc(r.diferencia)],
      });

      alertasRendimiento = fueraDeTol
        .filter(
          (r) =>
            r.rendimientoActual !== null &&
            r.rendimientoReferencia !== null &&
            r.diferencia !== null &&
            r.unidad !== null &&
            // Solo desviaciones que empeoran: camión rinde menos (Δ<0),
            // maquinaria consume más (Δ>0). Las mejoras no generan alerta.
            (r.unidad.tipo === "camion" ? r.diferencia < 0 : r.diferencia > 0)
        )
        .map((r) => {
          const difPct =
            ((r.rendimientoActual! - r.rendimientoReferencia!) /
              r.rendimientoReferencia!) *
            100;
          return {
            unidadId:              r.unidadId,
            unidadCodigo:          r.unidad!.codigo,
            tipo:                  r.unidad!.tipo,
            rendimientoActual:     r.rendimientoActual!,
            rendimientoReferencia: r.rendimientoReferencia!,
            diferenciaPct:         difPct,
            periodoNombre:         ultimoPeriodoCerrado.nombre,
          };
        });
    }
  }

  // ── Anomalías en el período activo ────────────────────────────────────────
  const anomaliasActivas: AnomaliaActiva[] = [];

  if (periodoActivo) {
    const cargasPeriodo = await db.query.cargas.findMany({
      where: eq(cargas.periodoId, periodoActivo.id),
      with: { unidad: true },
    });

    // Agrupar por unidadId + fecha
    const grupos = new Map<string, typeof cargasPeriodo>();
    for (const c of cargasPeriodo) {
      const key = `${c.unidadId}_${c.fecha}`;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(c);
    }

    for (const group of grupos.values()) {
      const unidadCodigo = group[0].unidad?.codigo ?? `#${group[0].unidadId}`;
      const fecha = group[0].fecha;
      const totalLitros = group.reduce((s, c) => s + (c.litros ?? 0), 0);

      // Múltiples cargas en el mismo día
      if (group.length > UMBRAL_CARGAS_DIA) {
        anomaliasActivas.push({
          tipo:         "multiple_cargas_dia",
          unidadCodigo,
          unidadId:     group[0].unidadId,
          detalle:      `${group.length} cargas en un día · ${totalLitros.toLocaleString()} L`,
          fecha,
          totalLitros,
          numCargas:    group.length,
        });
      }

      // Carga individual excesiva (patio)
      for (const c of group) {
        if (c.origen === "patio" && (c.litros ?? 0) > UMBRAL_LITROS_CARGA) {
          // Solo si no ya fue reportada como múltiple
          const yaReportada = anomaliasActivas.some(
            (a) => a.unidadId === c.unidadId && a.fecha === c.fecha
          );
          if (!yaReportada) {
            anomaliasActivas.push({
              tipo:         "litros_excesivos",
              unidadCodigo,
              unidadId:     c.unidadId,
              detalle:      `${(c.litros ?? 0).toLocaleString()} L en una sola carga (umbral: ${UMBRAL_LITROS_CARGA} L)`,
              fecha,
              totalLitros:  c.litros ?? 0,
              numCargas:    1,
            });
          }
        }
      }
    }

    // Ordenar: más recientes primero
    anomaliasActivas.sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  return {
    hoy,
    taller: {
      id:                  taller?.id ?? 0,
      nombre:              taller?.nombre ?? "Taller",
      litros:              taller?.litrosActuales ?? 0,
      max:                 taller?.capacidadMax ?? 10000,
      cuentalitros:        taller?.cuentalitrosActual ?? 0,
      ajustePorcentaje:    taller?.ajustePorcentaje ?? 2,
      ultimaActualizacion: taller?.ultimaActualizacion?.toISOString() ?? null,
    },
    nissan: {
      id:                  nissan?.id ?? 0,
      nombre:              nissan?.nombre ?? "NISSAN",
      litros:              nissan?.litrosActuales ?? 0,
      max:                 nissan?.capacidadMax ?? 1200,
      cuentalitros:        nissan?.cuentalitrosActual ?? 0,
      ajustePorcentaje:    nissan?.ajustePorcentaje ?? 2,
      ultimaActualizacion: nissan?.ultimaActualizacion?.toISOString() ?? null,
    },
    cargasHoy:            cargasHoyData.length,
    litrosHoy,
    recientes: recientes.map((c) => ({
      id: c.id,
      fecha: c.fecha,
      hora: c.hora,
      folio: c.folio,
      litros: c.litros,
      origen: c.origen,
      tipoDiesel: c.tipoDiesel,
      unidadId: c.unidadId,
      createdAt: c.createdAt?.toISOString() ?? null,
      unidad: c.unidad ? { codigo: c.unidad.codigo } : null,
      operador: c.operador ? { nombre: c.operador.nombre } : null,
    })),
    alertasRendimiento,
    alertasMantenimiento: alertasMantenimientoData,
    anomaliasActivas,
    conciliacion,
    alertaDias,
    ultimoPeriodoCerrado: ultimoPeriodoCerrado
      ? { id: ultimoPeriodoCerrado.id, nombre: ultimoPeriodoCerrado.nombre }
      : null,
    periodoActivoId: periodoActivo?.id ?? null,
    ticketsResueltos: ticketsResueltos.map((t) => ({
      id: t.id,
      titulo: t.titulo,
      resueltaAt: t.resueltaAt?.toISOString() ?? null,
    })),
    recientesRecargas: recientesRecargasData.map((r) => ({
      id: r.id,
      fecha: r.fecha,
      litros: r.litros,
      tanqueNombre: tanqueNombres[r.tanqueId] ?? "Tanque",
      proveedor: r.proveedor,
      folioFactura: r.folioFactura,
      createdAt: r.createdAt?.toISOString() ?? null,
    })),
    recientesTransferencias: recientesTransfData.map((t) => ({
      id: t.id,
      fecha: t.fecha,
      litros: t.litros,
      folio: t.folio,
      origenNombre: tanqueNombres[t.tanqueOrigenId] ?? "Origen",
      destinoNombre: tanqueNombres[t.tanqueDestinoId] ?? "Destino",
      createdAt: t.createdAt?.toISOString() ?? null,
    })),
  };
}
