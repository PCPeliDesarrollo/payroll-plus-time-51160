
-- Modificar la tabla vacation_balance para incluir información del periodo
ALTER TABLE public.vacation_balance 
ADD COLUMN IF NOT EXISTS period_start date,
ADD COLUMN IF NOT EXISTS period_end date;

-- Actualizar registros existentes con el periodo actual (marzo 2025 - febrero 2026)
UPDATE public.vacation_balance
SET 
  period_start = CASE 
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 3 THEN 
      DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '2 months'
    ELSE 
      DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '10 months'
  END,
  period_end = CASE 
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 3 THEN 
      DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' + INTERVAL '1 month' + INTERVAL '27 days'
    ELSE 
      DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '27 days'
  END
WHERE period_start IS NULL;

-- Hacer las columnas NOT NULL después de la actualización
ALTER TABLE public.vacation_balance 
ALTER COLUMN period_start SET DEFAULT (
  CASE 
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 3 THEN 
      DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '2 months'
    ELSE 
      DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '10 months'
  END
)::date;

ALTER TABLE public.vacation_balance 
ALTER COLUMN period_end SET DEFAULT (
  CASE 
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 3 THEN 
      DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' + INTERVAL '1 month' + INTERVAL '27 days'
    ELSE 
      DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '27 days'
  END
)::date;

-- Función para obtener el periodo de vacaciones actual
CREATE OR REPLACE FUNCTION public.get_current_vacation_period()
RETURNS TABLE(period_start date, period_end date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXTRACT(MONTH FROM CURRENT_DATE) >= 3 THEN
    -- Estamos entre marzo y diciembre
    RETURN QUERY SELECT 
      (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '2 months')::date,
      (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' + INTERVAL '1 month' + INTERVAL '27 days')::date;
  ELSE
    -- Estamos entre enero y febrero
    RETURN QUERY SELECT 
      (DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '10 months')::date,
      (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '27 days')::date;
  END IF;
END;
$$;

-- Función para calcular vacaciones proporcionales según fecha de incorporación
CREATE OR REPLACE FUNCTION public.calculate_proportional_vacation_days(
  hire_date date,
  annual_days integer DEFAULT 22
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_period_start date;
  current_period_end date;
  effective_start date;
  months_in_period numeric;
  proportional_days integer;
BEGIN
  -- Obtener el periodo actual
  SELECT p.period_start, p.period_end 
  INTO current_period_start, current_period_end 
  FROM public.get_current_vacation_period() p;
  
  -- Si la fecha de contratación es anterior al inicio del periodo, usar todo el periodo
  IF hire_date <= current_period_start THEN
    RETURN annual_days;
  END IF;
  
  -- Si la fecha de contratación es posterior al fin del periodo, no tiene vacaciones
  IF hire_date > current_period_end THEN
    RETURN 0;
  END IF;
  
  -- Calcular meses proporcionales (desde fecha de contratación hasta fin del periodo)
  effective_start := hire_date;
  months_in_period := EXTRACT(YEAR FROM AGE(current_period_end, effective_start)) * 12 
                    + EXTRACT(MONTH FROM AGE(current_period_end, effective_start))
                    + (EXTRACT(DAY FROM AGE(current_period_end, effective_start)) / 30.0);
  
  -- Calcular días proporcionales y redondear al entero más cercano
  proportional_days := ROUND((annual_days::numeric / 12.0) * months_in_period);
  
  -- Asegurar que no exceda los días anuales
  IF proportional_days > annual_days THEN
    proportional_days := annual_days;
  END IF;
  
  -- Asegurar que no sea negativo
  IF proportional_days < 0 THEN
    proportional_days := 0;
  END IF;
  
  RETURN proportional_days;
END;
$$;

-- Actualizar la función handle_new_user para usar cálculo proporcional
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id UUID;
  employee_hire_date DATE;
  proportional_days INTEGER;
  current_period RECORD;
BEGIN
  IF (new.raw_user_meta_data->>'role')::text = 'super_admin' THEN
    new_company_id := NULL;
  ELSE
    IF new.raw_user_meta_data->>'company_id' IS NOT NULL THEN
      new_company_id := (new.raw_user_meta_data->>'company_id')::UUID;
    ELSE
      new_company_id := NULL;
    END IF;
  END IF;

  -- Determinar fecha de contratación
  employee_hire_date := COALESCE(
    (new.raw_user_meta_data->>'hire_date')::DATE, 
    CURRENT_DATE
  );

  INSERT INTO public.profiles (id, email, full_name, role, company_id, hire_date)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    new_company_id,
    employee_hire_date
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'employee')
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Crear balance de vacaciones con cálculo proporcional
  IF new_company_id IS NOT NULL THEN
    -- Calcular días proporcionales
    proportional_days := public.calculate_proportional_vacation_days(employee_hire_date, 22);
    
    -- Obtener periodo actual
    SELECT p.period_start, p.period_end INTO current_period FROM public.get_current_vacation_period() p;
    
    INSERT INTO public.vacation_balance (
      user_id, 
      company_id, 
      total_days, 
      remaining_days, 
      used_days,
      period_start,
      period_end
    )
    VALUES (
      new.id, 
      new_company_id, 
      proportional_days, 
      proportional_days,
      0,
      current_period.period_start,
      current_period.period_end
    );
  END IF;
  
  RETURN new;
END;
$$;

-- Función para renovar periodos de vacaciones (ejecutar el 1 de marzo)
CREATE OR REPLACE FUNCTION public.renew_vacation_periods()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_period_start date;
  new_period_end date;
  employee RECORD;
  proportional_days INTEGER;
BEGIN
  -- Calcular nuevo periodo
  new_period_start := DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '2 months';
  new_period_end := DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' + INTERVAL '1 month' + INTERVAL '27 days';
  
  -- Para cada empleado activo con balance de vacaciones
  FOR employee IN 
    SELECT vb.id, vb.user_id, vb.company_id, p.hire_date
    FROM public.vacation_balance vb
    JOIN public.profiles p ON p.id = vb.user_id
    WHERE p.is_active = true
  LOOP
    -- Calcular días proporcionales basados en fecha de contratación
    proportional_days := public.calculate_proportional_vacation_days(employee.hire_date, 22);
    
    -- Actualizar el balance con el nuevo periodo
    UPDATE public.vacation_balance
    SET 
      total_days = proportional_days,
      used_days = 0,
      remaining_days = proportional_days,
      period_start = new_period_start,
      period_end = new_period_end,
      updated_at = NOW()
    WHERE id = employee.id;
  END LOOP;
END;
$$;

-- Función para validar que las vacaciones estén dentro del periodo activo
CREATE OR REPLACE FUNCTION public.validate_vacation_request_period()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_period_start date;
  user_period_end date;
  user_remaining_days integer;
BEGIN
  -- Obtener el periodo del usuario
  SELECT period_start, period_end, remaining_days 
  INTO user_period_start, user_period_end, user_remaining_days
  FROM public.vacation_balance
  WHERE user_id = NEW.user_id;
  
  -- Validar que las fechas estén dentro del periodo activo
  IF NEW.start_date < user_period_start OR NEW.start_date > user_period_end THEN
    RAISE EXCEPTION 'La fecha de inicio debe estar dentro del periodo activo (% - %)', 
      user_period_start, user_period_end;
  END IF;
  
  IF NEW.end_date < user_period_start OR NEW.end_date > user_period_end THEN
    RAISE EXCEPTION 'La fecha de fin debe estar dentro del periodo activo (% - %)', 
      user_period_start, user_period_end;
  END IF;
  
  -- Validar que no solicite más días de los disponibles (solo para nuevas solicitudes)
  IF TG_OP = 'INSERT' AND NEW.total_days > user_remaining_days THEN
    RAISE EXCEPTION 'No puede solicitar más días (%) de los disponibles (%)', 
      NEW.total_days, user_remaining_days;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para validar solicitudes de vacaciones
DROP TRIGGER IF EXISTS validate_vacation_period_trigger ON public.vacation_requests;
CREATE TRIGGER validate_vacation_period_trigger
  BEFORE INSERT ON public.vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_vacation_request_period();

-- Función para prevenir modificaciones de solicitudes aprobadas/rechazadas por empleados
CREATE OR REPLACE FUNCTION public.prevent_vacation_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Si el estado anterior era approved o rejected, y el usuario no es admin
  IF OLD.status IN ('approved', 'rejected') THEN
    -- Verificar si el usuario que hace la modificación es admin
    IF NOT (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid())) THEN
      RAISE EXCEPTION 'Las solicitudes aprobadas o rechazadas no pueden ser modificadas';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Crear trigger para prevenir modificaciones
DROP TRIGGER IF EXISTS prevent_vacation_modification_trigger ON public.vacation_requests;
CREATE TRIGGER prevent_vacation_modification_trigger
  BEFORE UPDATE ON public.vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_vacation_modification();
