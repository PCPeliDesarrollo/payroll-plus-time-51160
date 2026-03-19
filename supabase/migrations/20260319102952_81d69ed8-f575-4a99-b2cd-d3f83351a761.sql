
-- Table for company schedules (per day of week)
CREATE TABLE public.company_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_working_day boolean NOT NULL DEFAULT true,
  check_in_time time WITHOUT TIME ZONE DEFAULT '09:00',
  check_out_time time WITHOUT TIME ZONE DEFAULT '17:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.company_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Super admins can manage all schedules"
  ON public.company_schedules FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage company schedules"
  ON public.company_schedules FOR ALL
  USING (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Employees can view company schedules"
  ON public.company_schedules FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

-- Add request_type to vacation_requests for half-day support
ALTER TABLE public.vacation_requests
  ADD COLUMN request_type text NOT NULL DEFAULT 'full_day';

-- Change total_days to numeric to support 0.5
ALTER TABLE public.vacation_requests
  ALTER COLUMN total_days TYPE numeric USING total_days::numeric;

-- Also update vacation_balance to support decimal days
ALTER TABLE public.vacation_balance
  ALTER COLUMN total_days TYPE numeric USING total_days::numeric,
  ALTER COLUMN used_days TYPE numeric USING used_days::numeric,
  ALTER COLUMN remaining_days TYPE numeric USING remaining_days::numeric;
