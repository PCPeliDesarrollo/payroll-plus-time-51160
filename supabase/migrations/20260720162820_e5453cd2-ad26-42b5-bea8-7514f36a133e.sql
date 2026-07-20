-- Fix vacation period validation so employees of any company (or with null company_id) can request vacations
-- when no company-specific vacation period exists.

-- 1. Update the validation function to fall back to any period covering the dates
CREATE OR REPLACE FUNCTION public.validate_vacation_request_period()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_period_id uuid;
  period_start_date date;
  period_end_date date;
  user_company_id uuid;
BEGIN
  -- Get user's company_id
  SELECT company_id INTO user_company_id FROM public.profiles WHERE id = NEW.user_id;

  -- If period_id is provided, validate dates are within that period
  IF NEW.period_id IS NOT NULL THEN
    SELECT period_start, period_end INTO period_start_date, period_end_date
    FROM public.vacation_periods
    WHERE id = NEW.period_id AND (company_id = user_company_id OR user_company_id IS NULL);

    IF period_start_date IS NULL THEN
      RAISE EXCEPTION 'Periodo de vacaciones no válido';
    END IF;

    IF NEW.start_date < period_start_date OR NEW.start_date > period_end_date OR
       NEW.end_date < period_start_date OR NEW.end_date > period_end_date THEN
      RAISE EXCEPTION 'Las fechas (% - %) deben estar dentro del periodo seleccionado (% - %)',
        NEW.start_date, NEW.end_date, period_start_date, period_end_date;
    END IF;
  ELSE
    -- First try to find a period matching the user's company
    SELECT id, period_start, period_end INTO request_period_id, period_start_date, period_end_date
    FROM public.vacation_periods
    WHERE company_id = user_company_id
      AND NEW.start_date >= period_start
      AND NEW.start_date <= period_end
      AND NEW.end_date >= period_start
      AND NEW.end_date <= period_end;

    -- Fallback: any period covering the dates (handles missing company-specific periods or null company_id)
    IF request_period_id IS NULL THEN
      SELECT id, period_start, period_end INTO request_period_id, period_start_date, period_end_date
      FROM public.vacation_periods
      WHERE NEW.start_date >= period_start
        AND NEW.start_date <= period_end
        AND NEW.end_date >= period_start
        AND NEW.end_date <= period_end
      LIMIT 1;
    END IF;

    IF request_period_id IS NULL THEN
      RAISE EXCEPTION 'Las fechas de inicio y fin deben pertenecer al mismo periodo de vacaciones. No se pueden mezclar días de diferentes periodos.';
    END IF;

    NEW.period_id := request_period_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Create vacation periods for every company that does not already have them
INSERT INTO public.vacation_periods (year, period_start, period_end, is_active, company_id)
SELECT
  y.year,
  make_date(y.year, 3, 1) AS period_start,
  make_date(y.year + 1, 2, 28) AS period_end,
  (y.year = EXTRACT(YEAR FROM CURRENT_DATE) - CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) < 3 THEN 1 ELSE 0 END) AS is_active,
  c.company_id
FROM (
  SELECT DISTINCT company_id
  FROM public.profiles
  WHERE company_id IS NOT NULL
) c
CROSS JOIN (
  SELECT generate_series(2025, 2030) AS year
) y
WHERE NOT EXISTS (
  SELECT 1
  FROM public.vacation_periods vp
  WHERE vp.company_id = c.company_id AND vp.year = y.year
);