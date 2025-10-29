-- Permitir a los administradores eliminar solicitudes de vacaciones de su compañía
CREATE POLICY "Admins can delete company vacation requests"
ON public.vacation_requests FOR DELETE
USING (
  (has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid()))
  OR is_super_admin(auth.uid())
);