
-- Update the validate_vacation_request_period function to allow requests for both current and next period
CREATE OR REPLACE FUNCTION public.validate_vacation_request_period()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_period_start date;
  current_period_end date;
  next_period_start date;
  next_period_end date;
  user_remaining_days integer;
  is_in_current_period boolean;
  is_in_next_period boolean;
BEGIN
  -- Get current period from the user's vacation balance
  SELECT period_start, period_end, remaining_days 
  INTO current_period_start, current_period_end, user_remaining_days
  FROM public.vacation_balance
  WHERE user_id = NEW.user_id;
  
  -- Calculate next period (one year after current period)
  next_period_start := current_period_end + INTERVAL '1 day';
  next_period_end := next_period_start + INTERVAL '1 year' - INTERVAL '1 day';
  
  -- Check if dates are in current period
  is_in_current_period := (NEW.start_date >= current_period_start AND NEW.start_date <= current_period_end AND
                           NEW.end_date >= current_period_start AND NEW.end_date <= current_period_end);
  
  -- Check if dates are in next period
  is_in_next_period := (NEW.start_date >= next_period_start AND NEW.start_date <= next_period_end AND
                        NEW.end_date >= next_period_start AND NEW.end_date <= next_period_end);
  
  -- Validate that dates are within either current or next period
  IF NOT is_in_current_period AND NOT is_in_next_period THEN
    RAISE EXCEPTION 'Las fechas deben estar dentro del periodo actual (% - %) o el próximo periodo (% - %)', 
      current_period_start, current_period_end, next_period_start, next_period_end;
  END IF;
  
  -- Only validate remaining days for current period requests (INSERT only)
  IF TG_OP = 'INSERT' AND is_in_current_period AND NEW.total_days > user_remaining_days THEN
    RAISE EXCEPTION 'No puede solicitar más días (%) de los disponibles (%) en el periodo actual', 
      NEW.total_days, user_remaining_days;
  END IF;
  
  -- For next period, we don't validate against remaining_days in the trigger
  -- because the balance for next period is calculated dynamically
  
  RETURN NEW;
END;
$$;
