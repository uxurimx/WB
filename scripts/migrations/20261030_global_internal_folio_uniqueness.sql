-- Impide repetir el número del folio entre cargas Patio/Campo y transferencias,
-- sin importar la serie (BASE o una serie creada posteriormente).
-- No altera folios históricos existentes. Aplicar manualmente solo tras confirmar
-- la rama de base de datos objetivo; no usar drizzle-kit push.
BEGIN;

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

COMMIT;
