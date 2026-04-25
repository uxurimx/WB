import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { periodos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCargas } from "@/app/actions/cargas";
import { getRendimientosPeriodo } from "@/app/actions/rendimientos";
import * as XLSX from "xlsx";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ periodoId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { periodoId } = await params;
  const id = parseInt(periodoId);
  if (isNaN(id)) return new Response("Invalid id", { status: 400 });

  // Filtro por unidades (opcional)
  const url = new URL(req.url);
  const unidadesParam = url.searchParams.get("unidades");
  const unidadIdsFilter = unidadesParam
    ? new Set(unidadesParam.split(",").map(Number).filter(Boolean))
    : null;

  const [periodo, { rows: cargasAll }, rendsAll] = await Promise.all([
    db.query.periodos.findFirst({ where: eq(periodos.id, id) }),
    getCargas({ periodoId: id, limit: 5000 }),
    getRendimientosPeriodo(id),
  ]);

  if (!periodo) return new Response("Período no encontrado", { status: 404 });

  const cargasData = unidadIdsFilter
    ? cargasAll.filter((c) => unidadIdsFilter.has(c.unidadId))
    : cargasAll;

  const rends = unidadIdsFilter
    ? rendsAll.filter((r) => unidadIdsFilter.has(r.unidadId))
    : rendsAll;

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumen ──────────────────────────────────────
  const totalLitros = cargasData.reduce((s, c) => s + (c.litros ?? 0), 0);
  const unidadesDistintas = new Set(cargasData.map((c) => c.unidadId)).size;

  const resumenRows = [
    ["WB Diesel Control — Reporte de Período"],
    [],
    ["Período:", periodo.nombre],
    ["Inicio:", periodo.fechaInicio],
    ["Fin:", periodo.fechaFin],
    ["Estado:", periodo.cerrado ? "Cerrado" : "Activo"],
    ...(unidadIdsFilter ? [["Filtro:", `${unidadIdsFilter.size} unidades seleccionadas`]] : []),
    [],
    ["Total cargas:", cargasData.length],
    ["Litros totales:", totalLitros],
    ["Unidades distintas:", unidadesDistintas],
    ["Rendimientos calculados:", rends.length],
    [],
    ["Generado:", new Date().toLocaleString("es-MX")],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenRows);
  wsResumen["!cols"] = [{ wch: 25 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // ── Sheet 2: Cargas ───────────────────────────────────────
  const cargasHeaders = [
    "Folio", "Fecha", "Hora", "Unidad", "Operador", "Obra",
    "Litros", "Origen", "Tipo Diesel", "Odómetro / Hrs", "Notas",
  ];

  const cargasRows = cargasData.map((c) => [
    c.folio ?? "",
    c.fecha,
    c.hora ? c.hora.slice(0, 5) : "",
    c.unidad?.codigo ?? `#${c.unidadId}`,
    c.operador?.nombre ?? "",
    (c as { obra?: { nombre: string } | null }).obra?.nombre ?? "",
    c.litros,
    c.origen,
    c.tipoDiesel ?? "normal",
    c.odometroHrs ?? "",
    c.notas ?? "",
  ]);

  const wsCargas = XLSX.utils.aoa_to_sheet([cargasHeaders, ...cargasRows]);
  wsCargas["!cols"] = [
    { wch: 8 }, { wch: 12 }, { wch: 7 }, { wch: 10 },
    { wch: 20 }, { wch: 20 }, { wch: 9 }, { wch: 8 },
    { wch: 12 }, { wch: 14 }, { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsCargas, "Cargas");

  // ── Sheet 3: Rendimientos ────────────────────────────────
  if (rends.length > 0) {
    const rendHeaders = [
      "Unidad", "Tipo", "Litros Consumidos", "Km Recorridos / Hrs Trabajadas",
      "Rendimiento Actual", "Referencia", "Diferencia", "Dentro Tolerancia (±20%)",
    ];

    const rendRows = rends.map((r) => {
      const tipo = r.unidad?.tipo ?? "otro";
      const unidad_km = tipo === "camion" ? "km/L" : "L/Hr";
      return [
        r.unidad?.codigo ?? `#${r.unidadId}`,
        tipo === "camion" ? "Camión" : "Maquinaria",
        r.litrosConsumidos ?? 0,
        r.kmHrsRecorridos ?? "",
        r.rendimientoActual !== null ? `${r.rendimientoActual?.toFixed(2)} ${unidad_km}` : "",
        r.rendimientoReferencia !== null ? `${r.rendimientoReferencia?.toFixed(2)} ${unidad_km}` : "",
        r.diferencia !== null ? r.diferencia.toFixed(2) : "",
        r.dentroDeTolerancia === true ? "Sí" : r.dentroDeTolerancia === false ? "No" : "Sin datos",
      ];
    });

    const wsRend = XLSX.utils.aoa_to_sheet([rendHeaders, ...rendRows]);
    wsRend["!cols"] = [
      { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 30 },
      { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, wsRend, "Rendimientos");
  }

  // ── Serializar y devolver ─────────────────────────────────
  const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const body = new Uint8Array(buf);

  const suffix = unidadIdsFilter ? `-filtrado` : "";
  const filename = `reporte-${periodo.fechaInicio}-${periodo.fechaFin}${suffix}.xlsx`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
