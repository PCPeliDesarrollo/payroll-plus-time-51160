-- Actualizar el trigger para manejar correctamente las ediciones de solicitudes aprobadas
CREATE OR REPLACE FUNCTION public.update_vacation_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Caso 1: Nueva aprobación (de pending/rejected a approved)
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.vacation_balance 
    SET 
      used_days = used_days + NEW.total_days,
      remaining_days = total_days - (used_days + NEW.total_days),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  
  -- Caso 2: Cancelación de aprobación (de approved a pending/rejected)
  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.vacation_balance 
    SET 
      used_days = used_days - OLD.total_days,
      remaining_days = total_days - (used_days - OLD.total_days),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  
  -- Caso 3: Edición de solicitud ya aprobada (cambio en total_days)
  ELSIF OLD.status = 'approved' AND NEW.status = 'approved' AND OLD.total_days != NEW.total_days THEN
    UPDATE public.vacation_balance 
    SET 
      used_days = used_days - OLD.total_days + NEW.total_days,
      remaining_days = total_days - (used_days - OLD.total_days + NEW.total_days),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$function$;