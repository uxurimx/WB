export type NavPermission =
  | "dashboard"
  | "settings"
  | "cargas.historial"
  | "cargas.nueva_patio"
  | "cargas.nueva_campo"
  | "catalogo"
  | "periodos"
  | "admin";

export const ROLE_NAV_PERMISSIONS: Record<string, NavPermission[]> = {
  admin:           ["dashboard", "settings", "cargas.historial", "cargas.nueva_patio", "cargas.nueva_campo", "catalogo", "periodos", "admin"],
  gerente:         ["dashboard", "settings", "cargas.historial", "cargas.nueva_patio", "cargas.nueva_campo", "catalogo", "periodos"],
  despachador:     ["cargas.historial", "cargas.nueva_patio"],
  operador_nissan: ["cargas.historial", "cargas.nueva_campo"],
  encargado_obra:  ["cargas.historial", "cargas.nueva_campo", "catalogo"],
  chofer:          ["cargas.historial"],
};

export function hasNavPermission(role: string | undefined, perm: NavPermission): boolean {
  if (!role) return false;
  return (ROLE_NAV_PERMISSIONS[role] ?? []).includes(perm);
}
