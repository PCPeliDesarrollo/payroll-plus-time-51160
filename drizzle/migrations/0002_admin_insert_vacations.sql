CREATE POLICY "Admins can insert company vacation requests" ON public.vacation_requests FOR INSERT TO authenticated
WITH CHECK (
  (public.has_role(auth.uid(),'admin') AND public.get_user_company_id(user_id) = public.get_user_company_id(auth.uid()))
  OR public.has_role(auth.uid(),'super_admin')
);