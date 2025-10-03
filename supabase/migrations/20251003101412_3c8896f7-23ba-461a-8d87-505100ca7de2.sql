-- Fix remaining security warning by setting search_path on calculate_total_hours function

CREATE OR REPLACE FUNCTION public.calculate_total_hours()
RETURNS trigger AS $$
BEGIN
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    NEW.total_hours = NEW.check_out_time - NEW.check_in_time;
    NEW.status = 'checked_out';
  ELSIF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NULL THEN
    NEW.status = 'checked_in';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;