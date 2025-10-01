-- Employee Time Tracking Database Setup
-- Run this SQL script in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  employee_id TEXT UNIQUE,
  department TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_hours INTERVAL,
  status TEXT CHECK (status IN ('checked_in', 'checked_out', 'incomplete')) DEFAULT 'incomplete',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payroll_records table (fixing table name consistency)
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL,
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  overtime_rate DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  bonuses DECIMAL(10,2) DEFAULT 0,
  net_salary DECIMAL(10,2) NOT NULL,
  file_url TEXT,
  status TEXT CHECK (status IN ('draft', 'approved', 'paid')) DEFAULT 'draft',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

-- Create vacation_requests table
CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vacation_balance table
CREATE TABLE IF NOT EXISTS public.vacation_balance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 22,
  used_days INTEGER NOT NULL DEFAULT 0,
  remaining_days INTEGER NOT NULL DEFAULT 22,
  year INTEGER NOT NULL DEFAULT EXTRACT(year FROM CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_balance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles; 
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Admins can view all time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can insert own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can update own time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Admins can update all time entries" ON public.time_entries;
DROP POLICY IF EXISTS "Users can view own payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Admins can view all payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Admins can manage payroll" ON public.payroll_records;
DROP POLICY IF EXISTS "Users can view own vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Admins can view all vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Users can insert own vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Users can update own pending vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Admins can update all vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Users can view own vacation balance" ON public.vacation_balance;
DROP POLICY IF EXISTS "Admins can view all vacation balances" ON public.vacation_balance;
DROP POLICY IF EXISTS "Admins can manage vacation balances" ON public.vacation_balance;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for time_entries
CREATE POLICY "Users can view own time entries" ON public.time_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all time entries" ON public.time_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own time entries" ON public.time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own time entries" ON public.time_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all time entries" ON public.time_entries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for payroll_records
CREATE POLICY "Users can view own payroll" ON public.payroll_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payroll" ON public.payroll_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage payroll" ON public.payroll_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for vacation_requests
CREATE POLICY "Users can view own vacation requests" ON public.vacation_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vacation requests" ON public.vacation_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own vacation requests" ON public.vacation_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending vacation requests" ON public.vacation_requests
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can update all vacation requests" ON public.vacation_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for vacation_balance
CREATE POLICY "Users can view own vacation balance" ON public.vacation_balance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all vacation balances" ON public.vacation_balance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage vacation balances" ON public.vacation_balance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Functions and Triggers

-- Function to handle user signup and set role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'employee')
  );
  
  INSERT INTO public.vacation_balance (user_id, total_days, remaining_days)
  VALUES (new.id, 22, 22);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update vacation balance when request is approved
CREATE OR REPLACE FUNCTION public.update_vacation_balance()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.vacation_balance 
    SET 
      used_days = used_days + NEW.total_days,
      remaining_days = total_days - (used_days + NEW.total_days),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  ELSIF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.vacation_balance 
    SET 
      used_days = used_days - NEW.total_days,
      remaining_days = total_days - (used_days - NEW.total_days),
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_vacation_request_status_change ON public.vacation_requests;

-- Create trigger to update vacation balance
CREATE TRIGGER on_vacation_request_status_change
  AFTER UPDATE ON public.vacation_requests
  FOR EACH ROW EXECUTE PROCEDURE public.update_vacation_balance();

-- Function to calculate total hours for time entries
CREATE OR REPLACE FUNCTION public.calculate_total_hours()
RETURNS trigger AS $$
BEGIN
  IF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NOT NULL THEN
    NEW.total_hours = NEW.check_out_time - NEW.check_in_time;
    NEW.status = 'checked_out';
  ELSIF NEW.check_in_time IS NOT NULL AND NEW.check_out_time IS NULL THEN
    NEW.status = 'checked_in';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS calculate_hours_trigger ON public.time_entries;

-- Create trigger to calculate hours
CREATE TRIGGER calculate_hours_trigger
  BEFORE INSERT OR UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE PROCEDURE public.calculate_total_hours();

-- Create storage bucket for payroll files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payroll-files', 'payroll-files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Admins can upload payroll files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view payroll files" ON storage.objects;

-- Set up storage policies
CREATE POLICY "Admins can upload payroll files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'payroll-files' AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Authenticated users can view payroll files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'payroll-files' AND 
    auth.uid() IS NOT NULL
  );

-- ====================================================================
-- IMPORTANT: Create test users manually in Supabase Auth
-- ====================================================================
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- Create these test users:
-- 1. Email: admin@empresa.com, Password: admin123, User Metadata: {"full_name": "Administrador", "role": "admin"}
-- 2. Email: empleado@empresa.com, Password: emp123, User Metadata: {"full_name": "Juan Pérez", "role": "employee"}
-- 
-- The handle_new_user() trigger will automatically create profiles and vacation balances
-- ====================================================================