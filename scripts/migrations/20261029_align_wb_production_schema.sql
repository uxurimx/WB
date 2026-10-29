-- Alineación aditiva de esquema para WBConstruccion production.
-- Destino esperado: project young-lake-03419545 / branch br-misty-paper-an02nufq / database neondb.
-- Ejecutar con Neon CLI apuntando explícitamente a production y --single-transaction.
-- No importa datos de Neon pruebas; conserva cargas/transferencias existentes.
-- Respaldo previo: WBConstruccion-production-20261029010526.dump
-- SHA-256: 7974433ab1bfbc6a1eff534bb146526606cd7d4912d4d39c3fa651f52c586419
SET lock_timeout = '15s';
SET statement_timeout = '5min';

DO $guard$
BEGIN
  IF current_database() <> 'neondb' THEN
    RAISE EXCEPTION 'Destino incorrecto: se esperaba la base neondb.';
  END IF;
  IF current_user <> 'neondb_owner' THEN
    RAISE EXCEPTION 'Ejecutar como neondb_owner para conservar propiedad de objetos.';
  END IF;
  IF current_setting('server_version_num')::integer < 170000
     OR current_setting('server_version_num')::integer >= 180000 THEN
    RAISE EXCEPTION 'Version PostgreSQL inesperada; se esperaba PostgreSQL 17.';
  END IF;
  IF to_regclass('public.folio_series') IS NOT NULL
     OR to_regclass('public.ordenes_taller') IS NOT NULL
     OR to_regclass('public.incidencias_taller') IS NOT NULL
     OR to_regclass('public.taller_eventos') IS NOT NULL
     OR to_regclass('public.taller_urea') IS NOT NULL
     OR to_regclass('public.push_subscriptions') IS NOT NULL
     OR EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public'
         AND table_name IN ('cargas','transferencias_tanque')
         AND column_name='folio_serie_id'
     ) THEN
    RAISE EXCEPTION 'El esquema objetivo ya tiene parte de la migracion; se detiene para revision.';
  END IF;
END
$guard$;

LOCK TABLE cargas, transferencias_tanque IN SHARE ROW EXCLUSIVE MODE;

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
    SELECT 1 FROM configuracion
    WHERE clave IN ('folio_min_patio','folio_max_patio','folio_base','folio_min_campo','folio_max_campo','folio_base_campo')
      AND valor !~ '^[0-9]+$'
  ) THEN RAISE EXCEPTION 'Hay configuración de folios inválida.'; END IF;
  IF EXISTS (
    SELECT 1 FROM mantenimientos_planes p LEFT JOIN unidades u ON u.id=p.unidad_id WHERE u.id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM mantenimientos_eventos e LEFT JOIN unidades u ON u.id=e.unidad_id WHERE u.id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM mantenimientos_eventos e LEFT JOIN mantenimientos_planes p ON p.id=e.plan_id
    WHERE e.plan_id IS NOT NULL AND p.id IS NULL
  ) THEN RAISE EXCEPTION 'Hay referencias de mantenimiento huérfanas.'; END IF;
END
$preflight$;

CREATE TEMP TABLE _wb_schema_preflight ON COMMIT DROP AS
SELECT
  (SELECT count(*)::bigint FROM cargas) AS cargas_count,
  (SELECT count(*)::bigint FROM transferencias_tanque) AS transferencias_count,
  (SELECT md5(coalesce(string_agg(id::text||':'||coalesce(folio::text,'')||':'||coalesce(origen,''),',' ORDER BY id),'')) FROM cargas) AS cargas_fingerprint,
  (SELECT md5(coalesce(string_agg(id::text||':'||coalesce(folio::text,''),',' ORDER BY id),'')) FROM transferencias_tanque) AS transferencias_fingerprint;


-- Fuente: scripts/folio-series.sql
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


-- Fuente: scripts/taller-ordenes.sql
CREATE TABLE IF NOT EXISTS ordenes_taller (
  id serial PRIMARY KEY,
  unidad_id integer NOT NULL,
  operador_id integer,
  fecha date NOT NULL,
  km_hrs real,
  motivo text,
  estado varchar(20) NOT NULL DEFAULT 'abierta',
  es_preventivo boolean NOT NULL DEFAULT false,
  tipo_control_preventivo varchar(10),
  evento_mantenimiento_id integer,
  quien_recibio text,
  quien_atendio text,
  comentarios text,
  proximo_mto text,
  abierto_por_id text,
  cerrado_por_id text,
  cerrado_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ordenes_taller_unidad_id_idx ON ordenes_taller (unidad_id);
CREATE INDEX IF NOT EXISTS ordenes_taller_estado_idx ON ordenes_taller (estado);
CREATE INDEX IF NOT EXISTS ordenes_taller_fecha_idx ON ordenes_taller (fecha);

-- Columnas añadidas después de la migración inicial de bitácora.
ALTER TABLE ordenes_taller ADD COLUMN IF NOT EXISTS actualizado_por_id text;

CREATE TABLE IF NOT EXISTS orden_checklist (
  id serial PRIMARY KEY,
  orden_id integer NOT NULL,
  clave varchar(40) NOT NULL,
  ok boolean,
  nota text
);

CREATE INDEX IF NOT EXISTS orden_checklist_orden_id_idx ON orden_checklist (orden_id);

-- Se guarda como JSON serializado por la aplicación (URL y key de UploadThing).
ALTER TABLE orden_checklist ADD COLUMN IF NOT EXISTS fotos text;

CREATE TABLE IF NOT EXISTS orden_refacciones (
  id serial PRIMARY KEY,
  orden_id integer NOT NULL,
  descripcion text NOT NULL,
  cantidad real DEFAULT 1,
  cajas real,
  precio real,
  iva boolean NOT NULL DEFAULT true,
  proveedor text,
  folio_factura text
);

CREATE INDEX IF NOT EXISTS orden_refacciones_orden_id_idx ON orden_refacciones (orden_id);

CREATE TABLE IF NOT EXISTS orden_taller_log (
  id serial PRIMARY KEY,
  orden_id integer NOT NULL,
  usuario_id text NOT NULL,
  accion varchar(30) NOT NULL,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orden_taller_log_orden_id_idx ON orden_taller_log (orden_id);


-- Fuente: scripts/taller-incidencias.sql
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


-- Fuente: scripts/taller-folios-incidencias.sql
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

-- Fuente: scripts/taller-categorias-folios.sql
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


-- Fuente: scripts/taller-expediente-detalle.sql
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


-- Fuente: scripts/taller-proveedor-externo.sql
-- Registrar el proveedor externo que realiza trabajos en una orden de taller.
-- Aplicar manualmente en la rama Neon de pruebas antes de usar el campo.
ALTER TABLE ordenes_taller
  ADD COLUMN IF NOT EXISTS proveedor_externo TEXT;


-- Fuente: scripts/taller-urea.sql
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


-- Fuente: scripts/taller-checklist-respuesta.sql
-- Respuestas explícitas para el checklist: si, no o na.
-- El valor NULL conserva los puntos que aún no se han contestado.
ALTER TABLE orden_checklist
  ADD COLUMN IF NOT EXISTS respuesta VARCHAR(2);

-- Conserva el sentido de las respuestas existentes al migrar desde ok:boolean.
UPDATE orden_checklist
SET respuesta = CASE WHEN ok IS TRUE THEN 'si' WHEN ok IS FALSE THEN 'no' ELSE NULL END
WHERE respuesta IS NULL;


-- Tabla usada por notificaciones PWA en el código actual, ausente también en pruebas.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id serial PRIMARY KEY,
  usuario_id text NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Mantiene las mismas relaciones de mantenimiento que la rama Neon de pruebas.
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

-- La secuencia está vacía en esta copia; el primer folio debe ser 1.
DO $sequence$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ordenes_taller)
     AND NOT EXISTS (SELECT 1 FROM incidencias_taller WHERE folio IS NOT NULL) THEN
    PERFORM setval('taller_folio_seq', 1, false);
  END IF;
END
$sequence$;

DO $postflight$
DECLARE
  before_state record;
  after_state record;
BEGIN
  SELECT * INTO before_state FROM _wb_schema_preflight;
  SELECT
    (SELECT count(*)::bigint FROM cargas) AS cargas_count,
    (SELECT count(*)::bigint FROM transferencias_tanque) AS transferencias_count,
    (SELECT md5(coalesce(string_agg(id::text||':'||coalesce(folio::text,'')||':'||coalesce(origen,''),',' ORDER BY id),'')) FROM cargas) AS cargas_fingerprint,
    (SELECT md5(coalesce(string_agg(id::text||':'||coalesce(folio::text,''),',' ORDER BY id),'')) FROM transferencias_tanque) AS transferencias_fingerprint
  INTO after_state;
  IF before_state.cargas_count<>after_state.cargas_count
     OR before_state.transferencias_count<>after_state.transferencias_count
     OR before_state.cargas_fingerprint<>after_state.cargas_fingerprint
     OR before_state.transferencias_fingerprint<>after_state.transferencias_fingerprint THEN
    RAISE EXCEPTION 'Cambió la identidad o el folio original de cargas/transferencias.';
  END IF;
  IF (SELECT count(*) FROM folio_series)<>2 THEN
    RAISE EXCEPTION 'Se esperaban exactamente dos series BASE.';
  END IF;
  IF EXISTS (SELECT 1 FROM cargas WHERE origen IN ('patio','campo') AND folio_serie_id IS NULL)
     OR EXISTS (SELECT 1 FROM transferencias_tanque WHERE folio_serie_id IS NULL) THEN
    RAISE EXCEPTION 'Quedaron cargas o transferencias sin serie.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM cargas WHERE folio IS NOT NULL AND folio_serie_id IS NOT NULL
    GROUP BY folio,origen,folio_serie_id HAVING count(*)>1
  ) OR EXISTS (
    SELECT 1 FROM transferencias_tanque WHERE folio IS NOT NULL
    GROUP BY folio_serie_id,folio HAVING count(*)>1
  ) THEN RAISE EXCEPTION 'La validación final detectó folios duplicados.'; END IF;
  IF (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE')<>33 THEN
    RAISE EXCEPTION 'Se esperaba el esquema actual de 33 tablas.';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public')<>341 THEN
    RAISE EXCEPTION 'Se esperaba el esquema actual de 341 columnas.';
  END IF;
END
$postflight$;

SELECT
  current_database() AS destino,
  (SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE') AS tablas,
  (SELECT count(*) FROM information_schema.columns WHERE table_schema='public') AS columnas,
  (SELECT count(*) FROM cargas) AS cargas,
  (SELECT count(*) FROM transferencias_tanque) AS transferencias,
  (SELECT count(*) FROM folio_series) AS series,
  (SELECT count(*) FROM ordenes_taller) AS ordenes_taller;
