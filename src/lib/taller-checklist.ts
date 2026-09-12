export const CHECKLIST_PUNTOS = [
  { clave: "luces_principales", label: "Luces principales" },
  { clave: "faros_delanteros", label: "Faros delanteros" },
  { clave: "faros_reversa_traseros", label: "Faros reversa traseros" },
  { clave: "faros_reversa_laterales", label: "Faros reversa laterales" },
  { clave: "alarma_reversa", label: "Alarma de reversa" },
  { clave: "torreta", label: "Torreta" },
  { clave: "fugas", label: "Fugas" },
  { clave: "espejos", label: "Espejos" },
  { clave: "luces_traseras", label: "Luces traseras" },
  { clave: "neumaticos", label: "Neumáticos" },
] as const;

export type ChecklistClave = (typeof CHECKLIST_PUNTOS)[number]["clave"];

export const ESTADOS_ORDEN = ["abierta", "en_proceso", "cerrada", "cancelada"] as const;
export type EstadoOrden = (typeof ESTADOS_ORDEN)[number];

export const ESTADO_LABEL: Record<EstadoOrden, string> = {
  abierta: "Abierta",
  en_proceso: "En proceso",
  cerrada: "Cerrada",
  cancelada: "Cancelada",
};
