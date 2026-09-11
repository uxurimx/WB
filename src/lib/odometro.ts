export const KM_MAX_DIFERENCIA = 1100;

export type OdometroReset = {
  fecha: string;
  createdAt: Date | null;
  lecturaAnterior: number;
  lecturaNueva: number;
};

export type LecturaOdometro = {
  raw: number;
  fecha: string;
  createdAt: Date | null;
};

function resetAntesDe(reset: OdometroReset, at: { fecha: string; createdAt: Date | null }): boolean {
  if (reset.fecha < at.fecha) return true;
  if (reset.fecha > at.fecha) return false;
  const resetTs = reset.createdAt?.getTime() ?? 0;
  const atTs = at.createdAt?.getTime() ?? 0;
  return resetTs <= atTs;
}

/** Lectura de hub + offsets de resets anteriores = km/hrs reales acumulados. */
export function trueOdometro(raw: number, at: { fecha: string; createdAt: Date | null }, resets: OdometroReset[]): number {
  let extra = 0;
  for (const reset of resets) {
    if (resetAntesDe(reset, at)) {
      extra += reset.lecturaAnterior - reset.lecturaNueva;
    }
  }
  return raw + extra;
}

export function offsetActual(resets: OdometroReset[]): number {
  return resets.reduce((s, r) => s + (r.lecturaAnterior - r.lecturaNueva), 0);
}

export function kmHrsRecorridos(opts: {
  lecturas: LecturaOdometro[];
  resets: OdometroReset[];
  referenciaRaw: number | null;
  referenciaAt?: { fecha: string; createdAt: Date | null } | null;
}): { inicial: number | null; final: number | null; recorrido: number | null } {
  const trues = opts.lecturas
    .filter((l) => l.raw > 0)
    .map((l) => trueOdometro(l.raw, l, opts.resets));

  const final = trues.length > 0 ? Math.max(...trues) : null;
  const inicialFromRef =
    opts.referenciaRaw != null
      ? trueOdometro(
          opts.referenciaRaw,
          opts.referenciaAt ?? { fecha: "0000-01-01", createdAt: null },
          opts.resets,
        )
      : null;
  const inicial =
    inicialFromRef ?? (trues.length > 0 ? Math.min(...trues) : null);

  const recorrido =
    inicial !== null && final !== null && final > inicial ? final - inicial : null;

  return { inicial, final, recorrido };
}
