-- Eliminar trigger existente
DROP TRIGGER IF EXISTS restore_balance_on_vacation_delete ON public.vacation_requests;

-- Función para devolver días al balance cuando se elimina una solicitud aprobada
CREATE OR REPLACE FUNCTION public.restore_vacation_balance_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si la solicitud eliminada estaba aprobada, devolver los días al balance
  IF OLD.status = 'approved' THEN
    UPDATE public.vacation_balance 
    SET 
      used_days = used_days - OLD.total_days,
      remaining_days = total_days - (used_days - OLD.total_days),
      updated_at = NOW()
    WHERE user_id = OLD.user_id;
  END IF;
  
  RETURN OLD;
END;
$$;

-- Crear trigger para ejecutar la función antes de eliminar
CREATE TRIGGER restore_balance_on_vacation_delete
BEFORE DELETE ON public.vacation_requests
FOR EACH ROW
EXECUTE FUNCTION public.restore_vacation_balance_on_delete();