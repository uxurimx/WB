const MARKER = "[[ACTIVIDADES_TALLER_V1]]";

export type ActividadTaller = {
  atendio: string;
  trabajo: string;
  mecanicoOtro?: string;
  proveedorExterno?: string;
};

export function nombresAtiendeActividadTaller(actividad: ActividadTaller) {
  return actividad.atendio.split(",").map((nombre) => nombre.trim()).filter(Boolean).map((nombre) => {
    if (nombre === "Otro") return actividad.mecanicoOtro?.trim() || "Otro";
    if (nombre === "Externo") {
      const proveedor = actividad.proveedorExterno?.trim();
      return proveedor ? `Externo: ${proveedor}` : nombre;
    }
    return nombre;
  }).join(", ");
}

export function parseActividadesTaller(value: string | null | undefined, fallbackAtendio = ""): ActividadTaller[] {
  if (!value?.trim()) return [];
  if (value.startsWith(MARKER)) {
    try {
      const rows = JSON.parse(value.slice(MARKER.length)) as ActividadTaller[];
      return rows.filter((row) => row && (row.trabajo?.trim() || row.atendio?.trim())).map((row) => ({
        atendio: row.atendio?.trim() ?? "",
        trabajo: row.trabajo?.trim() ?? "",
        mecanicoOtro: row.mecanicoOtro?.trim() ?? "",
        proveedorExterno: row.proveedorExterno?.trim() ?? "",
      }));
    } catch { return []; }
  }
  return value.split(/\r?\n/).map((trabajo) => trabajo.trim()).filter(Boolean).map((trabajo) => ({ atendio: fallbackAtendio, trabajo }));
}

export function serializeActividadesTaller(rows: ActividadTaller[]): string {
  const clean = rows.map((row) => ({
    atendio: row.atendio.trim(),
    trabajo: row.trabajo.trim(),
    ...(row.mecanicoOtro?.trim() ? { mecanicoOtro: row.mecanicoOtro.trim() } : {}),
    ...(row.proveedorExterno?.trim() ? { proveedorExterno: row.proveedorExterno.trim() } : {}),
  })).filter((row) => row.atendio || row.trabajo);
  return clean.length ? `${MARKER}${JSON.stringify(clean)}` : "";
}

export function textoActividadesTaller(value: string | null | undefined, fallbackAtendio = ""): string {
  return parseActividadesTaller(value, fallbackAtendio).map((actividad) => [nombresAtiendeActividadTaller(actividad), actividad.trabajo].filter(Boolean).join(": ")).join(", ");
}
