-- Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('payroll-files', 'payroll-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Eliminar políticas si existen
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Admins can upload payroll files" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can view payroll files" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update payroll files" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete payroll files" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view their own payroll files" ON storage.objects;
  DROP POLICY IF EXISTS "Public access to payroll files" ON storage.objects;
  DROP POLICY IF EXISTS "Admins full access to payroll files" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can view payroll files" ON storage.objects;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Política para que admins puedan hacer todo con archivos de payroll
CREATE POLICY "Admins full access to payroll files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'payroll-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'payroll-files' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Política para que usuarios autenticados puedan ver archivos de payroll
CREATE POLICY "Authenticated users can view payroll files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'payroll-files');

-- Crear tabla para cambios de horario
CREATE TABLE IF NOT EXISTS public.schedule_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_date DATE NOT NULL,
  current_check_in TIME,
  current_check_out TIME,
  requested_check_in TIME,
  requested_check_out TIME,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comments TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en schedule_changes
ALTER TABLE public.schedule_changes ENABLE ROW LEVEL SECURITY;

-- Políticas para schedule_changes
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own schedule changes" ON public.schedule_changes;
  DROP POLICY IF EXISTS "Users can create their own schedule changes" ON public.schedule_changes;
  DROP POLICY IF EXISTS "Users can update their own pending schedule changes" ON public.schedule_changes;
  DROP POLICY IF EXISTS "Admins can view all schedule changes" ON public.schedule_changes;
  DROP POLICY IF EXISTS "Admins can update all schedule changes" ON public.schedule_changes;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Users can view their own schedule changes"
ON public.schedule_changes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedule changes"
ON public.schedule_changes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending schedule changes"
ON public.schedule_changes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view all schedule changes"
ON public.schedule_changes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all schedule changes"
ON public.schedule_changes
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));