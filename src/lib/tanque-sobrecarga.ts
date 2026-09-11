export type MotivoSobrecarga = "delete_carga" | "update_carga" | "otro";

export type SobrecargaTanque = {
  tanqueId: number;
  tanqueNombre: string;
  litros: number;
  capacidadMax: number;
  exceso: number;
  motivo: MotivoSobrecarga;
  detalle: string;
};

export const TEXTO_SOBRECARGA =
  "Se devolvieron litros al borrar o corregir una carga con el tanque ya lleno. El sistema no recorta para no perder diesel. Despacha o ajusta el stock cuando puedas.";

export function calcSobrecarga(opts: {
  tanqueId: number;
  tanqueNombre: string;
  litros: number;
  capacidadMax: number;
  motivo?: MotivoSobrecarga;
  detalle?: string;
}): SobrecargaTanque | null {
  const exceso = opts.litros - opts.capacidadMax;
  if (!(opts.capacidadMax > 0) || exceso <= 0.5) return null;
  return {
    tanqueId: opts.tanqueId,
    tanqueNombre: opts.tanqueNombre,
    litros: opts.litros,
    capacidadMax: opts.capacidadMax,
    exceso,
    motivo: opts.motivo ?? "otro",
    detalle: opts.detalle ?? TEXTO_SOBRECARGA,
  };
}

export function etiquetaMotivo(motivo: MotivoSobrecarga): string {
  if (motivo === "delete_carga") return "Por borrar una carga";
  if (motivo === "update_carga") return "Por corregir litros de una carga";
  return "Por una corrección de inventario";
}
