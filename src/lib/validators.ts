import { z } from "zod";
import { KM_MAX_DIFERENCIA } from "@/lib/odometro";

export function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const issue = result.error.issues[0];
  throw new Error(issue?.message ?? "Datos inválidos");
}

export const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)");
export const horaSchema = z.string().regex(/^\d{2}:\d{2}/, "Hora inválida (HH:MM)");
// Límite técnico amplio para evitar capturas absurdas sin bloquear pipas,
// transferencias o movimientos operativos válidos.
export const litrosSchema = z.number()
  .positive("Los litros deben ser mayores a 0")
  .max(50000, "Los litros exceden el límite permitido");
export const folioSchema = z.number().int().positive().max(99999, "Folio inválido. Debe ser un número entre 1 y 99999");
export const idSchema = z.number().int().positive();

export const cargaPatioSchema = z.object({
  fecha: fechaSchema,
  hora: horaSchema,
  folioManual: folioSchema.optional(),
  unidadId: idSchema,
  litros: litrosSchema,
  odometroHrs: z.number().nonnegative().optional(),
  kmEstimado: z.boolean().optional(),
  cuentaLtInicio: z.number().nonnegative().optional(),
  cuentaLtFin: z.number().nonnegative().optional(),
  operadorId: idSchema.optional(),
  tipoDiesel: z.string().max(20).optional(),
  notas: z.string().max(2000).optional(),
});

export const cargaCampoSchema = z.object({
  fecha: fechaSchema,
  hora: horaSchema,
  folioNissan: folioSchema,
  unidadId: idSchema,
  litros: litrosSchema,
  odometroHrs: z.number().nonnegative().optional(),
  kmEstimado: z.boolean().optional(),
  cuentaLtInicio: z.number().nonnegative().optional(),
  obraId: idSchema.optional(),
  operadorId: idSchema.optional(),
  quienSuministraId: idSchema.optional(),
  quienRecibeId: idSchema.optional(),
  tipoDiesel: z.string().max(20).optional(),
  notas: z.string().max(2000).optional(),
});

export const recargaTanqueSchema = z.object({
  tanqueId: idSchema,
  fecha: fechaSchema,
  litros: litrosSchema,
  cuentalitrosInicio: z.number().nonnegative().optional(),
  cuentalitrosNuevo: z.number().nonnegative().optional(),
  proveedor: z.string().max(200).optional(),
  folioFactura: z.string().max(80).optional(),
  precioLitro: z.number().nonnegative().optional(),
  notas: z.string().max(2000).optional(),
});

export const transferenciaSchema = z.object({
  tanqueOrigenId: idSchema,
  tanqueDestinoId: idSchema,
  litros: litrosSchema,
  fecha: fechaSchema,
  folio: folioSchema,
  notas: z.string().max(2000).optional(),
  cuentalitrosOrigen: z.number().nonnegative().optional(),
});

export const odometroResetSchema = z.object({
  unidadId: idSchema,
  fecha: fechaSchema,
  lecturaAnterior: z.number().nonnegative(),
  lecturaNueva: z.number().nonnegative(),
  notas: z.string().max(2000).optional(),
});

export function assertKmCaptura(opts: {
  kmNuevo: number | undefined;
  ultimoKm: number | null;
  kmEstimado?: boolean;
}) {
  if (opts.kmNuevo == null) return;
  if (opts.kmEstimado) return;
  if (opts.ultimoKm == null) return;
  if (opts.kmNuevo < opts.ultimoKm) {
    throw new Error(
      `El km (${opts.kmNuevo.toLocaleString("es-MX")}) no puede ser menor al anterior (${opts.ultimoKm.toLocaleString("es-MX")}). Si cambió el hubodómetro, registra el reset en la ficha de la unidad.`
    );
  }
  if (opts.kmNuevo - opts.ultimoKm > KM_MAX_DIFERENCIA) {
    throw new Error(
      `La diferencia de ${(opts.kmNuevo - opts.ultimoKm).toLocaleString("es-MX")} km excede el límite de ${KM_MAX_DIFERENCIA.toLocaleString("es-MX")} km`
    );
  }
}
