import { NextResponse } from "next/server";
import { conciliarTanques, registrarConciliacionAlertas } from "@/lib/conciliacion";

// Cron diario (ver vercel.json). Vercel manda Authorization: Bearer CRON_SECRET.
// Sin CRON_SECRET configurado, el endpoint queda cerrado por completo.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultados = await conciliarTanques();
  const divergentes = resultados.filter((r) => !r.ok);
  await registrarConciliacionAlertas(divergentes);

  return NextResponse.json({
    ok: true,
    divergencias: divergentes.length,
    resultados,
  });
}
