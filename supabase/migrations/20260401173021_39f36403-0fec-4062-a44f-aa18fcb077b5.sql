ALTER TABLE public.employee_schedules 
ADD COLUMN check_in_time_2 time without time zone DEFAULT NULL,
ADD COLUMN check_out_time_2 time without time zone DEFAULT NULL;