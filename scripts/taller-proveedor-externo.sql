-- Registrar el proveedor externo que realiza trabajos en una orden de taller.
-- Aplicar manualmente en la rama Neon de pruebas antes de usar el campo.
ALTER TABLE ordenes_taller
  ADD COLUMN IF NOT EXISTS proveedor_externo TEXT;
