-- Tabla para registrar horas extra acumuladas
CREATE TABLE public.extra_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  hours NUMERIC(5,2) NOT NULL,
  date DATE NOT NULL,
  reason TEXT NOT NULL,
  granted_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabla para solicitudes de uso de horas extra
CREATE TABLE public.extra_hours_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  hours_requested NUMERIC(5,2) NOT NULL,
  requested_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  admin_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.extra_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_hours_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para extra_hours
CREATE POLICY "Users can view own extra hours"
ON public.extra_hours FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view company extra hours"
ON public.extra_hours FOR SELECT
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can insert company extra hours"
ON public.extra_hours FOR INSERT
WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage company extra hours"
ON public.extra_hours FOR ALL
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Políticas para extra_hours_requests
CREATE POLICY "Users can view own extra hours requests"
ON public.extra_hours_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own extra hours requests"
ON public.extra_hours_requests FOR INSERT
WITH CHECK (auth.uid() = user_id AND company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update own pending requests"
ON public.extra_hours_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can view company extra hours requests"
ON public.extra_hours_requests FOR SELECT
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can update company extra hours requests"
ON public.extra_hours_requests FOR UPDATE
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

CREATE POLICY "Admins can delete company extra hours requests"
ON public.extra_hours_requests FOR DELETE
USING ((has_role(auth.uid(), 'admin'::app_role) AND company_id = get_user_company_id(auth.uid())) OR is_super_admin(auth.uid()));

-- Trigger para validar que la solicitud sea con al menos 1 día de antelación
CREATE OR REPLACE FUNCTION public.validate_extra_hours_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.requested_date <= CURRENT_DATE THEN
    RAISE EXCEPTION 'La fecha solicitada debe ser al menos 1 día en el futuro';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_extra_hours_request_trigger
BEFORE INSERT ON public.extra_hours_requests
FOR EACH ROW
EXECUTE FUNCTION public.validate_extra_hours_request();

-- Trigger para notificar a admins cuando se solicitan horas
CREATE OR REPLACE FUNCTION public.notify_admin_extra_hours_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_id UUID;
BEGIN
  FOR admin_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      admin_id,
      'extra_hours_request',
      'Nueva solicitud de horas extra',
      'Un empleado ha solicitado usar horas extra acumuladas',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_admin_extra_hours_request_trigger
AFTER INSERT ON public.extra_hours_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_extra_hours_request();

-- Trigger para notificar al empleado cuando se aprueba/rechaza
CREATE OR REPLACE FUNCTION public.notify_employee_extra_hours_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'extra_hours_approved'
        ELSE 'extra_hours_rejected'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Horas extra aprobadas'
        ELSE 'Horas extra rechazadas'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Tu solicitud de horas extra ha sido aprobada'
        ELSE 'Tu solicitud de horas extra ha sido rechazada'
      END,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_employee_extra_hours_decision_trigger
AFTER UPDATE ON public.extra_hours_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_employee_extra_hours_decision();