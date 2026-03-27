"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { cargas, unidades, operadores, obras } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getOrCreatePeriodoActual } from "./periodos";

export type ImportRow = {
  fecha: string;          // "YYYY-MM-DD"
  hora?: string;          // "HH:MM"
  folio?: number;
  unidadCodigo: string;
  operadorNombre?: string;
  obraNombre?: string;
  litros: number;
  origen: "patio" | "campo";
  tipoDiesel?: string;
  odometroHrs?: number;
};

export type ImportResult = {
  importadas: number;
  omitidas: number;
  creadasUnidades: number;
  creadasOperadores: number;
  errores: { fila: number; error: string }[];
};

function guessUnidadTipo(codigo: string): string {
  const c = codigo.toUpperCase();
  if (c.startsWith("CA")) return "camion";
  if (c.startsWith("EX")) return "maquina";
  if (c.startsWith("R0") || c.startsWith("RO")) return "maquina";
  if (c.startsWith("MINI")) return "maquina";
  if (c.startsWith("M0") || c.startsWith("M03")) return "maquina";
  if (c.startsWith("RODILLO") || c.startsWith("BOMAG")) return "maquina";
  if (c.startsWith("PLANTA") || c.startsWith("GENERA")) return "otro";
  if (c === "NISSAN") return "nissan";
  return "otro";
}

export async function importarCargas(rows: ImportRow[]): Promise<ImportResult> {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");

  const result: ImportResult = {
    importadas: 0,
    omitidas: 0,
    creadasUnidades: 0,
    creadasOperadores: 0,
    errores: [],
  };

  if (rows.length === 0) return result;

  // ── 1. Pre-load lookups ───────────────────────────────────
  const [existingUnidades, existingOperadores, existingObras] = await Promise.all([
    db.select({ id: unidades.id, codigo: unidades.codigo }).from(unidades),
    db.select({ id: operadores.id, nombre: operadores.nombre }).from(operadores),
    db.select({ id: obras.id, nombre: obras.nombre }).from(obras),
  ]);

  const unidadMap = new Map<string, number>(
    existingUnidades.map((u) => [u.codigo.toUpperCase(), u.id])
  );
  const operadorMap = new Map<string, number>(
    existingOperadores.map((o) => [o.nombre.toLowerCase().trim(), o.id])
  );
  const obraMap = new Map<string, number>(
    existingObras.map((o) => [o.nombre.toLowerCase().trim(), o.id])
  );

  // ── 2. Create missing unidades ────────────────────────────
  const codigosNuevos = [
    ...new Set(
      rows
        .map((r) => r.unidadCodigo.toUpperCase())
        .filter((c) => c && !unidadMap.has(c))
    ),
  ];
  if (codigosNuevos.length > 0) {
    const nuevasUnidades = await db
      .insert(unidades)
      .values(
        codigosNuevos.map((codigo) => ({
          codigo,
          nombre: codigo,
          tipo: guessUnidadTipo(codigo),
        }))
      )
      .onConflictDoNothing()
      .returning({ id: unidades.id, codigo: unidades.codigo });
    for (const u of nuevasUnidades) {
      unidadMap.set(u.codigo.toUpperCase(), u.id);
    }
    result.creadasUnidades = nuevasUnidades.length;
  }

  // ── 3. Create missing operadores ──────────────────────────
  const nombresNuevos = [
    ...new Set(
      rows
        .filter((r) => r.operadorNombre?.trim())
        .map((r) => r.operadorNombre!.trim())
        .filter((n) => !operadorMap.has(n.toLowerCase()))
    ),
  ];
  if (nombresNuevos.length > 0) {
    const nuevosOps = await db
      .insert(operadores)
      .values(nombresNuevos.map((nombre) => ({ nombre })))
      .onConflictDoNothing()
      .returning({ id: operadores.id, nombre: operadores.nombre });
    for (const o of nuevosOps) {
      operadorMap.set(o.nombre.toLowerCase().trim(), o.id);
    }
    result.creadasOperadores = nuevosOps.length;
  }

  // ── 4. Create missing obras ───────────────────────────────
  const obrasNuevas = [
    ...new Set(
      rows
        .filter((r) => r.obraNombre?.trim())
        .map((r) => r.obraNombre!.trim())
        .filter((n) => !obraMap.has(n.toLowerCase()))
    ),
  ];
  if (obrasNuevas.length > 0) {
    const nuevasObras = await db
      .insert(obras)
      .values(obrasNuevas.map((nombre) => ({ nombre })))
      .onConflictDoNothing()
      .returning({ id: obras.id, nombre: obras.nombre });
    for (const o of nuevasObras) {
      obraMap.set(o.nombre.toLowerCase().trim(), o.id);
    }
  }

  // ── 5. Load existing cargas for dedup ─────────────────────
  // Key: "folio_fecha_origen" or "nofol_fecha_unidadId_litros"
  const existingCargas = await db
    .select({ folio: cargas.folio, fecha: cargas.fecha, origen: cargas.origen })
    .from(cargas);
  const existingSet = new Set(
    existingCargas.map((c) => `${c.folio ?? "x"}_${c.fecha}_${c.origen}`)
  );

  // ── 6. Period cache ───────────────────────────────────────
  const periodoCache = new Map<string, number>();

  async function getPeriodoId(fecha: string): Promise<number> {
    if (periodoCache.has(fecha)) return periodoCache.get(fecha)!;
    const p = await getOrCreatePeriodoActual(new Date(fecha + "T12:00:00"));
    periodoCache.set(fecha, p.id);
    return p.id;
  }

  // ── 7. Process rows ───────────────────────────────────────
  const toInsert: typeof cargas.$inferInsert[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const unidadId = unidadMap.get(row.unidadCodigo.toUpperCase());
      if (!unidadId) {
        result.errores.push({ fila: i + 2, error: `Unidad "${row.unidadCodigo}" no encontrada` });
        continue;
      }

      if (!row.litros || row.litros <= 0) {
        result.errores.push({ fila: i + 2, error: "Litros inválidos" });
        continue;
      }

      // Dedup check
      const dupKey = `${row.folio ?? "x"}_${row.fecha}_${row.origen}`;
      if (existingSet.has(dupKey)) {
        result.omitidas++;
        continue;
      }
      existingSet.add(dupKey); // Prevent double-insertion within batch

      const periodoId = await getPeriodoId(row.fecha);
      const operadorId = row.operadorNombre
        ? (operadorMap.get(row.operadorNombre.toLowerCase().trim()) ?? null)
        : null;
      const obraId = row.obraNombre
        ? (obraMap.get(row.obraNombre.toLowerCase().trim()) ?? null)
        : null;

      toInsert.push({
        fecha: row.fecha,
        hora: row.hora ?? null,
        folio: row.folio ?? null,
        periodoId,
        unidadId,
        operadorId,
        obraId,
        litros: row.litros,
        odometroHrs: row.odometroHrs ?? null,
        origen: row.origen,
        tipoDiesel: row.tipoDiesel ?? "normal",
        registradoPorId: userId,
      });
    } catch (err) {
      result.errores.push({
        fila: i + 2,
        error: err instanceof Error ? err.message : "Error desconocido",
      });
    }
  }

  // ── 8. Bulk insert in batches of 500 ──────────────────────
  const BATCH = 500;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const batch = toInsert.slice(i, i + BATCH);
    await db.insert(cargas).values(batch);
    result.importadas += batch.length;
  }

  return result;
}
