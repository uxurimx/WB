-- Núcleo: reset de hubodómetro. Seguro de correr (IF NOT EXISTS).
-- No toca el índice único de folios.

ALTER TABLE unidades
  ADD COLUMN IF NOT EXISTS odometro_offset real DEFAULT 0;

CREATE TABLE IF NOT EXISTS odometro_resets (
  id serial PRIMARY KEY,
  unidad_id integer NOT NULL,
  fecha date NOT NULL,
  lectura_anterior real NOT NULL,
  lectura_nueva real NOT NULL DEFAULT 0,
  notas text,
  registrado_por_id text,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS odometro_resets_unidad_id_idx ON odometro_resets (unidad_id);
