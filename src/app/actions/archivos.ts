"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { archivos } from "@/db/schema";

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
