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
