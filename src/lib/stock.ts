import { neonSql } from "@/db";

export type TankAfterMutation = {
  id: number;
  nombre: string;
  litrosActuales: number;
  capacidadMax: number;
  cuentalitrosActual: number | null;
  ajustePorcentaje: number | null;
};

function asRows(result: unknown): Record<string, unknown>[] {
  if (!Array.isArray(result)) return [];
  if (result.length === 0) return [];
  if (Array.isArray(result[0])) return result[0] as Record<string, unknown>[];
  return result as Record<string, unknown>[];
}

function num(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

function mapTank(row: Record<string, unknown>): TankAfterMutation {
  return {
    id: num(row.id ?? row.tanque_id),
    nombre: String(row.nombre ?? row.tanque_nombre ?? ""),
    litrosActuales: num(row.litros_actuales),
    capacidadMax: num(row.capacidad_max),
    cuentalitrosActual: row.cuentalitros_actual == null ? null : num(row.cuentalitros_actual),
    ajustePorcentaje: row.ajuste_porcentaje == null ? null : num(row.ajuste_porcentaje),
  };
}

/** Descuenta litros solo si hay stock. Una sola sentencia = atómico en neon-http. */
export async function consumeTank(opts: {
  tanqueId: number;
  litros: number;
  cuentalitrosActual?: number | null;
}): Promise<TankAfterMutation> {
  const rows = asRows(await neonSql`
    UPDATE tanques
    SET
      litros_actuales = litros_actuales - ${opts.litros},
      cuentalitros_actual = CASE
        WHEN ${opts.cuentalitrosActual}::double precision IS NOT NULL
        THEN ${opts.cuentalitrosActual}::double precision
        ELSE cuentalitros_actual
      END,
      ultima_actualizacion = now()
    WHERE id = ${opts.tanqueId}
      AND litros_actuales >= ${opts.litros}
    RETURNING id, nombre, litros_actuales, capacidad_max, cuentalitros_actual, ajuste_porcentaje
  `);
  if (rows.length === 0) {
    throw new Error("Stock insuficiente para completar la operación");
  }
  return mapTank(rows[0]);
}

/**
 * Devuelve litros al tanque. No recorta por capacidadMax (un rollback no debe
 * perder combustible porque el tanque ya se haya marcado "lleno").
 * No retrocede el cuentalitros físico.
 */
export async function restoreTankLitros(opts: {
  tanqueId: number;
  litros: number;
}): Promise<TankAfterMutation> {
  const rows = asRows(await neonSql`
    UPDATE tanques
    SET
      litros_actuales = litros_actuales + ${opts.litros},
      ultima_actualizacion = now()
    WHERE id = ${opts.tanqueId}
    RETURNING id, nombre, litros_actuales, capacidad_max, cuentalitros_actual, ajuste_porcentaje
  `);
  if (rows.length === 0) throw new Error("Tanque no encontrado");
  return mapTank(rows[0]);
}

/** delta > 0 consume; delta < 0 restaura. Consume exige stock suficiente. */
export async function applyTankLitrosDelta(opts: {
  tanqueId: number;
  delta: number;
}): Promise<TankAfterMutation> {
  if (opts.delta === 0) {
    const rows = asRows(await neonSql`
      SELECT id, nombre, litros_actuales, capacidad_max, cuentalitros_actual, ajuste_porcentaje
      FROM tanques WHERE id = ${opts.tanqueId}
    `);
    if (rows.length === 0) throw new Error("Tanque no encontrado");
    return mapTank(rows[0]);
  }
  if (opts.delta > 0) {
    return consumeTank({ tanqueId: opts.tanqueId, litros: opts.delta });
  }
  return restoreTankLitros({ tanqueId: opts.tanqueId, litros: -opts.delta });
}

export async function insertCargaAtomic(opts: {
  tanqueId: number;
  litros: number;
  cuentalitrosActual?: number | null;
  fecha: string;
  hora: string | null;
  folio: number | null;
  periodoId: number | null;
  unidadId: number;
  operadorId: number | null;
  obraId: number | null;
  fuenteId: number | null;
  odometroHrs: number | null;
  kmEstimado: boolean;
  cuentaLtInicio: number | null;
  cuentaLtFin: number | null;
  origen: string;
  tipoDiesel: string | null;
  quienSuministraId: number | null;
  quienRecibeId: number | null;
  notas: string | null;
  registradoPorId: string;
}): Promise<{ cargaId: number; folio: number | null; tank: TankAfterMutation }> {
  const rows = asRows(await neonSql`
    WITH upd AS (
      UPDATE tanques
      SET
        litros_actuales = litros_actuales - ${opts.litros},
        cuentalitros_actual = CASE
          WHEN ${opts.cuentalitrosActual}::double precision IS NOT NULL
          THEN ${opts.cuentalitrosActual}::double precision
          ELSE cuentalitros_actual
        END,
        ultima_actualizacion = now()
      WHERE id = ${opts.tanqueId}
        AND litros_actuales >= ${opts.litros}
      RETURNING id, nombre, litros_actuales, capacidad_max, cuentalitros_actual, ajuste_porcentaje
    ),
    ins AS (
      INSERT INTO cargas (
        fecha, hora, folio, periodo_id, unidad_id, operador_id, obra_id,
        fuente_id, tanque_id, litros, odometro_hrs, km_estimado,
        cuenta_lt_inicio, cuenta_lt_fin, origen, tipo_diesel,
        quien_suministra_id, quien_recibe_id, notas, registrado_por_id
      )
      SELECT
        ${opts.fecha},
        ${opts.hora}::time,
        ${opts.folio}::int,
        ${opts.periodoId}::int,
        ${opts.unidadId}::int,
        ${opts.operadorId}::int,
        ${opts.obraId}::int,
        ${opts.fuenteId}::int,
        upd.id,
        ${opts.litros}::real,
        ${opts.odometroHrs}::real,
        ${opts.kmEstimado}::boolean,
        ${opts.cuentaLtInicio}::real,
        ${opts.cuentaLtFin}::real,
        ${opts.origen},
        ${opts.tipoDiesel},
        ${opts.quienSuministraId}::int,
        ${opts.quienRecibeId}::int,
        ${opts.notas},
        ${opts.registradoPorId}
      FROM upd
      RETURNING id, folio
    ),
    updu AS (
      UPDATE unidades
      SET odometro_actual = ${opts.odometroHrs}::real
      WHERE ${opts.odometroHrs}::real IS NOT NULL
        AND id = ${opts.unidadId}
        AND EXISTS (SELECT 1 FROM ins)
      RETURNING id
    )
    SELECT
      ins.id AS carga_id,
      ins.folio,
      upd.id,
      upd.nombre,
      upd.litros_actuales,
      upd.capacidad_max,
      upd.cuentalitros_actual,
      upd.ajuste_porcentaje
    FROM ins
    CROSS JOIN upd
    LEFT JOIN updu ON true
  `);

  if (rows.length === 0) {
    throw new Error("Stock insuficiente para completar la operación");
  }
  const row = rows[0];
  return {
    cargaId: num(row.carga_id),
    folio: row.folio == null ? null : num(row.folio),
    tank: mapTank(row),
  };
}

export async function deleteCargaAtomic(cargaId: number): Promise<{
  carga: Record<string, unknown>;
  tank: TankAfterMutation | null;
}> {
  const rows = asRows(await neonSql`
    WITH del AS (
      DELETE FROM cargas WHERE id = ${cargaId} RETURNING *
    ),
    upd AS (
      UPDATE tanques t
      SET
        litros_actuales = t.litros_actuales + d.litros,
        ultima_actualizacion = now()
      FROM del d
      WHERE d.tanque_id IS NOT NULL AND t.id = d.tanque_id
      RETURNING t.id, t.nombre, t.litros_actuales, t.capacidad_max, t.cuentalitros_actual, t.ajuste_porcentaje
    )
    SELECT
      to_jsonb(d) AS carga,
      to_jsonb(u) AS tanque
    FROM del d
    LEFT JOIN upd u ON true
  `);
  if (rows.length === 0) throw new Error("Carga no encontrada");
  const row = rows[0];
  const carga = (row.carga ?? {}) as Record<string, unknown>;
  const tanqueRaw = row.tanque as Record<string, unknown> | null;
  return {
    carga,
    tank: tanqueRaw ? mapTank(tanqueRaw) : null,
  };
}
