-- Add RLS policy for admins to insert time entries for all users
CREATE POLICY "Admins can insert all time entries"
ON public.time_entries
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));