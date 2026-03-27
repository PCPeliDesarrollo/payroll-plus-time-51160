
CREATE TABLE public.employee_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL,
  is_working_day boolean NOT NULL DEFAULT true,
  check_in_time time without time zone DEFAULT '09:00:00',
  check_out_time time without time zone DEFAULT '17:00:00',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(employee_id, day_of_week)
);

ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company employee schedules"
ON public.employee_schedules
FOR ALL
TO public
USING (
  (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  (has_role(auth.uid(), 'admin') AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Employees can view own schedules"
ON public.employee_schedules
FOR SELECT
TO public
USING (auth.uid() = employee_id);
