-- Añadir columnas de geolocalización a time_entries
ALTER TABLE public.time_entries
ADD COLUMN IF NOT EXISTS check_in_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS check_in_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS check_out_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS check_out_longitude DECIMAL(11, 8);