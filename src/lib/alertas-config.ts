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

export type AnomaliaActiva = {
  tipo:          "multiple_cargas_dia" | "litros_excesivos";
  unidadCodigo:  string;
  unidadId:      number;
  detalle:       string;
  fecha:         string;
  totalLitros:   number;
  numCargas:     number;
};
