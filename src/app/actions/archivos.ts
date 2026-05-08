"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { archivos, cargas } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getArchivosUnidad(unidadId: number) {
  const rows = await db
    .select({
      id:         archivos.id,
      url:        archivos.url,
      tipo:       archivos.tipo,
      createdAt:  archivos.createdAt,
      cargaId:    archivos.cargaId,
      cargaFecha: cargas.fecha,
      cargaFolio: cargas.folio,
      cargaHora:  cargas.hora,
      cargaOrigen: cargas.origen,
    })
    .from(archivos)
    .innerJoin(cargas, eq(archivos.cargaId, cargas.id))
    .where(eq(cargas.unidadId, unidadId))
    .orderBy(desc(cargas.fecha), desc(archivos.createdAt));
  return rows;
}

export async function saveArchivoFoto(
  cargaId: number,
  url: string,
  key: string,
  tipo: "odometroFoto" | "notaFoto" = "odometroFoto"
) {
  const { userId } = await auth();
  if (!userId) throw new Error("No autenticado");
  await db.insert(archivos).values({
    url,
    key,
    nombre: `${tipo}-${cargaId}`,
    tipo,
    cargaId,
    subidoPorId: userId,
  });
}
