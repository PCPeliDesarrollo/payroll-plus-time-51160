-- Arreglar políticas de time_entries
DROP POLICY IF EXISTS "Admins can view all time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Admins can update all time entries" ON public.time_entries;

CREATE POLICY "Admins can view all time entries"
ON public.time_entries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all time entries"
ON public.time_entries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Arreglar políticas de vacation_requests
DROP POLICY IF EXISTS "Admins can view all vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Admins can update all vacation requests" ON public.vacation_requests;

CREATE POLICY "Admins can view all vacation requests"
ON public.vacation_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all vacation requests"
ON public.vacation_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Arreglar políticas de vacation_balance
DROP POLICY IF EXISTS "Admins can view all vacation balances" ON public.vacation_balance;
DROP POLICY IF EXISTS "Admins can manage vacation balances" ON public.vacation_balance;

CREATE POLICY "Admins can view all vacation balances"
ON public.vacation_balance
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage vacation balances"
ON public.vacation_balance
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Arreglar políticas de payroll_records
DROP POLICY IF EXISTS "Admins can view all payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Admins can manage payroll" ON public.payroll_records;

CREATE POLICY "Admins can view all payroll"
ON public.payroll_records
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage payroll"
ON public.payroll_records
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));