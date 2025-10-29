-- Arreglar políticas de compensatory_days: DROP y recrear con WITH CHECK
DROP POLICY IF EXISTS "Admins can manage company compensatory days" ON public.compensatory_days;

CREATE POLICY "Admins can manage company compensatory days"
ON public.compensatory_days FOR ALL
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin(auth.uid())
);

-- Arreglar políticas de payroll_records: DROP y recrear con WITH CHECK
DROP POLICY IF EXISTS "Admins can manage company payroll" ON public.payroll_records;

CREATE POLICY "Admins can manage company payroll"
ON public.payroll_records FOR ALL
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin(auth.uid())
)
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin(auth.uid())
);