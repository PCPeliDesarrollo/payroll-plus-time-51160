-- Create vacation_periods table to store all vacation periods
CREATE TABLE public.vacation_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year integer NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  is_active boolean DEFAULT false,
  company_id uuid REFERENCES public.companies(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(year, company_id)
);

-- Enable RLS
ALTER TABLE public.vacation_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Employees can view company vacation periods"
ON public.vacation_periods FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can manage company vacation periods"
ON public.vacation_periods FOR ALL
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Insert periods from 2025 to 2030 for all existing companies
INSERT INTO public.vacation_periods (year, period_start, period_end, is_active, company_id)
SELECT 
  year_num,
  (year_num || '-03-01')::date as period_start,
  ((year_num + 1) || '-02-28')::date as period_end,
  CASE WHEN year_num = 2025 THEN true ELSE false END as is_active,
  c.id as company_id
FROM 
  generate_series(2025, 2030) as year_num,
  public.companies c;

-- Add period_id column to vacation_requests to track which period the request belongs to
ALTER TABLE public.vacation_requests 
ADD COLUMN IF NOT EXISTS period_id uuid REFERENCES public.vacation_periods(id);

-- Update the validate_vacation_request_period function to use periods table
CREATE OR REPLACE FUNCTION public.validate_vacation_request_period()
RETURNS TRIGGER
LANGUAGE plpgsql
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
    WHERE id = NEW.period_id AND company_id = user_company_id;
    
    IF period_start_date IS NULL THEN
      RAISE EXCEPTION 'Periodo de vacaciones no válido';
    END IF;
    
    IF NEW.start_date < period_start_date OR NEW.start_date > period_end_date OR
       NEW.end_date < period_start_date OR NEW.end_date > period_end_date THEN
      RAISE EXCEPTION 'Las fechas (% - %) deben estar dentro del periodo seleccionado (% - %)', 
        NEW.start_date, NEW.end_date, period_start_date, period_end_date;
    END IF;
  ELSE
    -- If no period_id, try to find the matching period and set it
    SELECT id, period_start, period_end INTO request_period_id, period_start_date, period_end_date
    FROM public.vacation_periods
    WHERE company_id = user_company_id
      AND NEW.start_date >= period_start 
      AND NEW.start_date <= period_end
      AND NEW.end_date >= period_start 
      AND NEW.end_date <= period_end;
    
    IF request_period_id IS NULL THEN
      RAISE EXCEPTION 'Las fechas de inicio y fin deben pertenecer al mismo periodo de vacaciones. No se pueden mezclar días de diferentes periodos.';
    END IF;
    
    NEW.period_id := request_period_id;
  END IF;
  
  RETURN NEW;
END;
$$;