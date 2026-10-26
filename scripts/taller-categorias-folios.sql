-- Categorías compartidas por ingreso, incidencias y Bitácora General.
-- Las incidencias reciben folio hasta que se abre una orden de taller.
ALTER TABLE ordenes_taller
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(30) NOT NULL DEFAULT 'correctivo';

UPDATE ordenes_taller
SET categoria = 'preventivo'
WHERE es_preventivo = TRUE AND categoria = 'correctivo';

ALTER TABLE incidencias_taller
  ALTER COLUMN folio DROP DEFAULT,
  ALTER COLUMN folio DROP NOT NULL;

UPDATE incidencias_taller
SET categoria = CASE
  WHEN categoria = 'llantas' OR descripcion ILIKE 'Llanta dañada%' THEN 'llanta_danada'
  WHEN categoria IN ('mecanica', 'electrica', 'hidraulica', 'frenos') THEN 'correctivo'
  WHEN categoria NOT IN ('preventivo', 'correctivo', 'otro', 'urea', 'llanta_danada') THEN 'otro'
  ELSE categoria
END;

-- Evitar reutilizar folios ya existentes cuando se creen las próximas órdenes.
SELECT setval(
  'taller_folio_seq',
  GREATEST(
    COALESCE((SELECT MAX(folio) FROM ordenes_taller), 0),
    COALESCE((SELECT MAX(folio) FROM incidencias_taller), 0),
    (SELECT last_value FROM taller_folio_seq)
  ),
  TRUE
);
