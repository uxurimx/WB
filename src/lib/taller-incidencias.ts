export const TALLER_FALLAS = [
  "Motor",
  "Transmisión",
  "Sistema eléctrico",
  "Frenos",
  "Dirección",
  "Suspensión",
  "Sistema hidráulico",
  "Llantas",
  "Fuga de aceite o combustible",
  "Focos",
  "Espejos",
  "Otro",
] as const;

export const TALLER_CATEGORIAS = [
  { value: "preventivo", label: "Preventivo" },
  { value: "correctivo", label: "Correctivo" },
  { value: "otro", label: "Otro" },
  { value: "urea", label: "Urea" },
  { value: "llanta_danada", label: "Llanta dañada" },
] as const;

export type CategoriaTaller = typeof TALLER_CATEGORIAS[number]["value"];
export const CATEGORIAS_SIN_TALLER = ["urea", "llanta_danada"] as const;

export function etiquetaCategoriaTaller(value: string | null | undefined) {
  const legacy: Record<string, string> = {
    mecanica: "Correctivo",
    electrica: "Correctivo",
    hidraulica: "Correctivo",
    llantas: "Llanta dañada",
    frenos: "Correctivo",
  };
  return TALLER_CATEGORIAS.find((categoria) => categoria.value === value)?.label ?? legacy[value ?? ""] ?? "Otro";
}

export function formatoFolioTaller(folio: number | null | undefined) {
  return folio == null ? "—" : `WB-${String(folio).padStart(5, "0")}`;
}
