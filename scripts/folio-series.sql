-- Series de folios por bloque físico.
-- Ejecutar una sola vez sobre la rama Neon objetivo después de revisar el preflight
-- de duplicados incluido al final de este archivo. No usar db:push para esta migración.
BEGIN;

-- Evita que nuevas capturas entren entre el preflight, el backfill y los índices.
LOCK TABLE cargas, transferencias_tanque IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cargas WHERE folio IS NOT NULL
    GROUP BY folio, origen HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay cargas con folios repetidos dentro del mismo origen.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM transferencias_tanque WHERE folio IS NOT NULL
    GROUP BY folio HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay transferencias con folios repetidos.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM cargas WHERE origen NOT IN ('patio', 'campo', 'externo') OR origen IS NULL
  ) THEN
    RAISE EXCEPTION 'Hay cargas con origen no contemplado por las series de folios.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM configuracion
    WHERE clave IN ('folio_min_patio','folio_max_patio','folio_base','folio_min_campo','folio_max_campo','folio_base_campo')
      AND valor !~ '^[0-9]+$'
  ) THEN
    RAISE EXCEPTION 'Hay configuración de folios con valores que no son enteros no negativos.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS folio_series (
  id serial PRIMARY KEY,
  origen varchar(10) NOT NULL CHECK (origen IN ('patio', 'campo')),
  codigo varchar(20) NOT NULL,
  nombre varchar(80) NOT NULL,
  folio_min integer NOT NULL DEFAULT 0,
  folio_max integer NOT NULL DEFAULT 0,
  folio_base integer NOT NULL DEFAULT 1,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamp DEFAULT now(),
  CONSTRAINT folio_series_origen_codigo_unique UNIQUE (origen, codigo),
  CONSTRAINT folio_series_codigo_format CHECK (codigo ~ '^[A-Za-z0-9_-]{1,20}$'),
  CONSTRAINT folio_series_range_valid CHECK (
    folio_min >= 0 AND folio_max >= 0 AND folio_base > 0
    AND (folio_min = 0 OR folio_max = 0 OR folio_min <= folio_max)
  )
);

-- Conserva los límites y bases configurados antes de introducir series.
INSERT INTO folio_series (origen, codigo, nombre, folio_min, folio_max, folio_base, activa)
VALUES
  ('patio', 'BASE', 'Bloques anteriores',
    COALESCE((SELECT valor::integer FROM configuracion WHERE clave = 'folio_min_patio'), 0),
    COALESCE((SELECT valor::integer FROM configuracion WHERE clave = 'folio_max_patio'), 0),
    COALESCE((SELECT valor::integer FROM configuracion WHERE clave = 'folio_base'), 1), true),
  ('campo', 'BASE', 'Bloques anteriores',
    COALESCE((SELECT valor::integer FROM configuracion WHERE clave = 'folio_min_campo'), 0),
    COALESCE((SELECT valor::integer FROM configuracion WHERE clave = 'folio_max_campo'), 0),
    COALESCE((SELECT valor::integer FROM configuracion WHERE clave = 'folio_base_campo'), 1), true)
ON CONFLICT (origen, codigo) DO NOTHING;

INSERT INTO configuracion (clave, valor)
SELECT 'folio_serie_default_' || origen, id::text
FROM folio_series
WHERE codigo = 'BASE'
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = now();

ALTER TABLE cargas ADD COLUMN IF NOT EXISTS folio_serie_id integer;
ALTER TABLE transferencias_tanque ADD COLUMN IF NOT EXISTS folio_serie_id integer;

UPDATE cargas c
SET folio_serie_id = fs.id
FROM folio_series fs
WHERE c.folio_serie_id IS NULL
  AND fs.origen = c.origen
  AND fs.codigo = 'BASE'
  AND c.origen IN ('patio', 'campo');

UPDATE transferencias_tanque t
SET folio_serie_id = fs.id
FROM folio_series fs
WHERE t.folio_serie_id IS NULL
  AND fs.origen = 'patio'
  AND fs.codigo = 'BASE';

-- No asignar folios duplicados de historial a una serie arbitraria.
-- Si este bloque falla, resolver las filas duplicadas con el cliente y volver a ejecutar.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cargas
    WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL
    GROUP BY folio, origen, folio_serie_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay cargas con folio repetido dentro del mismo origen. Resolverlas antes de crear el índice por serie.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM transferencias_tanque
    WHERE folio IS NOT NULL
    GROUP BY folio, folio_serie_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Hay transferencias con folio repetido dentro de una serie. Resolverlas antes de crear el índice.';
  END IF;
END $$;

ALTER TABLE transferencias_tanque ALTER COLUMN folio_serie_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cargas_folio_serie_fk') THEN
    ALTER TABLE cargas ADD CONSTRAINT cargas_folio_serie_fk
      FOREIGN KEY (folio_serie_id) REFERENCES folio_series(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transferencias_folio_serie_fk') THEN
    ALTER TABLE transferencias_tanque ADD CONSTRAINT transferencias_folio_serie_fk
      FOREIGN KEY (folio_serie_id) REFERENCES folio_series(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cargas_folio_serie_required') THEN
    ALTER TABLE cargas ADD CONSTRAINT cargas_folio_serie_required
      CHECK (origen = 'externo' OR folio_serie_id IS NOT NULL);
  END IF;
END $$;

DROP INDEX IF EXISTS cargas_folio_origen_unique;
CREATE UNIQUE INDEX IF NOT EXISTS cargas_folio_origen_serie_unique
  ON cargas (folio, origen, folio_serie_id) WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cargas_folio_origen_without_serie_unique
  ON cargas (folio, origen) WHERE folio IS NOT NULL AND folio_serie_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS transferencias_folio_serie_unique
  ON transferencias_tanque (folio_serie_id, folio) WHERE folio IS NOT NULL;

-- Compatibilidad temporal: el código previo a esta función no enviaba serie.
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
    WHERE cfg.clave = 'folio_serie_default_' || v_origen
      AND fs.origen = v_origen AND fs.activa;

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
  FROM folio_series WHERE id = NEW.folio_serie_id AND origen = v_origen;
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

DROP TRIGGER IF EXISTS cargas_asignar_serie_folio ON cargas;
CREATE TRIGGER cargas_asignar_serie_folio
  BEFORE INSERT OR UPDATE OF folio, folio_serie_id, origen ON cargas
  FOR EACH ROW EXECUTE FUNCTION asignar_serie_folio_predeterminada();

DROP TRIGGER IF EXISTS transferencias_asignar_serie_folio ON transferencias_tanque;
CREATE TRIGGER transferencias_asignar_serie_folio
  BEFORE INSERT OR UPDATE OF folio, folio_serie_id ON transferencias_tanque
  FOR EACH ROW EXECUTE FUNCTION asignar_serie_folio_predeterminada();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cargas WHERE origen IN ('patio','campo') AND folio_serie_id IS NULL) THEN
    RAISE EXCEPTION 'Hay cargas Patio/Campo sin serie asignada.';
  END IF;
  IF EXISTS (SELECT 1 FROM transferencias_tanque WHERE folio_serie_id IS NULL) THEN
    RAISE EXCEPTION 'Hay transferencias sin serie asignada.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM cargas WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL
    GROUP BY folio, origen, folio_serie_id HAVING count(*) > 1
  ) OR EXISTS (
    SELECT 1 FROM cargas WHERE folio IS NOT NULL AND folio_serie_id IS NULL
    GROUP BY folio, origen HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'La verificación final detectó cargas duplicadas.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM transferencias_tanque WHERE folio IS NOT NULL
    GROUP BY folio_serie_id, folio HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'La verificación final detectó transferencias duplicadas.';
  END IF;
END $$;

COMMIT;

-- Integridad posterior a la migración:
-- SELECT folio, origen, folio_serie_id, count(*) FROM cargas WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL GROUP BY 1,2,3 HAVING count(*) > 1;
-- SELECT folio, folio_serie_id, count(*) FROM transferencias_tanque WHERE folio IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;
-- Verificar que cargas Patio/Campo tengan serie; origen externo puede quedar sin serie:
-- SELECT origen, count(*) FROM cargas WHERE origen IN ('patio','campo') AND folio_serie_id IS NULL GROUP BY origen;
-- Los folios iguales entre cargas Patio y transferencias son referencias distintas (P- y T-):
-- SELECT c.id, t.id, c.folio, c.folio_serie_id FROM cargas c JOIN transferencias_tanque t
--   ON c.origen = 'patio' AND c.folio = t.folio AND c.folio_serie_id = t.folio_serie_id;
