-- Create table for compensatory days off
CREATE TABLE public.compensatory_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  granted_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.compensatory_days ENABLE ROW LEVEL SECURITY;

-- Users can view their own compensatory days
CREATE POLICY "Users can view own compensatory days"
ON public.compensatory_days
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all compensatory days
CREATE POLICY "Admins can view all compensatory days"
ON public.compensatory_days
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert compensatory days
CREATE POLICY "Admins can insert compensatory days"
ON public.compensatory_days
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update compensatory days
CREATE POLICY "Admins can update compensatory days"
ON public.compensatory_days
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete compensatory days
CREATE POLICY "Admins can delete compensatory days"
ON public.compensatory_days
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));