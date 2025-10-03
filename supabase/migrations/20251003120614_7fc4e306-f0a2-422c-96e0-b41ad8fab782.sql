-- Asegurar que los admins pueden subir archivos al bucket payroll-files
-- Primero eliminamos las políticas existentes si las hay
DROP POLICY IF EXISTS "Admins can upload payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payroll files" ON storage.objects;

-- Permitir a admins subir archivos
CREATE POLICY "Admins can upload payroll files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payroll-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Permitir a admins ver archivos
CREATE POLICY "Admins can view payroll files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payroll-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Permitir a admins actualizar archivos
CREATE POLICY "Admins can update payroll files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payroll-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Permitir a admins eliminar archivos
CREATE POLICY "Admins can delete payroll files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'payroll-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Permitir a usuarios ver sus propios archivos de nómina
CREATE POLICY "Users can view their own payroll files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payroll-files'
);