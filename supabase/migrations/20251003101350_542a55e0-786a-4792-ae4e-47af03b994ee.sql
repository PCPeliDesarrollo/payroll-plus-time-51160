-- Fix security warnings by setting search_path on security definer functions

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'employee')
  );
  
  INSERT INTO public.vacation_balance (user_id, total_days, remaining_days)
  VALUES (new.id, 22, 22);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update update_vacation_balance function
CREATE OR REPLACE FUNCTION public.update_vacation_balance()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.vacation_balance 
    SET 
      used_days = used_days + NEW.total_days,
      remaining_days = total_days - (used_days + NEW.total_days),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.vacation_balance 
    SET 
      used_days = used_days - NEW.total_days,
      remaining_days = total_days - (used_days - NEW.total_days),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;