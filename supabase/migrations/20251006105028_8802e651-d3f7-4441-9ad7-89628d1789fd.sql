-- Arreglar políticas RLS de storage para payroll-files
-- Primero eliminar las políticas existentes si las hay
DROP POLICY IF EXISTS "Authenticated users can view payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins have full access to payroll files" ON storage.objects;

-- Crear políticas correctas para payroll-files
-- Admins pueden ver archivos de payroll
CREATE POLICY "Admins can view payroll files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'payroll-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins pueden subir archivos de payroll
CREATE POLICY "Admins can upload payroll files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payroll-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins pueden actualizar archivos de payroll
CREATE POLICY "Admins can update payroll files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'payroll-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Admins pueden eliminar archivos de payroll
CREATE POLICY "Admins can delete payroll files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'payroll-files' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);