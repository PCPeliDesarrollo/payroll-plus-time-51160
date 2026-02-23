
CREATE OR REPLACE FUNCTION public.update_vacation_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  balance_period_start date;
  balance_period_end date;
  request_start date;
BEGIN
  request_start := NEW.start_date;
  
  -- Get the user's current balance period
  SELECT period_start, period_end INTO balance_period_start, balance_period_end
  FROM public.vacation_balance
  WHERE user_id = NEW.user_id;
  
  -- Only update balance if the request falls within the current balance period
  IF balance_period_start IS NULL OR request_start < balance_period_start OR request_start > balance_period_end THEN
    RETURN NEW;
  END IF;

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

-- Also fix restore_vacation_balance_on_delete to check period
CREATE OR REPLACE FUNCTION public.restore_vacation_balance_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  balance_period_start date;
  balance_period_end date;
BEGIN
  IF OLD.status = 'approved' THEN
    -- Check if the request falls within the current balance period
    SELECT period_start, period_end INTO balance_period_start, balance_period_end
    FROM public.vacation_balance
    WHERE user_id = OLD.user_id;
    
    IF balance_period_start IS NOT NULL AND OLD.start_date >= balance_period_start AND OLD.start_date <= balance_period_end THEN
      UPDATE public.vacation_balance 
      SET 
        used_days = used_days - OLD.total_days,
        remaining_days = total_days - (used_days - OLD.total_days),
        updated_at = NOW()
      WHERE user_id = OLD.user_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$function$;
