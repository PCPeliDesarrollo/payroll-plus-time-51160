-- Actualizar el check constraint en profiles para permitir super_admin
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Agregar nuevo constraint que incluya super_admin
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('super_admin', 'admin', 'employee'));