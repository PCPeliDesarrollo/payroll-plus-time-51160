-- Agregar política específica para permitir INSERT de días compensatorios por administradores
CREATE POLICY "Admins can insert company compensatory days"
ON public.compensatory_days FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin(auth.uid())
);