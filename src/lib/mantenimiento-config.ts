export type TipoControlMantenimiento = "km" | "hrs";
export type TipoUnidadMantenimiento = "camion" | "maquina" | "nissan" | "otro";

export type ConfigMantenimientoTipoUnidad = {
  tipoUnidad: TipoUnidadMantenimiento;
  tipoControl: TipoControlMantenimiento;
  intervalo: number;
  activo: boolean;
};

export type UmbralesAlertaMantenimiento = {
  proximo: number;
  cercano: number;
  inminente: number;
};

export type ConfigMantenimientoGlobal = {
  defaults: Record<TipoUnidadMantenimiento, ConfigMantenimientoTipoUnidad>;
  alertas: Record<TipoControlMantenimiento, UmbralesAlertaMantenimiento>;
};

export const TIPOS_UNIDAD_MANTENIMIENTO: TipoUnidadMantenimiento[] = [
  "camion",
  "maquina",
  "nissan",
  "otro",
];

export const DEFAULTS_MANTENIMIENTO_TIPO: Record<
  TipoUnidadMantenimiento,
  ConfigMantenimientoTipoUnidad
> = {
  camion: { tipoUnidad: "camion", tipoControl: "km", intervalo: 5000, activo: true },
  maquina: { tipoUnidad: "maquina", tipoControl: "hrs", intervalo: 250, activo: true },
  nissan: { tipoUnidad: "nissan", tipoControl: "km", intervalo: 5000, activo: true },
  otro: { tipoUnidad: "otro", tipoControl: "km", intervalo: 5000, activo: true },
};

export const DEFAULTS_ALERTA_MANTENIMIENTO: Record<
  TipoControlMantenimiento,
  UmbralesAlertaMantenimiento
> = {
  km: { proximo: 1000, cercano: 500, inminente: 250 },
  hrs: { proximo: 50, cercano: 25, inminente: 12 },
};

export function tipoUnidadLabel(tipo: TipoUnidadMantenimiento) {
  switch (tipo) {
    case "camion":
      return "Camión";
    case "maquina":
      return "Maquinaria";
    case "nissan":
      return "Camioneta / Ligero";
    case "otro":
      return "Otro";
  }
}

export function normalizeMantenimientoConfig(
  defaultsRaw?: string | null,
  alertasRaw?: string | null,
): ConfigMantenimientoGlobal {
  const defaults = { ...DEFAULTS_MANTENIMIENTO_TIPO };
  const alertas = {
    km: { ...DEFAULTS_ALERTA_MANTENIMIENTO.km },
    hrs: { ...DEFAULTS_ALERTA_MANTENIMIENTO.hrs },
  };

  if (defaultsRaw) {
    try {
      const parsed = JSON.parse(defaultsRaw) as Partial<
        Record<TipoUnidadMantenimiento, Partial<ConfigMantenimientoTipoUnidad>>
      >;
      for (const tipo of TIPOS_UNIDAD_MANTENIMIENTO) {
        const row = parsed?.[tipo];
        if (!row) continue;
        defaults[tipo] = {
          tipoUnidad: tipo,
          tipoControl: row.tipoControl === "hrs" ? "hrs" : "km",
          intervalo:
            typeof row.intervalo === "number" && Number.isFinite(row.intervalo) && row.intervalo > 0
              ? Math.round(row.intervalo)
              : DEFAULTS_MANTENIMIENTO_TIPO[tipo].intervalo,
          activo: row.activo ?? DEFAULTS_MANTENIMIENTO_TIPO[tipo].activo,
        };
      }
    } catch {
      // Si el JSON legado está corrupto, usar defaults del sistema.
    }
  }

  if (alertasRaw) {
    try {
      const parsed = JSON.parse(alertasRaw) as Partial<
        Record<TipoControlMantenimiento, Partial<UmbralesAlertaMantenimiento>>
      >;
      for (const tipo of ["km", "hrs"] as const) {
        const row = parsed?.[tipo];
        if (!row) continue;
        alertas[tipo] = {
          proximo:
            typeof row.proximo === "number" && Number.isFinite(row.proximo) && row.proximo >= 0
              ? Math.round(row.proximo)
              : DEFAULTS_ALERTA_MANTENIMIENTO[tipo].proximo,
          cercano:
            typeof row.cercano === "number" && Number.isFinite(row.cercano) && row.cercano >= 0
              ? Math.round(row.cercano)
              : DEFAULTS_ALERTA_MANTENIMIENTO[tipo].cercano,
          inminente:
            typeof row.inminente === "number" && Number.isFinite(row.inminente) && row.inminente >= 0
              ? Math.round(row.inminente)
              : DEFAULTS_ALERTA_MANTENIMIENTO[tipo].inminente,
        };
      }
    } catch {
      // Si el JSON legado está corrupto, usar defaults del sistema.
    }
  }

  return { defaults, alertas };
}
