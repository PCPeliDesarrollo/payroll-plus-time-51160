-- Crear función para validar solapamiento de fechas en solicitudes de vacaciones
CREATE OR REPLACE FUNCTION public.check_vacation_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar si existe alguna solicitud pendiente o aprobada que se solape con las fechas nuevas
  IF EXISTS (
    SELECT 1
    FROM public.vacation_requests
    WHERE user_id = NEW.user_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('pending', 'approved')
      AND (
        -- La nueva fecha de inicio está dentro de un rango existente
        (NEW.start_date >= start_date AND NEW.start_date <= end_date)
        OR
        -- La nueva fecha de fin está dentro de un rango existente
        (NEW.end_date >= start_date AND NEW.end_date <= end_date)
        OR
        -- El nuevo rango engloba completamente un rango existente
        (NEW.start_date <= start_date AND NEW.end_date >= end_date)
      )
  ) THEN
    RAISE EXCEPTION 'Ya existe una solicitud de vacaciones para estas fechas o parte de ellas';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para validar antes de insertar o actualizar
DROP TRIGGER IF EXISTS validate_vacation_overlap_insert ON public.vacation_requests;
CREATE TRIGGER validate_vacation_overlap_insert
  BEFORE INSERT OR UPDATE ON public.vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_vacation_overlap();