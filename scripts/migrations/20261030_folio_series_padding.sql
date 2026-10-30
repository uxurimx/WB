-- Conserva cuántos dígitos deben mostrarse en los folios de cada serie.
-- Las series existentes mantienen el formato numérico actual (sin ceros iniciales).
BEGIN;

ALTER TABLE folio_series
  ADD COLUMN IF NOT EXISTS folio_digitos integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'folio_series_folio_digitos_range'
      AND conrelid = 'public.folio_series'::regclass
  ) THEN
    ALTER TABLE folio_series
      ADD CONSTRAINT folio_series_folio_digitos_range
      CHECK (folio_digitos BETWEEN 0 AND 5);
  END IF;
END $$;

COMMENT ON COLUMN folio_series.folio_digitos IS
  'Ancho numérico de presentación; 0 conserva el formato sin ceros iniciales.';

COMMIT;
