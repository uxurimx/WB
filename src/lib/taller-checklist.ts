export const CHECKLIST_PUNTOS = [
  { clave: "luces_principales", label: "Luces principales", hint: "Altas, bajas, tablero" },
  { clave: "faros_delanteros", label: "Faros delanteros", hint: "Rotos, opacos, no encienden" },
  { clave: "faros_reversa_traseros", label: "Faros reversa traseros", hint: "" },
  { clave: "faros_reversa_laterales", label: "Faros reversa laterales", hint: "" },
  { clave: "alarma_reversa", label: "Alarma de reversa", hint: "¿Se oye al meter reversa?" },
  { clave: "torreta", label: "Torreta", hint: "" },
  { clave: "fugas", label: "Fugas", hint: "Diesel, aceite, hidráulico, agua" },
  { clave: "espejos", label: "Espejos", hint: "Rotos, flojos, faltantes" },
  { clave: "luces_traseras", label: "Luces traseras", hint: "Stop, direccionales" },
  { clave: "neumaticos", label: "Neumáticos", hint: "Posición 7, 8, 9, 10 · desgaste, clavos" },
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
