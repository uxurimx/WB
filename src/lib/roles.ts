export const VALID_ROLES = [
  "admin",
  "gerente",
  "despachador",
  "operador_nissan",
  "encargado_obra",
  "chofer",
  "taller",
  "encargado_taller",
] as const;

export type Role = (typeof VALID_ROLES)[number];

export const PROTECTED_USER_EMAIL = "wbtaller.beto@gmail.com";

export function isProtectedUserEmail(email: string) {
  return email.trim().toLocaleLowerCase("en-US") === PROTECTED_USER_EMAIL;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  despachador: "Despachador",
  operador_nissan: "Operador NISSAN",
  encargado_obra: "Encargado de Obra",
  chofer: "Chofer",
  taller: "Taller",
  encargado_taller: "Encargado de Taller",
};

const SYSTEM_ROLE_ORDER = [
  "despachador",
  "operador_nissan",
  "chofer",
  "encargado_obra",
  "taller",
  "encargado_taller",
  "gerente",
  "admin",
];

const PRIORITY_CUSTOM_ROLE_LABELS = [
  "ADMIN",
  "ADMINNNN",
  "ADMINISTRACIÓN OFICINA",
  "ADMINISTRACIÓN",
];

export function sortRolesForAdmin<T extends { id: string; label: string; isSystem: boolean }>(roles: T[]): T[] {
  const systemOrder = new Map(SYSTEM_ROLE_ORDER.map((id, index) => [id, index]));
  const customOrder = new Map(PRIORITY_CUSTOM_ROLE_LABELS.map((label, index) => [label, index]));

  return [...roles].sort((a, b) => {
    if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
    if (a.isSystem) {
      return (systemOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER)
        - (systemOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER);
    }

    const labelA = a.label.trim().toLocaleUpperCase("es-MX");
    const labelB = b.label.trim().toLocaleUpperCase("es-MX");
    const rankA = customOrder.get(labelA) ?? Number.MAX_SAFE_INTEGER;
    const rankB = customOrder.get(labelB) ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB || labelA.localeCompare(labelB, "es-MX") || a.id.localeCompare(b.id);
  });
}
