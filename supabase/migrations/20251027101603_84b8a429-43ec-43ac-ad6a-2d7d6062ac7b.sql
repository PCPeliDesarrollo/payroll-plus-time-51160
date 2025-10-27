-- Actualizar empleados sin company_id para que tengan el company_id correcto
-- Asignar el company_id basándose en la empresa existente
UPDATE profiles 
SET company_id = '27fea968-7611-4245-a228-8c948da3a629'
WHERE company_id IS NULL 
  AND role IN ('employee', 'admin')
  AND email IN ('cristina@empresa.com', 'peli@empleado.com', 'admin@empresa.com');