const MARKER = "[[ACTIVIDADES_TALLER_V1]]";

export type ActividadTaller = { atendio: string; trabajo: string };

export function parseActividadesTaller(value: string | null | undefined, fallbackAtendio = ""): ActividadTaller[] {
  if (!value?.trim()) return [];
  if (value.startsWith(MARKER)) {
    try {
      const rows = JSON.parse(value.slice(MARKER.length)) as ActividadTaller[];
      return rows.filter((row) => row && (row.trabajo?.trim() || row.atendio?.trim())).map((row) => ({ atendio: row.atendio?.trim() ?? "", trabajo: row.trabajo?.trim() ?? "" }));
    } catch { return []; }
  }
  return value.split(/\r?\n/).map((trabajo) => trabajo.trim()).filter(Boolean).map((trabajo) => ({ atendio: fallbackAtendio, trabajo }));
}

export function serializeActividadesTaller(rows: ActividadTaller[]): string {
  const clean = rows.map((row) => ({ atendio: row.atendio.trim(), trabajo: row.trabajo.trim() })).filter((row) => row.atendio || row.trabajo);
  return clean.length ? `${MARKER}${JSON.stringify(clean)}` : "";
}

export function textoActividadesTaller(value: string | null | undefined, fallbackAtendio = ""): string {
  return parseActividadesTaller(value, fallbackAtendio).map(({ atendio, trabajo }) => [atendio, trabajo].filter(Boolean).join(": ")).join(", ");
}
