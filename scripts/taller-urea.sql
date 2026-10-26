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
