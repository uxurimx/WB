-- Respuestas explícitas para el checklist: si, no o na.
-- El valor NULL conserva los puntos que aún no se han contestado.
ALTER TABLE orden_checklist
  ADD COLUMN IF NOT EXISTS respuesta VARCHAR(2);

-- Conserva el sentido de las respuestas existentes al migrar desde ok:boolean.
UPDATE orden_checklist
SET respuesta = CASE WHEN ok IS TRUE THEN 'si' WHEN ok IS FALSE THEN 'no' ELSE NULL END
WHERE respuesta IS NULL;
