-- Crear trigger para validar solapamiento de fechas de vacaciones
CREATE TRIGGER validate_vacation_overlap
  BEFORE INSERT OR UPDATE ON public.vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.check_vacation_overlap();