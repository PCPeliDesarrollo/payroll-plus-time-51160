-- Arreglar política RLS para permitir que admins inserten fichajes para otros usuarios
DROP POLICY IF EXISTS "Admins can manage company time entries" ON public.time_entries;

-- Crear política mejorada para admins que incluya WITH CHECK
CREATE POLICY "Admins can manage company time entries" 
ON public.time_entries
FOR ALL
USING ((has_role(auth.uid(), 'admin'::app_role) AND (company_id = get_user_company_id(auth.uid()))) OR is_super_admin(auth.uid()))
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) AND (company_id = get_user_company_id(auth.uid()))) OR is_super_admin(auth.uid()));