-- Drop existing policies
DROP POLICY IF EXISTS "Admins can upload payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payroll files" ON storage.objects;

-- Create updated policies that include super_admin
CREATE POLICY "Admins can upload payroll files"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'payroll-files' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
);

CREATE POLICY "Admins can view payroll files"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'payroll-files' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
);

CREATE POLICY "Admins can update payroll files"
ON storage.objects FOR UPDATE
TO public
USING (
  bucket_id = 'payroll-files' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
);

CREATE POLICY "Admins can delete payroll files"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'payroll-files' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR is_super_admin(auth.uid()))
);