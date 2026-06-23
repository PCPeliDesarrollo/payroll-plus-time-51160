
-- 1) NOTIFICATIONS: lock down INSERT to service_role only.
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
  ON public.notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2) STORAGE: allow employees to read ONLY their own payroll files.
DROP POLICY IF EXISTS "Employees can view own payroll files" ON storage.objects;
CREATE POLICY "Employees can view own payroll files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payroll-files'
    AND EXISTS (
      SELECT 1 FROM public.payroll_records pr
      WHERE pr.user_id = auth.uid()
        AND split_part(split_part(storage.objects.name, '/', 2), '.', 1) = pr.id::text
    )
  );

-- 3) USER_ROLES: replace the over-permissive admin policy.
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

CREATE POLICY "Super admins manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins manage roles within own company"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND role <> 'super_admin'::app_role
    AND EXISTS (
      SELECT 1 FROM public.profiles target
      WHERE target.id = user_roles.user_id
        AND target.company_id = public.get_user_company_id(auth.uid())
        AND target.company_id IS NOT NULL
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND role <> 'super_admin'::app_role
    AND EXISTS (
      SELECT 1 FROM public.profiles target
      WHERE target.id = user_roles.user_id
        AND target.company_id = public.get_user_company_id(auth.uid())
        AND target.company_id IS NOT NULL
    )
  );
