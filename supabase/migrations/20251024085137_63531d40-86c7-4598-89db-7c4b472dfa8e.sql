-- Crear función para migrar solicitudes de vacaciones ignorando validaciones
CREATE OR REPLACE FUNCTION migrate_vacation_requests(target_company_id uuid)
RETURNS TABLE (updated_count integer, error_message text) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Deshabilitar el trigger temporalmente
  ALTER TABLE vacation_requests DISABLE TRIGGER check_vacation_overlap_trigger;
  
  -- Actualizar las solicitudes sin company_id
  UPDATE vacation_requests
  SET company_id = target_company_id
  WHERE company_id IS NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Re-habilitar el trigger
  ALTER TABLE vacation_requests ENABLE TRIGGER check_vacation_overlap_trigger;
  
  RETURN QUERY SELECT v_count, NULL::text;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-habilitar el trigger en caso de error
    ALTER TABLE vacation_requests ENABLE TRIGGER check_vacation_overlap_trigger;
    RETURN QUERY SELECT 0, SQLERRM;
END;
$$;