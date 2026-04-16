// Umbrales de alerta de stock (litros)
export const UMBRAL_TALLER = 500;
export const UMBRAL_NISSAN = 100;

export type AlertaRendimiento = {
  unidadId:             number;
  unidadCodigo:         string;
  tipo:                 string; // camion | maquina
  rendimientoActual:    number;
  rendimientoReferencia: number;
  diferenciaPct:        number; // negativo = por debajo
  periodoNombre:        string;
};
