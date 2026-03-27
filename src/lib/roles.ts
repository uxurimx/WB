export const VALID_ROLES = [
  "admin",
  "gerente",
  "despachador",
  "operador_nissan",
  "encargado_obra",
  "chofer",
] as const;

export type Role = (typeof VALID_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  despachador: "Despachador",
  operador_nissan: "Operador NISSAN",
  encargado_obra: "Encargado de Obra",
  chofer: "Chofer",
};
