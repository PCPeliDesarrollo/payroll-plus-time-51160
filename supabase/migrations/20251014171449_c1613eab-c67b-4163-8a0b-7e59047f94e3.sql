-- Hacer el campo date nullable en compensatory_days
ALTER TABLE public.compensatory_days 
ALTER COLUMN date DROP NOT NULL;

-- Añadir un campo para la cantidad de días compensatorios si es necesario
-- (útil si quieres otorgar múltiples días a la vez)
ALTER TABLE public.compensatory_days 
ADD COLUMN IF NOT EXISTS days_count integer NOT NULL DEFAULT 1;