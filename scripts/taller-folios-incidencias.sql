-- Folio consecutivo compartido entre incidencias y órdenes de servicio.
-- Ejecutar manualmente solo en la base de pruebas confirmada.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS taller_folio_seq;

LOCK TABLE incidencias_taller, ordenes_taller IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE incidencias_taller
  ADD COLUMN IF NOT EXISTS folio integer,
  ADD COLUMN IF NOT EXISTS fallas text,
  ADD COLUMN IF NOT EXISTS ubicacion text,
  ADD COLUMN IF NOT EXISTS observaciones text;

ALTER TABLE ordenes_taller
  ADD COLUMN IF NOT EXISTS folio integer;

UPDATE incidencias_taller
SET folio = nextval('taller_folio_seq')
WHERE folio IS NULL;

UPDATE ordenes_taller AS o
SET folio = i.folio
FROM incidencias_taller AS i
WHERE o.incidencia_id = i.id;

UPDATE ordenes_taller
SET folio = nextval('taller_folio_seq')
WHERE folio IS NULL;

ALTER TABLE incidencias_taller
  ALTER COLUMN folio SET DEFAULT nextval('taller_folio_seq'),
  ALTER COLUMN folio SET NOT NULL;

ALTER TABLE ordenes_taller
  ALTER COLUMN folio SET DEFAULT nextval('taller_folio_seq'),
  ALTER COLUMN folio SET NOT NULL;

SELECT setval(
  'taller_folio_seq',
  GREATEST(COALESCE((
    SELECT max(folio) FROM (
      SELECT folio FROM incidencias_taller
      UNION ALL
      SELECT folio FROM ordenes_taller
    ) AS folios
  ), 0), 1),
  EXISTS (
    SELECT 1 FROM (
      SELECT folio FROM incidencias_taller
      UNION ALL
      SELECT folio FROM ordenes_taller
    ) AS folios
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS incidencias_taller_folio_unique
  ON incidencias_taller (folio);

CREATE UNIQUE INDEX IF NOT EXISTS ordenes_taller_folio_unique
  ON ordenes_taller (folio);

COMMIT;
