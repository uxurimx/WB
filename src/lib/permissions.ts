export type NavPermission =
  | "dashboard"
  | "settings"
  | "cargas.historial"
  | "cargas.nueva_patio"
  | "cargas.nueva_campo"
  | "catalogo"
  | "periodos"
  | "tanques"
  | "taller"
  | "taller.bitacora"
  | "taller.terminar"
  | "taller.cerrar"
  | "taller.cancelar"
  | "admin"
  | "poxelbit"
  | "analiticas";

export const ROLE_NAV_PERMISSIONS: Record<string, NavPermission[]> = {
  admin:           ["dashboard", "settings", "cargas.historial", "cargas.nueva_patio", "cargas.nueva_campo", "catalogo", "periodos", "tanques", "taller", "taller.bitacora", "taller.terminar", "taller.cerrar", "taller.cancelar", "admin", "poxelbit", "analiticas"],
  gerente:         ["dashboard", "settings", "cargas.historial", "cargas.nueva_patio", "cargas.nueva_campo", "catalogo", "periodos", "tanques", "taller", "taller.bitacora", "taller.terminar", "taller.cerrar", "taller.cancelar", "poxelbit", "analiticas"],
  despachador:     ["cargas.historial", "cargas.nueva_patio", "taller", "taller.bitacora"],
  operador_nissan: ["cargas.historial", "cargas.nueva_campo"],
  encargado_obra:  ["cargas.historial", "cargas.nueva_campo", "catalogo"],
  chofer:          ["cargas.historial"],
  taller:          ["taller", "taller.terminar"],
  encargado_taller:["taller", "taller.bitacora", "taller.terminar", "taller.cerrar", "taller.cancelar"],
};

export function hasNavPermission(role: string | undefined, perm: NavPermission): boolean {
  if (!role) return false;
  return (ROLE_NAV_PERMISSIONS[role] ?? []).includes(perm);
}

/** Unión del mapa TS + JSON en DB: un rol viejo no puede esconder ítems nuevos. */
export function mergeRolePermisos(role: string | undefined, fromDb: NavPermission[] | null | undefined): NavPermission[] {
  const fallback = (role && ROLE_NAV_PERMISSIONS[role]) ? ROLE_NAV_PERMISSIONS[role] : [];
  if (!fromDb?.length) return fallback;
  // El permiso histórico de Taller en encargado_obra debe quedar revocado aunque siga en JSON de DB.
  const permisosDb = role === "encargado_obra" ? fromDb.filter((permiso) => !permiso.startsWith("taller")) : fromDb;
  return [...new Set([...fallback, ...permisosDb])];
}
