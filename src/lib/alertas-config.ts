// Umbrales de alerta de stock (litros)
export const UMBRAL_TALLER = 500;
export const UMBRAL_NISSAN = 100;

// Días por defecto antes de expirar alertas de rendimiento (configurable en settings)
export const ALERTA_RENDIMIENTO_DIAS_DEFAULT = 15;

// Tolerancia por defecto para rendimiento (configurable en settings)
export const TOLERANCIA_DEFAULT = 0.20; // 20%

export type AlertaRendimiento = {
  unidadId:              number;
  unidadCodigo:          string;
  tipo:                  string;
  rendimientoActual:     number;
  rendimientoReferencia: number;
  diferenciaPct:         number;
  periodoNombre:         string;
};

export type ConciliacionTanque = {
  tanqueId:    number;
  nombre:      string;
  actual:      number;  // litros_actuales en el sistema
  teorico:     number;  // ancla + recargas − cargas − transferencias salientes + entrantes
  diferencia:  number;  // actual − teórico
  tolerancia:  number;  // litros de divergencia permitidos (merma % sobre volumen movido)
  ok:          boolean;
  anclaFecha:  string | null; // ISO del último ajuste manual auditado; null = desde el origen
  anclaLitros: number;
};

export type AnomaliaActiva = {
  tipo:          "multiple_cargas_dia" | "litros_excesivos";
  unidadCodigo:  string;
  unidadId:      number;
  detalle:       string;
  fecha:         string;
  totalLitros:   number;
  numCargas:     number;
};
