-- Campos de captura y expediente de la orden de taller.
-- Aditivo e idempotente: conservar los registros ya existentes.
ALTER TABLE ordenes_taller
  ADD COLUMN IF NOT EXISTS mecanicos TEXT,
  ADD COLUMN IF NOT EXISTS mecanico_otro TEXT,
  ADD COLUMN IF NOT EXISTS fotos_ingreso TEXT,
  ADD COLUMN IF NOT EXISTS fotos_salida TEXT;

ALTER TABLE orden_refacciones
  ADD COLUMN IF NOT EXISTS unidad_medida VARCHAR(20) NOT NULL DEFAULT 'pz',
  ADD COLUMN IF NOT EXISTS origen VARCHAR(30) NOT NULL DEFAULT 'Comprado';
