-- Update admin user role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@empresa.com';