"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  tanques, fuentesDiesel, unidades, operadores, obras,
  periodos, cargas, recargasTanque, transferenciasTanque,
  rendimientos, archivos, auditLog, configuracion,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAdmin, requireManageRole } from "@/lib/authz";

// Los resets y seeds de prueba son herramientas de desarrollo: en producción solo
// funcionan si se habilitan explícitamente con ALLOW_TESTING_TOOLS=1
function assertTestingHabilitado() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TESTING_TOOLS !== "1")
    throw new Error("Herramienta de testing deshabilitada en producción");
}

// ─── Folio base configurable ──────────────────────────────────────────────────
export async function getCuentalitrosBases() {
  const [taller, nissan] = await Promise.all([
    db.query.tanques.findFirst({ where: eq(tanques.nombre, "Taller") }),
    db.query.tanques.findFirst({ where: eq(tanques.nombre, "NISSAN") }),
  ]);
  return {
    taller: taller?.cuentalitrosActual ?? 0,
    nissan: nissan?.cuentalitrosActual ?? 0,
  };
}

export async function setCuentalitros(tanqueNombre: "Taller" | "NISSAN", valor: number) {
  await requireAdmin();
  await db
    .update(tanques)
    .set({ cuentalitrosActual: valor })
    .where(eq(tanques.nombre, tanqueNombre));
  revalidatePath("/overview");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
  return { ok: true, msg: `Cuentalitros ${tanqueNombre} establecido en ${valor.toLocaleString()}` };
}

export async function getFoliosBases() {
  const [patio, campo] = await Promise.all([
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, "folio_base") }),
    db.query.configuracion.findFirst({ where: eq(configuracion.clave, "folio_base_campo") }),
  ]);
  return {
    patio: patio ? parseInt(patio.valor, 10) : 1,
    campo: campo ? parseInt(campo.valor, 10) : 1,
  };
}

export async function getFolioBase(): Promise<number> {
  const row = await db.query.configuracion.findFirst({
    where: eq(configuracion.clave, "folio_base"),
  });
  return row ? parseInt(row.valor, 10) : 1;
}

export async function setFolioBase(folio: number) {
  await requireAdmin();
  await db
    .insert(configuracion)
    .values({ clave: "folio_base", valor: String(folio) })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(folio), updatedAt: new Date() } });
  revalidatePath("/cargas/nueva");
  return { ok: true, msg: `Folio patio base establecido en ${folio}` };
}

export async function setFolioBaseCampo(folio: number) {
  await requireAdmin();
  await db
    .insert(configuracion)
    .values({ clave: "folio_base_campo", valor: String(folio) })
    .onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(folio), updatedAt: new Date() } });
  revalidatePath("/cargas/campo");
  return { ok: true, msg: `Folio campo base establecido en ${folio}` };
}

// ─── Rangos mín/máx de folio por secuencia ───────────────────────────────────
export async function getFolioRangos() {
  const claves = ["folio_min_patio", "folio_max_patio", "folio_min_campo", "folio_max_campo"] as const;
  const rows = await db.select().from(configuracion).then((r) =>
    Object.fromEntries(r.map((x) => [x.clave, x.valor]))
  );
  return {
    patioMin: rows["folio_min_patio"] ? parseInt(rows["folio_min_patio"], 10) : 0,
    patioMax: rows["folio_max_patio"] ? parseInt(rows["folio_max_patio"], 10) : 0,
    campoMin: rows["folio_min_campo"] ? parseInt(rows["folio_min_campo"], 10) : 0,
    campoMax: rows["folio_max_campo"] ? parseInt(rows["folio_max_campo"], 10) : 0,
  };
}

export async function setFolioRango(
  tipo: "patio" | "campo",
  min: number,
  max: number
) {
  await requireManageRole();
  if (min > 0 && max > 0 && min >= max)
    throw new Error("El mínimo debe ser menor al máximo");
  const claveMin = `folio_min_${tipo}`;
  const claveMax = `folio_max_${tipo}`;
  await Promise.all([
    db.insert(configuracion).values({ clave: claveMin, valor: String(Math.max(0, min)) })
      .onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(Math.max(0, min)), updatedAt: new Date() } }),
    db.insert(configuracion).values({ clave: claveMax, valor: String(Math.max(0, max)) })
      .onConflictDoUpdate({ target: configuracion.clave, set: { valor: String(Math.max(0, max)), updatedAt: new Date() } }),
  ]);
  revalidatePath("/settings");
  revalidatePath(tipo === "patio" ? "/cargas/nueva" : "/cargas/campo");
  return { ok: true, msg: `Rango folio ${tipo}: ${min || "sin límite"} – ${max || "sin límite"}` };
}

// ─── Tolerancia de rendimiento ────────────────────────────────────────────────
import { TOLERANCIA_DEFAULT } from "@/lib/alertas-config";

export async function getTolerancia(): Promise<number> {
  const row = await db.query.configuracion.findFirst({
    where: eq(configuracion.clave, "tolerancia_rendimiento"),
  });
  return row ? parseFloat(row.valor) : TOLERANCIA_DEFAULT;
}

export async function setTolerancia(porcentaje: number) {
  await requireManageRole();
  const val = Math.max(1, Math.min(100, Math.round(porcentaje)));
  const stored = (val / 100).toFixed(4);
  await db
    .insert(configuracion)
    .values({ clave: "tolerancia_rendimiento", valor: stored })
    .onConflictDoUpdate({
      target: configuracion.clave,
      set: { valor: stored, updatedAt: new Date() },
    });
  revalidatePath("/settings");
  return { ok: true, msg: `Tolerancia establecida en ±${val}%` };
}

// ─── Configuración de alertas ─────────────────────────────────────────────────
import { ALERTA_RENDIMIENTO_DIAS_DEFAULT } from "@/lib/alertas-config";

export async function getAlertaDias(): Promise<number> {
  const row = await db.query.configuracion.findFirst({
    where: eq(configuracion.clave, "alerta_rendimiento_dias"),
  });
  return row ? parseInt(row.valor, 10) : ALERTA_RENDIMIENTO_DIAS_DEFAULT;
}

export async function setAlertaDias(dias: number) {
  await requireManageRole();
  const val = Math.max(1, Math.min(365, Math.round(dias)));
  await db
    .insert(configuracion)
    .values({ clave: "alerta_rendimiento_dias", valor: String(val) })
    .onConflictDoUpdate({
      target: configuracion.clave,
      set: { valor: String(val), updatedAt: new Date() },
    });
  revalidatePath("/overview");
  revalidatePath("/settings");
  return { ok: true, msg: `Alertas expirarán después de ${val} días` };
}

// Seed inicial — ejecutar una sola vez al configurar el sistema
// Inserta tanques y fuentes de diesel base si no existen
export async function seedInicial() {
  await requireManageRole();
  const tanquesExistentes = await db.select().from(tanques);

  if (tanquesExistentes.length === 0) {
    await db.insert(tanques).values([
      {
        nombre: "Taller",
        capacidadMax: 10000,
        litrosActuales: 0,
        cuentalitrosActual: 0,
        ajustePorcentaje: 2,
      },
      {
        nombre: "NISSAN",
        capacidadMax: 1200,
        litrosActuales: 0,
        cuentalitrosActual: 0,
        ajustePorcentaje: 2,
      },
    ]);
  }

  const fuentesExistentes = await db.select().from(fuentesDiesel);

  if (fuentesExistentes.length === 0) {
    await db.insert(fuentesDiesel).values([
      { nombre: "Taller",  tipo: "taller",  descripcion: "Bomba en patio con cuentalitros" },
      { nombre: "NISSAN",  tipo: "nissan",  descripcion: "Camión NISSAN distribución en campo" },
      { nombre: "Amigo",   tipo: "externo", descripcion: "Préstamo diesel fuente externa (verde)" },
      { nombre: "OxxoGas", tipo: "externo", descripcion: "Carga en OxxoGas (rojo)" },
    ]);
  }

  return { ok: true, msg: "Tanques y fuentes listos" };
}

// Importar catálogo de unidades desde el Excel analizado
export async function seedUnidadesWB() {
  await requireManageRole();
  const existentes = await db.select().from(unidades);
  if (existentes.length > 0) return { ok: true, msg: "Ya hay unidades registradas", insertadas: 0 };

  const camiones = [
    "CA06","CA07","CA08","CA12","CA13","CA15","CA16","CA17",
    "CA18","CA19","CA20","CA21","CA22","CA25","CA26","CA27",
    "CA28","CA29","CA30","CA31","CA32","CA33","CA34",
  ];

  const maquinas = [
    { codigo: "EX01",        nombre: "EX01 35G",             modelo: "35G" },
    { codigo: "EX02",        nombre: "EX02 Komatsu PC88",    modelo: "Komatsu PC88" },
    { codigo: "EX03",        nombre: "EX03 CAT308ER",        modelo: "CAT 308ER" },
    { codigo: "EX09",        nombre: "EX09",                 modelo: null },
    { codigo: "EX12",        nombre: "EX12 50D",             modelo: "50D" },
    { codigo: "EX13",        nombre: "EX13 Komatsu PC210",   modelo: "Komatsu PC210" },
    { codigo: "EX14",        nombre: "EX14 Komatsu PC200",   modelo: "Komatsu PC200" },
    { codigo: "R02",         nombre: "R02 WB140",            modelo: "WB140" },
    { codigo: "R03",         nombre: "R03 JCB",              modelo: "JCB" },
    { codigo: "R04",         nombre: "R04 NH80cx",           modelo: "NH80cx" },
    { codigo: "RO07",        nombre: "Rodillo RO07",         modelo: null },
    { codigo: "MINI02",      nombre: "MINI02 CAT 236D",      modelo: "CAT 236D" },
    { codigo: "M03",         nombre: "M03 Komatsu",          modelo: "Komatsu" },
    { codigo: "RODILLON",    nombre: "Rodillón BOMAG",       modelo: "BOMAG" },
    { codigo: "PLANTA_LUZ",  nombre: "Planta de Luz Azul",   modelo: null },
  ];

  const vals: typeof unidades.$inferInsert[] = [
    // NISSAN
    {
      codigo: "NISSAN",
      nombre: "NISSAN Distribución",
      tipo: "nissan",
      modelo: "NISSAN",
      capacidadTanque: 1200,
    },
    // Camiones
    ...camiones.map((c) => ({
      codigo: c,
      nombre: c,
      tipo: "camion" as const,
    })),
    // Maquinaria
    ...maquinas.map((m) => ({
      codigo: m.codigo,
      nombre: m.nombre,
      tipo: "maquina" as const,
      modelo: m.modelo ?? undefined,
    })),
  ];

  await db.insert(unidades).values(vals).onConflictDoNothing();
  return { ok: true, msg: `${vals.length} unidades importadas`, insertadas: vals.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET OPERACIONAL — borra datos de operación, mantiene catálogos
// Elimina: cargas, períodos, rendimientos, recargas, transferencias
// Conserva: unidades, operadores, obras — tanques quedan en 0 L
// ─────────────────────────────────────────────────────────────────────────────
export async function resetOperacional() {
  const { userId } = await requireAdmin();
  assertTestingHabilitado();

  // El audit_log NUNCA se borra: es la única evidencia ante incidentes
  const tanquesAntes = await db.select().from(tanques);
  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "reset_operacional",
    entidad: "sistema",
    datosJson: JSON.stringify({
      tanquesAntes: tanquesAntes.map((t) => ({
        nombre: t.nombre, litros: t.litrosActuales, cuentalitros: t.cuentalitrosActual,
      })),
    }),
  });

  // SQL directo para evitar restricciones del ORM en deletes sin WHERE
  await db.execute(sql`DELETE FROM archivos`);
  await db.execute(sql`DELETE FROM rendimientos`);
  await db.execute(sql`DELETE FROM cargas`);
  await db.execute(sql`DELETE FROM periodos`);
  await db.execute(sql`DELETE FROM transferencias_tanque`);
  await db.execute(sql`DELETE FROM recargas_tanque`);
  await db.execute(sql`UPDATE tanques SET litros_actuales = 0, cuentalitros_actual = 0`);
  revalidatePath("/overview");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
  return { ok: true, msg: "Reset operacional completado. Catálogos y configuración intactos." };
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET TOTAL — borra absolutamente todo y vuelve a sembrar base
// ─────────────────────────────────────────────────────────────────────────────
export async function resetTotal() {
  const { userId } = await requireAdmin();
  assertTestingHabilitado();

  // El audit_log NUNCA se borra: es la única evidencia ante incidentes
  const tanquesAntes = await db.select().from(tanques);
  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "reset_total",
    entidad: "sistema",
    datosJson: JSON.stringify({
      tanquesAntes: tanquesAntes.map((t) => ({
        nombre: t.nombre, litros: t.litrosActuales, cuentalitros: t.cuentalitrosActual,
      })),
    }),
  });

  await db.execute(sql`DELETE FROM archivos`);
  await db.execute(sql`DELETE FROM rendimientos`);
  await db.execute(sql`DELETE FROM cargas`);
  await db.execute(sql`DELETE FROM periodos`);
  await db.execute(sql`DELETE FROM transferencias_tanque`);
  await db.execute(sql`DELETE FROM recargas_tanque`);
  await db.execute(sql`DELETE FROM operadores`);
  await db.execute(sql`DELETE FROM obras`);
  await db.execute(sql`DELETE FROM unidades`);
  await db.execute(sql`DELETE FROM fuentes_diesel`);
  await db.execute(sql`DELETE FROM tanques`);
  await db.execute(sql`DELETE FROM configuracion`);
  // Re-sembrar configuración base
  await seedInicial();
  revalidatePath("/overview");
  revalidatePath("/cargas/nueva");
  revalidatePath("/cargas/campo");
  return { ok: true, msg: "Reset total completado. Sistema listo para configuración inicial." };
}

// ─────────────────────────────────────────────────────────────────────────────
// AJUSTAR STOCK TANQUES — set niveles específicos para probar alertas
// ─────────────────────────────────────────────────────────────────────────────
function validarAjuste(litros: number, motivo: string) {
  if (!Number.isFinite(litros) || litros < 0)
    throw new Error("Los litros deben ser un número válido mayor o igual a 0");
  if (!motivo?.trim())
    throw new Error("El motivo del ajuste es obligatorio");
  return motivo.trim();
}

export async function ajustarStockTanques(litrosTaller: number, litrosNissan: number, motivo: string) {
  const { userId } = await requireAdmin();
  const motivoLimpio = validarAjuste(litrosTaller, motivo);
  validarAjuste(litrosNissan, motivo);

  const [tallerRow] = await db
    .select({ id: tanques.id, litrosActuales: tanques.litrosActuales })
    .from(tanques).where(eq(tanques.nombre, "Taller"));
  const [nissanRow] = await db
    .select({ id: tanques.id, litrosActuales: tanques.litrosActuales })
    .from(tanques).where(eq(tanques.nombre, "NISSAN"));

  await db.insert(auditLog).values([
    {
      usuarioId: userId,
      accion: "ajuste_stock",
      entidad: "tanques",
      entidadId: String(tallerRow?.id ?? ""),
      datosJson: JSON.stringify({ tanque: "Taller", antes: tallerRow?.litrosActuales, despues: litrosTaller, motivo: motivoLimpio }),
    },
    {
      usuarioId: userId,
      accion: "ajuste_stock",
      entidad: "tanques",
      entidadId: String(nissanRow?.id ?? ""),
      datosJson: JSON.stringify({ tanque: "NISSAN", antes: nissanRow?.litrosActuales, despues: litrosNissan, motivo: motivoLimpio }),
    },
  ]);

  await db.execute(sql`UPDATE tanques SET litros_actuales = ${litrosTaller} WHERE nombre = 'Taller'`);
  await db.execute(sql`UPDATE tanques SET litros_actuales = ${litrosNissan} WHERE nombre = 'NISSAN'`);
  revalidatePath("/overview");
  return { ok: true, msg: `Taller: ${litrosTaller} L | NISSAN: ${litrosNissan} L` };
}

export async function ajustarStockTanque(nombre: "Taller" | "NISSAN", litros: number, motivo: string) {
  const { userId } = await requireAdmin();
  const motivoLimpio = validarAjuste(litros, motivo);

  const [tanqueRow] = await db
    .select({ id: tanques.id, litrosActuales: tanques.litrosActuales })
    .from(tanques).where(eq(tanques.nombre, nombre));

  await db.insert(auditLog).values({
    usuarioId: userId,
    accion: "ajuste_stock",
    entidad: "tanques",
    entidadId: String(tanqueRow?.id ?? ""),
    datosJson: JSON.stringify({ tanque: nombre, antes: tanqueRow?.litrosActuales, despues: litros, motivo: motivoLimpio }),
  });

  await db.execute(sql`UPDATE tanques SET litros_actuales = ${litros} WHERE nombre = ${nombre}`);
  revalidatePath("/overview");
  return { ok: true, msg: `${nombre}: ${litros} L` };
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATOS DE PRUEBA — genera cargas realistas para los últimos 14 días
// Requiere que existan unidades (corre seedUnidadesWB si no hay)
// ─────────────────────────────────────────────────────────────────────────────
export async function seedDatosPrueba() {
  await requireAdmin();
  assertTestingHabilitado();
  // Garantizar que haya unidades
  const unidadesExistentes = await db.select().from(unidades);
  if (unidadesExistentes.length === 0) await seedUnidadesWB();

  // Garantizar tanques
  const tanquesExistentes = await db.select().from(tanques);
  if (tanquesExistentes.length === 0) await seedInicial();

  const todasUnidades = await db.select().from(unidades).where(eq(unidades.activo, true));
  const tanquesData = await db.select().from(tanques);
  const tanqueTaller = tanquesData.find((t) => t.nombre === "Taller");
  const tanqueNissan = tanquesData.find((t) => t.nombre === "NISSAN");

  if (!tanqueTaller || !tanqueNissan) throw new Error("Configura los tanques primero (Seed Inicial)");

  // Crear 2 operadores de prueba si no hay
  const opsExistentes = await db.select().from(operadores);
  let opIds: number[] = opsExistentes.map((o) => o.id);
  if (opIds.length === 0) {
    const inserted = await db.insert(operadores).values([
      { nombre: "Juan Pérez (test)", tipo: "chofer" },
      { nombre: "Carlos López (test)", tipo: "maquinista" },
      { nombre: "Miguel Torres (test)", tipo: "chofer" },
    ]).returning({ id: operadores.id });
    opIds = inserted.map((o) => o.id);
  }

  // Crear período actual si no hay
  const hoy = new Date();
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const toISO = (d: Date) => d.toISOString().split("T")[0];

  const periodoExistente = await db.select().from(periodos).limit(1);
  let periodoId: number;
  if (periodoExistente.length === 0) {
    const [p] = await db.insert(periodos).values({
      nombre: `Prueba ${toISO(lunes)} al ${toISO(domingo)}`,
      fechaInicio: toISO(lunes),
      fechaFin: toISO(domingo),
    }).returning({ id: periodos.id });
    periodoId = p.id;
  } else {
    periodoId = periodoExistente[0].id;
  }

  // Recargar tanques con stock de prueba
  await db.update(tanques).set({ litrosActuales: 6500 }).where(eq(tanques.id, tanqueTaller.id));
  await db.update(tanques).set({ litrosActuales: 450 }).where(eq(tanques.id, tanqueNissan.id));

  await db.insert(recargasTanque).values({
    fecha: toISO(new Date(hoy.getTime() - 3 * 86400000)),
    litros: 7000,
    proveedor: "PEMEX (test)",
    precioLitro: 24.50,
    tanqueId: tanqueTaller.id,
  });

  // Generar 30 cargas de patio (camiones) y 12 de campo (máquinas)
  const camiones = todasUnidades.filter((u) => u.tipo === "camion").slice(0, 8);
  const maquinas = todasUnidades.filter((u) => u.tipo === "maquina").slice(0, 5);

  const cargasVals: typeof cargas.$inferInsert[] = [];

  // Cargas patio — últimos 14 días
  for (let d = 13; d >= 0; d--) {
    const fecha = new Date(hoy.getTime() - d * 86400000);
    const fechaStr = toISO(fecha);
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 cargas por día
    for (let i = 0; i < count && i < camiones.length; i++) {
      const u = camiones[(d + i) % camiones.length];
      const litros = Math.round((Math.random() * 200 + 100) * 2) / 2; // 100-300 L
      cargasVals.push({
        fecha: fechaStr,
        periodoId,
        unidadId: u.id,
        operadorId: opIds[i % opIds.length],
        litros,
        origen: "patio",
        tanqueId: tanqueTaller.id,
        tipoDiesel: "normal",
        odometroHrs: Math.round(Math.random() * 5000 + 10000),
      });
    }
  }

  // Cargas campo — últimos 10 días
  for (let d = 9; d >= 0; d--) {
    const fecha = new Date(hoy.getTime() - d * 86400000);
    const fechaStr = toISO(fecha);
    if (Math.random() > 0.4 && maquinas.length > 0) {
      const u = maquinas[d % maquinas.length];
      const litros = Math.round((Math.random() * 80 + 40) * 2) / 2; // 40-120 L
      cargasVals.push({
        fecha: fechaStr,
        periodoId,
        unidadId: u.id,
        operadorId: opIds[d % opIds.length],
        litros,
        origen: "campo",
        tanqueId: tanqueNissan.id,
        tipoDiesel: "normal",
        odometroHrs: Math.round(Math.random() * 3000 + 2000),
      });
    }
  }

  if (cargasVals.length > 0) {
    await db.insert(cargas).values(cargasVals);
  }

  const totalLitros = cargasVals.reduce((s, c) => s + (c.litros as number), 0);
  return {
    ok: true,
    msg: `${cargasVals.length} cargas de prueba generadas (${Math.round(totalLitros)} L total). Stock: Taller 6,500 L | NISSAN 450 L`,
  };
}
