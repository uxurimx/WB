export type NavPermission =
  | "dashboard"
  | "settings"
  | "cargas.historial"
  | "cargas.nueva_patio"
  | "cargas.nueva_campo"
  | "catalogo"
  | "periodos"
  | "tanques"
  | "admin"
  | "poxelbit"
  | "analiticas";

export const ROLE_NAV_PERMISSIONS: Record<string, NavPermission[]> = {
  admin:           ["dashboard", "settings", "cargas.historial", "cargas.nueva_patio", "cargas.nueva_campo", "catalogo", "periodos", "tanques", "admin", "poxelbit", "analiticas"],
  gerente:         ["dashboard", "settings", "cargas.historial", "cargas.nueva_patio", "cargas.nueva_campo", "catalogo", "periodos", "tanques", "poxelbit", "analiticas"],
  despachador:     ["cargas.historial", "cargas.nueva_patio"],
  operador_nissan: ["cargas.historial", "cargas.nueva_campo"],
  encargado_obra:  ["cargas.historial", "cargas.nueva_campo", "catalogo"],
  chofer:          ["cargas.historial"],
};

export function hasNavPermission(role: string | undefined, perm: NavPermission): boolean {
  if (!role) return false;
  return (ROLE_NAV_PERMISSIONS[role] ?? []).includes(perm);
}

/** Unión del mapa TS + JSON en DB: un rol viejo no puede esconder ítems nuevos. */
export function mergeRolePermisos(role: string | undefined, fromDb: NavPermission[] | null | undefined): NavPermission[] {
  const fallback = (role && ROLE_NAV_PERMISSIONS[role]) ? ROLE_NAV_PERMISSIONS[role] : [];
  if (!fromDb?.length) return fallback;
  return [...new Set([...fallback, ...fromDb])];
}
