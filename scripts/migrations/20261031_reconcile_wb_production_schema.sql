-- Alinea el esquema de ep-hidden-sun (producción) con ep-still-river (pruebas).
-- Evidencia de lectura del 2026-10-31: neondb / PostgreSQL 18.6 en ambos.
-- Ejecutar solo en producción, con respaldo vigente y psql -v ON_ERROR_STOP=1.
-- Toda la operación es transaccional; un error antes de COMMIT revierte todos los cambios.
-- Conserva push_subscriptions, que ya existe en producción y no en pruebas.
-- No ejecutar 20261029_align_wb_production_schema.sql: esa migración es un baseline
-- completo y no corresponde al estado parcial actual de esta rama.
--
-- Preflight observado: 755 cargas, 31 transferencias, 6 órdenes, 60 checklists,
-- 5 refacciones, 1 plan y 3 eventos de mantenimiento. Cero folios duplicados
-- (cargas por origen / transferencias) y cero referencias huérfanas de mantenimiento.

BEGIN;
SET LOCAL lock_timeout = '15s';
SET LOCAL statement_timeout = '5min';

DO $guard$
BEGIN
  IF current_database() <> 'neondb' THEN
    RAISE EXCEPTION 'Destino incorrecto: se esperaba neondb.';
  END IF;
  IF to_regclass('public.cargas') IS NULL
     OR to_regclass('public.transferencias_tanque') IS NULL
     OR to_regclass('public.ordenes_taller') IS NULL
     OR to_regclass('public.orden_checklist') IS NULL
     OR to_regclass('public.orden_refacciones') IS NULL
     OR to_regclass('public.orden_taller_log') IS NULL THEN
    RAISE EXCEPTION 'El esquema base no coincide con el preflight; detener y revisar.';
  END IF;
  IF to_regclass('public.folio_series') IS NOT NULL
     OR to_regclass('public.incidencias_taller') IS NOT NULL
     OR to_regclass('public.taller_eventos') IS NOT NULL
     OR to_regclass('public.taller_urea') IS NOT NULL
     OR EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public'
         AND ((table_name='cargas' AND column_name='folio_serie_id')
           OR (table_name='transferencias_tanque' AND column_name='folio_serie_id')
           OR (table_name='ordenes_taller' AND column_name='folio'))
     ) THEN
    RAISE EXCEPTION 'Se detectó una aplicación parcial o previa de esta migración; detener y revisar.';
  END IF;
END
$guard$;

-- Congela escrituras sobre las tablas existentes antes de medir y migrar.
LOCK TABLE cargas, transferencias_tanque, ordenes_taller,
  orden_checklist, orden_refacciones, mantenimientos_planes,
  mantenimientos_eventos IN SHARE ROW EXCLUSIVE MODE;

DO $preflight$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cargas WHERE folio IS NOT NULL
    GROUP BY folio, origen HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Folios de cargas duplicados por origen.'; END IF;
  IF EXISTS (
    SELECT 1 FROM transferencias_tanque WHERE folio IS NOT NULL
    GROUP BY folio HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Folios de transferencias duplicados.'; END IF;
  IF EXISTS (
    SELECT 1 FROM cargas WHERE origen IS NULL OR origen NOT IN ('patio','campo','externo')
  ) THEN RAISE EXCEPTION 'Hay orígenes de carga no contemplados.'; END IF;
  IF EXISTS (
    SELECT 1 FROM mantenimientos_planes p
    LEFT JOIN unidades u ON u.id=p.unidad_id WHERE u.id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM mantenimientos_eventos e
    LEFT JOIN unidades u ON u.id=e.unidad_id WHERE u.id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM mantenimientos_eventos e
    LEFT JOIN mantenimientos_planes p ON p.id=e.plan_id
    WHERE e.plan_id IS NOT NULL AND p.id IS NULL
  ) THEN RAISE EXCEPTION 'Hay referencias de mantenimiento huérfanas.'; END IF;
END
$preflight$;

CREATE TEMP TABLE _wb_reconcile_before ON COMMIT DROP AS
SELECT
  (SELECT count(*)::bigint FROM cargas) AS cargas_count,
  (SELECT md5(coalesce(string_agg(id::text||':'||coalesce(folio::text,'')||':'||coalesce(origen,''),',' ORDER BY id),'')) FROM cargas) AS cargas_hash,
  (SELECT count(*)::bigint FROM transferencias_tanque) AS transferencias_count,
  (SELECT md5(coalesce(string_agg(id::text||':'||coalesce(folio::text,''),',' ORDER BY id),'')) FROM transferencias_tanque) AS transferencias_hash,
  (SELECT count(*)::bigint FROM ordenes_taller) AS ordenes_count,
  (SELECT md5(coalesce(string_agg(id::text,',' ORDER BY id),'')) FROM ordenes_taller) AS ordenes_ids,
  (SELECT count(*)::bigint FROM orden_checklist) AS checklist_count,
  (SELECT md5(coalesce(string_agg(id::text,',' ORDER BY id),'')) FROM orden_checklist) AS checklist_ids,
  (SELECT count(*)::bigint FROM orden_refacciones) AS refacciones_count,
  (SELECT md5(coalesce(string_agg(id::text,',' ORDER BY id),'')) FROM orden_refacciones) AS refacciones_ids;



-- ===== Series base de folios =====
-- Series de folios por bloque físico.
-- Ejecutar una sola vez sobre la rama Neon objetivo después de revisar el preflight
-- de duplicados incluido al final de este archivo. No usar db:push para esta migración.

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


-- Integridad posterior a la migración:
-- SELECT folio, origen, folio_serie_id, count(*) FROM cargas WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL GROUP BY 1,2,3 HAVING count(*) > 1;
-- SELECT folio, folio_serie_id, count(*) FROM transferencias_tanque WHERE folio IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;
-- Verificar que cargas Patio/Campo tengan serie; origen externo puede quedar sin serie:
-- SELECT origen, count(*) FROM cargas WHERE origen IN ('patio','campo') AND folio_serie_id IS NULL GROUP BY origen;
-- Los folios iguales entre cargas Patio y transferencias son referencias distintas (P- y T-):
-- SELECT c.id, t.id, c.folio, c.folio_serie_id FROM cargas c JOIN transferencias_tanque t
--   ON c.origen = 'patio' AND c.folio = t.folio AND c.folio_serie_id = t.folio_serie_id;



-- ===== Series compartidas Patio/Campo/transferencias =====
-- Habilita series globales para folios de Patio, Campo y transferencias.
-- Aplicar solo después de confirmar la rama de base de datos y revisar el preflight.
-- No usar drizzle-kit push para aplicar este cambio.

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


-- Integridad: deben regresar cero filas.
-- SELECT folio_serie_id, folio, count(*) FROM cargas WHERE folio IS NOT NULL GROUP BY 1,2 HAVING count(*) > 1;
-- SELECT c.id, t.id, c.folio, c.folio_serie_id FROM cargas c JOIN transferencias_tanque t USING (folio_serie_id, folio) JOIN folio_series fs ON fs.id = c.folio_serie_id AND fs.origen = 'compartida' WHERE c.folio IS NOT NULL;



-- ===== Ancho de presentación de folios =====
-- Conserva cuántos dígitos deben mostrarse en los folios de cada serie.
-- Las series existentes mantienen el formato numérico actual (sin ceros iniciales).

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




-- ===== Unicidad global de folios internos =====
-- Impide repetir el número del folio entre cargas Patio/Campo y transferencias,
-- sin importar la serie (BASE o una serie creada posteriormente).
-- No altera folios históricos existentes. Aplicar manualmente solo tras confirmar
-- la rama de base de datos objetivo; no usar drizzle-kit push.

LOCK TABLE cargas, transferencias_tanque IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION validar_folio_interno_global()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_serie_codigo varchar(20);
BEGIN
  IF NEW.folio IS NULL THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'cargas' THEN
    IF NEW.origen = 'externo' THEN RETURN NEW; END IF;
  END IF;

  SELECT codigo INTO v_serie_codigo FROM folio_series WHERE id = NEW.folio_serie_id;
  IF v_serie_codigo IS NULL THEN
    RAISE EXCEPTION 'No se encontró la serie del folio';
  END IF;

  -- Serializa el identificador visible completo entre tablas y orígenes.
  PERFORM pg_advisory_xact_lock(hashtextextended('folio-interno:' || v_serie_codigo || ':' || NEW.folio::text, 0));

  IF TG_TABLE_NAME = 'cargas' THEN
    IF EXISTS (
      SELECT 1 FROM cargas c
      JOIN folio_series fs ON fs.id = c.folio_serie_id
      WHERE c.folio = NEW.folio
        AND fs.codigo = v_serie_codigo
        AND c.origen IN ('patio', 'campo')
        AND (TG_OP <> 'UPDATE' OR c.id IS DISTINCT FROM NEW.id)
    ) OR EXISTS (
      SELECT 1 FROM transferencias_tanque t
      JOIN folio_series fs ON fs.id = t.folio_serie_id
      WHERE t.folio = NEW.folio AND fs.codigo = v_serie_codigo
    ) THEN
      RAISE EXCEPTION 'FOLIO OCUPADO: la serie % con número % ya está registrada entre Patio, Campo o transferencias', v_serie_codigo, NEW.folio
        USING ERRCODE = '23505', CONSTRAINT = 'folio_interno_global_unique';
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1 FROM transferencias_tanque t
      JOIN folio_series fs ON fs.id = t.folio_serie_id
      WHERE t.folio = NEW.folio
        AND fs.codigo = v_serie_codigo
        AND (TG_OP <> 'UPDATE' OR t.id IS DISTINCT FROM NEW.id)
    ) OR EXISTS (
      SELECT 1 FROM cargas c
      JOIN folio_series fs ON fs.id = c.folio_serie_id
      WHERE c.folio = NEW.folio AND fs.codigo = v_serie_codigo AND c.origen IN ('patio', 'campo')
    ) THEN
      RAISE EXCEPTION 'FOLIO OCUPADO: la serie % con número % ya está registrada entre Patio, Campo o transferencias', v_serie_codigo, NEW.folio
        USING ERRCODE = '23505', CONSTRAINT = 'folio_interno_global_unique';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzzz_folio_interno_global_cargas ON cargas;
CREATE TRIGGER zzzz_folio_interno_global_cargas
  BEFORE INSERT OR UPDATE OF folio, origen, folio_serie_id ON cargas
  FOR EACH ROW EXECUTE FUNCTION validar_folio_interno_global();

DROP TRIGGER IF EXISTS zzzz_folio_interno_global_transferencias ON transferencias_tanque;
CREATE TRIGGER zzzz_folio_interno_global_transferencias
  BEFORE INSERT OR UPDATE OF folio, folio_serie_id ON transferencias_tanque
  FOR EACH ROW EXECUTE FUNCTION validar_folio_interno_global();




-- ===== Extensión de órdenes, incidencias y eventos =====
-- Esquema requerido por el panel operativo de Taller.
-- Aplicar manualmente solo después de revisar el destino y respaldar el esquema.

ALTER TABLE ordenes_taller
  ADD COLUMN IF NOT EXISTS incidencia_id integer,
  ADD COLUMN IF NOT EXISTS diagnostico_final text,
  ADD COLUMN IF NOT EXISTS trabajo_realizado text,
  ADD COLUMN IF NOT EXISTS observaciones_salida text,
  ADD COLUMN IF NOT EXISTS quien_entrega text,
  ADD COLUMN IF NOT EXISTS fecha_salida timestamp;

CREATE TABLE IF NOT EXISTS incidencias_taller (
  id serial PRIMARY KEY,
  unidad_id integer NOT NULL REFERENCES unidades(id),
  operador_id integer REFERENCES operadores(id),
  reportada_por_id text,
  fecha date NOT NULL,
  categoria varchar(30) NOT NULL DEFAULT 'otro',
  prioridad varchar(12) NOT NULL DEFAULT 'media',
  descripcion text NOT NULL,
  estado varchar(20) NOT NULL DEFAULT 'abierta',
  orden_id integer REFERENCES ordenes_taller(id),
  resolucion text,
  creado_por_id text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ordenes_taller_incidencia_id_fkey'
  ) THEN
    ALTER TABLE ordenes_taller
      ADD CONSTRAINT ordenes_taller_incidencia_id_fkey
      FOREIGN KEY (incidencia_id) REFERENCES incidencias_taller(id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ordenes_taller_incidencia_id_unique
  ON ordenes_taller (incidencia_id)
  WHERE incidencia_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS taller_eventos (
  id serial PRIMARY KEY,
  unidad_id integer NOT NULL REFERENCES unidades(id),
  incidencia_id integer REFERENCES incidencias_taller(id),
  orden_id integer REFERENCES ordenes_taller(id),
  tipo varchar(40) NOT NULL,
  detalle text,
  usuario_id text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS taller_eventos_unidad_fecha_idx
  ON taller_eventos (unidad_id, created_at DESC);



-- ===== Folio común de incidencias y órdenes =====
-- Folio consecutivo compartido entre incidencias y órdenes de servicio.
-- Ejecutar manualmente solo en la base de pruebas confirmada.

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




-- ===== Categorías de órdenes =====
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



-- ===== Campos del expediente =====
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



-- ===== Proveedor externo =====
-- Registrar el proveedor externo que realiza trabajos en una orden de taller.
-- Aplicar manualmente en la rama Neon de pruebas antes de usar el campo.
ALTER TABLE ordenes_taller
  ADD COLUMN IF NOT EXISTS proveedor_externo TEXT;



-- ===== Consumo de urea =====
-- Esquema para capturas de consumo de urea dentro de Taller.
-- Aplicar manualmente solo en la base de pruebas autorizada.
CREATE TABLE IF NOT EXISTS taller_urea (
  id serial PRIMARY KEY,
  unidad_id integer NOT NULL REFERENCES unidades(id),
  operador_id integer REFERENCES operadores(id),
  fecha date NOT NULL,
  litros real NOT NULL CHECK (litros > 0),
  observaciones text,
  registrado_por_id text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS taller_urea_fecha_unidad_idx
  ON taller_urea (fecha DESC, unidad_id);



-- ===== Respuesta explícita de checklist =====
-- Respuestas explícitas para el checklist: si, no o na.
-- El valor NULL conserva los puntos que aún no se han contestado.
ALTER TABLE orden_checklist
  ADD COLUMN IF NOT EXISTS respuesta VARCHAR(2);

-- Conserva el sentido de las respuestas existentes al migrar desde ok:boolean.
UPDATE orden_checklist
SET respuesta = CASE WHEN ok IS TRUE THEN 'si' WHEN ok IS FALSE THEN 'no' ELSE NULL END
WHERE respuesta IS NULL;



-- Relaciones de mantenimiento usadas por la aplicación y presentes en pruebas.
DO $maintenance_fks$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mantenimientos_planes_unidad_id_fk') THEN
    ALTER TABLE mantenimientos_planes ADD CONSTRAINT mantenimientos_planes_unidad_id_fk
      FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mantenimientos_eventos_unidad_id_fk') THEN
    ALTER TABLE mantenimientos_eventos ADD CONSTRAINT mantenimientos_eventos_unidad_id_fk
      FOREIGN KEY (unidad_id) REFERENCES unidades(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mantenimientos_eventos_plan_id_fk') THEN
    ALTER TABLE mantenimientos_eventos ADD CONSTRAINT mantenimientos_eventos_plan_id_fk
      FOREIGN KEY (plan_id) REFERENCES mantenimientos_planes(id) ON DELETE SET NULL;
  END IF;
END
$maintenance_fks$;

-- Comprueba objetos requeridos y que la migración no alteró filas históricas existentes.
DO $postflight$
DECLARE
  before_state record;
  after_state record;
BEGIN
  SELECT * INTO before_state FROM _wb_reconcile_before;
  SELECT
    (SELECT count(*)::bigint FROM cargas) AS cargas_count,
    (SELECT md5(coalesce(string_agg(id::text||':'||coalesce(folio::text,'')||':'||coalesce(origen,''),',' ORDER BY id),'')) FROM cargas) AS cargas_hash,
    (SELECT count(*)::bigint FROM transferencias_tanque) AS transferencias_count,
    (SELECT md5(coalesce(string_agg(id::text||':'||coalesce(folio::text,''),',' ORDER BY id),'')) FROM transferencias_tanque) AS transferencias_hash,
    (SELECT count(*)::bigint FROM ordenes_taller) AS ordenes_count,
    (SELECT md5(coalesce(string_agg(id::text,',' ORDER BY id),'')) FROM ordenes_taller) AS ordenes_ids,
    (SELECT count(*)::bigint FROM orden_checklist) AS checklist_count,
    (SELECT md5(coalesce(string_agg(id::text,',' ORDER BY id),'')) FROM orden_checklist) AS checklist_ids,
    (SELECT count(*)::bigint FROM orden_refacciones) AS refacciones_count,
    (SELECT md5(coalesce(string_agg(id::text,',' ORDER BY id),'')) FROM orden_refacciones) AS refacciones_ids
  INTO after_state;

  IF before_state.cargas_count<>after_state.cargas_count
     OR before_state.cargas_hash<>after_state.cargas_hash
     OR before_state.transferencias_count<>after_state.transferencias_count
     OR before_state.transferencias_hash<>after_state.transferencias_hash
     OR before_state.ordenes_count<>after_state.ordenes_count
     OR before_state.ordenes_ids<>after_state.ordenes_ids
     OR before_state.checklist_count<>after_state.checklist_count
     OR before_state.checklist_ids<>after_state.checklist_ids
     OR before_state.refacciones_count<>after_state.refacciones_count
     OR before_state.refacciones_ids<>after_state.refacciones_ids THEN
    RAISE EXCEPTION 'Cambió el conteo o la identidad de filas históricas.';
  END IF;
  IF to_regclass('public.folio_series') IS NULL
     OR to_regclass('public.incidencias_taller') IS NULL
     OR to_regclass('public.taller_eventos') IS NULL
     OR to_regclass('public.taller_urea') IS NULL
     OR to_regclass('public.taller_folio_seq') IS NULL
     OR to_regclass('public.push_subscriptions') IS NULL THEN
    RAISE EXCEPTION 'Faltan tablas o secuencia requeridas.';
  END IF;
  IF (SELECT count(*) FROM folio_series)<>2 THEN
    RAISE EXCEPTION 'Se esperaban dos series BASE creadas desde configuración.';
  END IF;
  IF EXISTS (SELECT 1 FROM cargas WHERE origen IN ('patio','campo') AND folio_serie_id IS NULL)
     OR EXISTS (SELECT 1 FROM transferencias_tanque WHERE folio_serie_id IS NULL) THEN
    RAISE EXCEPTION 'Quedaron cargas o transferencias sin serie.';
  END IF;
  IF EXISTS (SELECT 1 FROM ordenes_taller WHERE folio IS NULL)
     OR EXISTS (SELECT 1 FROM ordenes_taller GROUP BY folio HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Los folios de órdenes no quedaron completos y únicos.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mantenimientos_planes_unidad_id_fk')
     OR NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mantenimientos_eventos_unidad_id_fk')
     OR NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='mantenimientos_eventos_plan_id_fk') THEN
    RAISE EXCEPTION 'Faltan claves foráneas de mantenimiento.';
  END IF;
  IF (SELECT count(*) FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE')<>33
     OR (SELECT count(*) FROM information_schema.columns
         WHERE table_schema='public')<>342
     OR (SELECT count(*) FROM information_schema.table_constraints
         WHERE constraint_schema='public')<>221
     OR (SELECT count(*) FROM pg_index i
         JOIN pg_class t ON t.oid=i.indrelid
         JOIN pg_namespace n ON n.oid=t.relnamespace
         WHERE n.nspname='public')<>55
     OR (SELECT count(*) FROM information_schema.triggers
         WHERE trigger_schema='public')<>12
     OR (SELECT count(*) FROM information_schema.sequences
         WHERE sequence_schema='public')<>31
     OR (SELECT count(*) FROM pg_proc p
         JOIN pg_namespace n ON n.oid=p.pronamespace
         WHERE n.nspname='public' AND p.prokind IN ('f','p'))<>3 THEN
    RAISE EXCEPTION 'El conteo de objetos no coincide con el esquema probado más push_subscriptions.';
  END IF;
END
$postflight$;

COMMIT;
