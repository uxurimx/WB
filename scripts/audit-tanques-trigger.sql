-- Auditoría a nivel de base de datos para la tabla `tanques`.
-- Registra en audit_log todo UPDATE que cambie litros_actuales o cuentalitros_actual,
-- y todo DELETE de un tanque — sin importar el origen (app, consola de Neon, psql).
-- Ningún código de aplicación puede saltárselo.
--
-- Aplicar manualmente (Drizzle no gestiona triggers; NO usar db:push para esto):
--   psql "$DATABASE_URL" -f scripts/audit-tanques-trigger.sql
--
-- Las filas generadas llevan usuario_id NULL (el trigger no conoce al usuario de Clerk);
-- el "quién" lo aporta el registro app-level de audit_log (accion 'ajuste_stock', 'delete', etc.)
-- que ocurre en la misma operación.

CREATE OR REPLACE FUNCTION audit_tanques_fn() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (usuario_id, accion, entidad, entidad_id, datos_json)
    VALUES (NULL, 'db_delete', 'tanques', OLD.id::text, json_build_object(
      'nombre', OLD.nombre,
      'litros_actuales', OLD.litros_actuales,
      'cuentalitros_actual', OLD.cuentalitros_actual,
      'capacidad_max', OLD.capacidad_max
    )::text);
    RETURN OLD;
  END IF;

  IF (NEW.litros_actuales IS DISTINCT FROM OLD.litros_actuales)
     OR (NEW.cuentalitros_actual IS DISTINCT FROM OLD.cuentalitros_actual) THEN
    INSERT INTO audit_log (usuario_id, accion, entidad, entidad_id, datos_json)
    VALUES (NULL, 'db_update', 'tanques', NEW.id::text, json_build_object(
      'nombre', NEW.nombre,
      'litros_antes', OLD.litros_actuales,
      'litros_despues', NEW.litros_actuales,
      'cuentalitros_antes', OLD.cuentalitros_actual,
      'cuentalitros_despues', NEW.cuentalitros_actual
    )::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_tanques ON tanques;
CREATE TRIGGER audit_tanques
AFTER UPDATE OR DELETE ON tanques
FOR EACH ROW EXECUTE FUNCTION audit_tanques_fn();
