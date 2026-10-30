-- Habilita series globales para folios de Patio, Campo y transferencias.
-- Aplicar solo después de confirmar la rama de base de datos y revisar el preflight.
-- No usar drizzle-kit push para aplicar este cambio.
BEGIN;

LOCK TABLE cargas, transferencias_tanque, folio_series IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cargas
    WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL
    GROUP BY folio_serie_id, folio HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay cargas duplicadas dentro de una misma serie; resolverlas antes de continuar.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM cargas c
    JOIN transferencias_tanque t
      ON t.folio_serie_id = c.folio_serie_id AND t.folio = c.folio
    JOIN folio_series fs ON fs.id = c.folio_serie_id AND fs.origen = 'compartida'
    WHERE c.folio IS NOT NULL AND c.folio_serie_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Hay folios compartidos entre cargas y transferencias; revisar antes de habilitar series comunes.';
  END IF;
END $$;

ALTER TABLE folio_series DROP CONSTRAINT IF EXISTS folio_series_origen_check;
ALTER TABLE folio_series ADD CONSTRAINT folio_series_origen_check
  CHECK (origen IN ('patio', 'campo', 'compartida'));

CREATE UNIQUE INDEX IF NOT EXISTS cargas_folio_serie_unique
  ON cargas (folio_serie_id, folio)
  WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL;

CREATE OR REPLACE FUNCTION asignar_serie_folio_predeterminada()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_origen varchar(10);
  v_serie_id integer;
  v_folio_min integer;
  v_folio_max integer;
BEGIN
  IF TG_TABLE_NAME = 'cargas' THEN
    IF NEW.origen = 'externo' THEN RETURN NEW; END IF;
    v_origen := NEW.origen;
  ELSE
    v_origen := 'patio';
  END IF;

  IF NEW.folio_serie_id IS NULL THEN
    SELECT fs.id INTO v_serie_id
    FROM configuracion cfg
    JOIN folio_series fs ON fs.id = cfg.valor::integer
    WHERE cfg.clave = 'folio_serie_default_compartida'
      AND fs.origen = 'compartida' AND fs.activa;

    IF v_serie_id IS NULL THEN
      SELECT fs.id INTO v_serie_id
      FROM configuracion cfg
      JOIN folio_series fs ON fs.id = cfg.valor::integer
      WHERE cfg.clave = 'folio_serie_default_' || v_origen
        AND fs.origen = v_origen AND fs.activa;
    END IF;
    IF v_serie_id IS NULL THEN
      SELECT id INTO v_serie_id FROM folio_series
      WHERE origen = v_origen AND codigo = 'BASE' AND activa;
    END IF;
    IF v_serie_id IS NULL THEN
      RAISE EXCEPTION 'No hay serie activa para el origen %', v_origen;
    END IF;
    NEW.folio_serie_id := v_serie_id;
  END IF;

  SELECT folio_min, folio_max INTO v_folio_min, v_folio_max
  FROM folio_series
  WHERE id = NEW.folio_serie_id AND (origen = v_origen OR origen = 'compartida');
  IF NOT FOUND THEN
    RAISE EXCEPTION 'La serie % no corresponde al origen %', NEW.folio_serie_id, v_origen;
  END IF;
  IF NEW.folio IS NOT NULL AND v_folio_min > 0 AND NEW.folio < v_folio_min THEN
    RAISE EXCEPTION 'El folio % está debajo del mínimo % de la serie', NEW.folio, v_folio_min;
  END IF;
  IF NEW.folio IS NOT NULL AND v_folio_max > 0 AND NEW.folio > v_folio_max THEN
    RAISE EXCEPTION 'El folio % supera el máximo % de la serie', NEW.folio, v_folio_max;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validar_folio_compartido_unico()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_serie_compartida boolean;
BEGIN
  IF NEW.folio IS NULL OR NEW.folio_serie_id IS NULL THEN RETURN NEW; END IF;
  SELECT origen = 'compartida' INTO v_serie_compartida
  FROM folio_series WHERE id = NEW.folio_serie_id;
  IF NOT COALESCE(v_serie_compartida, false) THEN RETURN NEW; END IF;

  -- El advisory lock serializa la comprobación entre las dos tablas.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.folio_serie_id::text || ':' || NEW.folio::text, 0));

  IF TG_TABLE_NAME = 'cargas' THEN
    IF EXISTS (
      SELECT 1 FROM transferencias_tanque
      WHERE folio_serie_id = NEW.folio_serie_id AND folio = NEW.folio
    ) THEN
      RAISE EXCEPTION 'El folio % ya existe en transferencias para la serie compartida', NEW.folio;
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1 FROM cargas
      WHERE folio_serie_id = NEW.folio_serie_id AND folio = NEW.folio
    ) THEN
      RAISE EXCEPTION 'El folio % ya existe en cargas para la serie compartida', NEW.folio;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_folio_compartido_unico_cargas ON cargas;
CREATE TRIGGER zz_folio_compartido_unico_cargas
  BEFORE INSERT OR UPDATE OF folio, folio_serie_id, origen ON cargas
  FOR EACH ROW EXECUTE FUNCTION validar_folio_compartido_unico();

DROP TRIGGER IF EXISTS zz_folio_compartido_unico_transferencias ON transferencias_tanque;
CREATE TRIGGER zz_folio_compartido_unico_transferencias
  BEFORE INSERT OR UPDATE OF folio, folio_serie_id ON transferencias_tanque
  FOR EACH ROW EXECUTE FUNCTION validar_folio_compartido_unico();

COMMIT;

-- Integridad: deben regresar cero filas.
-- SELECT folio_serie_id, folio, count(*) FROM cargas WHERE folio IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;
-- SELECT c.id, t.id, c.folio, c.folio_serie_id FROM cargas c JOIN transferencias_tanque t USING (folio_serie_id, folio) JOIN folio_series fs ON fs.id = c.folio_serie_id AND fs.origen = 'compartida' WHERE c.folio IS NOT NULL;
