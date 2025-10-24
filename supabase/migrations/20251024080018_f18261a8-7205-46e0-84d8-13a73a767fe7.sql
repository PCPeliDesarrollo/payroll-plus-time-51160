-- =====================================================
-- SISTEMA MULTI-TENANT - VERSIÓN ORGANIZADA
-- =====================================================

-- PASO 1: Eliminar TODAS las políticas de storage que dependen del enum
DROP POLICY IF EXISTS "Admins can view payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Admins full access to payroll files" ON storage.objects;

-- PASO 2: Eliminar has_role con CASCADE
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;

-- PASO 3: Cambiar el enum
DO $$ 
BEGIN
  ALTER TYPE public.app_role RENAME TO app_role_old;
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'employee');
  ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;
  DROP TYPE public.app_role_old CASCADE;
END $$;

-- PASO 4: Crear tabla companies
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- PASO 5: Agregar company_id a todas las tablas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.payroll_records ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.vacation_requests ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.vacation_balance ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.schedule_changes ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.compensatory_days ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- PASO 6: Crear índices
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_company_id ON public.time_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_company_id ON public.payroll_records(company_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_company_id ON public.vacation_requests(company_id);

-- PASO 7: Crear funciones de seguridad
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id
$$;

-- PASO 8: Eliminar políticas existentes que queremos recrear
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage company profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Super admins can view all time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Admins can view company time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Admins can manage company time entries" ON public.time_entries;

DROP POLICY IF EXISTS "Users can view own vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Users can insert own vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Users can update own pending vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Admins can view company vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Admins can update company vacation requests" ON public.vacation_requests;

DROP POLICY IF EXISTS "Users can view own vacation balance" ON public.vacation_balance;
DROP POLICY IF EXISTS "Admins can view company vacation balances" ON public.vacation_balance;
DROP POLICY IF EXISTS "Admins can manage company vacation balances" ON public.vacation_balance;

DROP POLICY IF EXISTS "Users can view own schedule changes" ON public.schedule_changes;
DROP POLICY IF EXISTS "Users can create own schedule changes" ON public.schedule_changes;
DROP POLICY IF EXISTS "Users can update own pending schedule changes" ON public.schedule_changes;
DROP POLICY IF EXISTS "Admins can view company schedule changes" ON public.schedule_changes;
DROP POLICY IF EXISTS "Admins can update company schedule changes" ON public.schedule_changes;

DROP POLICY IF EXISTS "Users can view own payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Admins can view company payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Admins can manage company payroll" ON public.payroll_records;

DROP POLICY IF EXISTS "Users can view own compensatory days" ON public.compensatory_days;
DROP POLICY IF EXISTS "Admins can view company compensatory days" ON public.compensatory_days;
DROP POLICY IF EXISTS "Admins can manage company compensatory days" ON public.compensatory_days;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- PASO 9: Crear políticas RLS

-- Companies
CREATE POLICY "Super admins can manage companies"
ON public.companies FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view their company"
ON public.companies FOR SELECT
USING (id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Employees can view their company"
ON public.companies FOR SELECT
USING (id = public.get_user_company_id(auth.uid()));

-- Profiles
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view company profiles"
ON public.profiles FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  AND company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Super admins can manage all profiles"
ON public.profiles FOR ALL
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage company profiles"
ON public.profiles FOR ALL
USING (
  has_role(auth.uid(), 'admin') 
  AND company_id = public.get_user_company_id(auth.uid())
);

-- User Roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

-- Time Entries
CREATE POLICY "Users can view own time entries"
ON public.time_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own time entries"
ON public.time_entries FOR INSERT
WITH CHECK (auth.uid() = user_id AND company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own time entries"
ON public.time_entries FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all time entries"
ON public.time_entries FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view company time entries"
ON public.time_entries FOR SELECT
USING (
  has_role(auth.uid(), 'admin') 
  AND company_id = public.get_user_company_id(auth.uid())
);

CREATE POLICY "Admins can manage company time entries"
ON public.time_entries FOR ALL
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

-- Vacation Requests
CREATE POLICY "Users can view own vacation requests"
ON public.vacation_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vacation requests"
ON public.vacation_requests FOR INSERT
WITH CHECK (auth.uid() = user_id AND company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own pending vacation requests"
ON public.vacation_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view company vacation requests"
ON public.vacation_requests FOR SELECT
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Admins can update company vacation requests"
ON public.vacation_requests FOR UPDATE
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

-- Vacation Balance
CREATE POLICY "Users can view own vacation balance"
ON public.vacation_balance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view company vacation balances"
ON public.vacation_balance FOR SELECT
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Admins can manage company vacation balances"
ON public.vacation_balance FOR ALL
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

-- Schedule Changes
CREATE POLICY "Users can view own schedule changes"
ON public.schedule_changes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own schedule changes"
ON public.schedule_changes FOR INSERT
WITH CHECK (auth.uid() = user_id AND company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own pending schedule changes"
ON public.schedule_changes FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view company schedule changes"
ON public.schedule_changes FOR SELECT
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Admins can update company schedule changes"
ON public.schedule_changes FOR UPDATE
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

-- Payroll Records
CREATE POLICY "Users can view own payroll"
ON public.payroll_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view company payroll"
ON public.payroll_records FOR SELECT
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Admins can manage company payroll"
ON public.payroll_records FOR ALL
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

-- Compensatory Days
CREATE POLICY "Users can view own compensatory days"
ON public.compensatory_days FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view company compensatory days"
ON public.compensatory_days FOR SELECT
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Admins can manage company compensatory days"
ON public.compensatory_days FOR ALL
USING (
  (has_role(auth.uid(), 'admin') AND company_id = public.get_user_company_id(auth.uid()))
  OR public.is_super_admin(auth.uid())
);

-- Notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Storage Policies
CREATE POLICY "Admins can view payroll files"
ON storage.objects FOR SELECT
USING (bucket_id = 'payroll-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload payroll files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payroll-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payroll files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'payroll-files' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payroll files"
ON storage.objects FOR DELETE
USING (bucket_id = 'payroll-files' AND has_role(auth.uid(), 'admin'));

-- PASO 10: Actualizar trigger handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  IF (new.raw_user_meta_data->>'role')::text = 'super_admin' THEN
    new_company_id := NULL;
  ELSE
    IF new.raw_user_meta_data->>'company_id' IS NOT NULL THEN
      new_company_id := (new.raw_user_meta_data->>'company_id')::UUID;
    ELSE
      new_company_id := NULL;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, company_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'employee'),
    new_company_id
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'employee')
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  IF new_company_id IS NOT NULL THEN
    INSERT INTO public.vacation_balance (user_id, company_id, total_days, remaining_days)
    VALUES (new.id, new_company_id, 22, 22);
  END IF;
  
  RETURN new;
END;
$$;