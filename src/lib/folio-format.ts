export type FolioDisplayOrigen = string;

export function formatFolioDigits(folio: number | null | undefined, folioDigitos = 0) {
  if (folio == null) return "";
  return String(folio).padStart(Math.max(0, Math.min(5, folioDigitos)), "0");
}

export function formatFolioNumber(folio: number | null | undefined, serieCodigo?: string | null, folioDigitos = 0) {
  if (folio == null) return "—";
  const digits = formatFolioDigits(folio, folioDigitos);
  if (!serieCodigo || serieCodigo.toUpperCase() === "BASE") return digits;
  return `${serieCodigo}${digits}`;
}

export function formatCargaFolio(
  folio: number | null | undefined,
  serieCodigo: string | null | undefined,
  origen: FolioDisplayOrigen,
  folioDigitos = 0,
) {
  if (folio == null) return "—";
  if (origen === "externo") return `E-${folio}`;
  return formatFolioNumber(folio, serieCodigo, folioDigitos);
}

export function formatTransferenciaFolio(folio: number | null | undefined, serieCodigo?: string | null, folioDigitos = 0) {
  if (folio == null) return "—";
  return `T-${formatFolioNumber(folio, serieCodigo, folioDigitos)}`;
}
