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

CREATE TABLE IF NOT EXISTS orden_checklist (
  id serial PRIMARY KEY,
  orden_id integer NOT NULL,
  clave varchar(40) NOT NULL,
  ok boolean,
  nota text
);

CREATE INDEX IF NOT EXISTS orden_checklist_orden_id_idx ON orden_checklist (orden_id);

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
