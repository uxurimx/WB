export type FolioDisplayOrigen = string;

export function formatFolioNumber(folio: number | null | undefined, serieCodigo?: string | null) {
  if (folio == null) return "—";
  if (!serieCodigo || serieCodigo.toUpperCase() === "BASE") return String(folio);
  return `${serieCodigo}${folio}`;
}

export function formatCargaFolio(
  folio: number | null | undefined,
  serieCodigo: string | null | undefined,
  origen: FolioDisplayOrigen,
) {
  if (folio == null) return "—";
  if (origen === "externo") return `E-${folio}`;
  return formatFolioNumber(folio, serieCodigo);
}

export function formatTransferenciaFolio(folio: number | null | undefined, serieCodigo?: string | null) {
  if (folio == null) return "—";
  return `T-${formatFolioNumber(folio, serieCodigo)}`;
}
