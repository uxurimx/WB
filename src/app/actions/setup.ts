"use server";

import { db } from "@/db";
import { tanques, fuentesDiesel, unidades, operadores } from "@/db/schema";

// Seed inicial — ejecutar una sola vez al configurar el sistema
// Inserta tanques y fuentes de diesel base si no existen
export async function seedInicial() {
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
