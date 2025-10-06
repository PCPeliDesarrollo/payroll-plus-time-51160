-- Tabla para notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'vacation_request', 'schedule_change', 'vacation_approved', 'vacation_rejected', 'schedule_approved', 'schedule_rejected'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID, -- ID de la solicitud relacionada
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies para notificaciones
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Función para cerrar fichajes abiertos a medianoche
CREATE OR REPLACE FUNCTION close_open_time_entries()
RETURNS void AS $$
BEGIN
  -- Actualizar todas las entradas que están checked_in y son de días anteriores
  UPDATE public.time_entries
  SET 
    check_out_time = (date + INTERVAL '1 day' - INTERVAL '1 second')::timestamptz,
    status = 'checked_out',
    updated_at = now()
  WHERE 
    status = 'checked_in' 
    AND date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear notificaciones cuando se crea una solicitud de vacaciones
CREATE OR REPLACE FUNCTION notify_admin_vacation_request()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Obtener todos los admins
  FOR admin_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      admin_id,
      'vacation_request',
      'Nueva solicitud de vacaciones',
      'Un empleado ha solicitado vacaciones',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vacation_request_created
  AFTER INSERT ON public.vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_vacation_request();

-- Trigger para crear notificaciones cuando se crea una solicitud de cambio de horario
CREATE OR REPLACE FUNCTION notify_admin_schedule_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
BEGIN
  FOR admin_id IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      admin_id,
      'schedule_change',
      'Nueva solicitud de cambio de horario',
      'Un empleado ha solicitado un cambio de horario',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_schedule_change_created
  AFTER INSERT ON public.schedule_changes
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_schedule_change();

-- Trigger para notificar empleado cuando se aprueba/rechaza vacaciones
CREATE OR REPLACE FUNCTION notify_employee_vacation_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'vacation_approved'
        ELSE 'vacation_rejected'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Vacaciones aprobadas'
        ELSE 'Vacaciones rechazadas'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Tu solicitud de vacaciones ha sido aprobada'
        ELSE 'Tu solicitud de vacaciones ha sido rechazada'
      END,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vacation_decision
  AFTER UPDATE ON public.vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_employee_vacation_decision();

-- Trigger para notificar empleado cuando se aprueba/rechaza cambio de horario
CREATE OR REPLACE FUNCTION notify_employee_schedule_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'schedule_approved'
        ELSE 'schedule_rejected'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Cambio de horario aprobado'
        ELSE 'Cambio de horario rechazado'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Tu solicitud de cambio de horario ha sido aprobada'
        ELSE 'Tu solicitud de cambio de horario ha sido rechazada'
      END,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_schedule_decision
  AFTER UPDATE ON public.schedule_changes
  FOR EACH ROW
  EXECUTE FUNCTION notify_employee_schedule_decision();

-- Trigger para actualizar time_entry cuando se aprueba un cambio de horario
CREATE OR REPLACE FUNCTION update_time_entry_on_schedule_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Buscar si existe un time_entry para esa fecha y usuario
    UPDATE public.time_entries
    SET
      check_in_time = (NEW.requested_date || ' ' || NEW.requested_check_in::text)::timestamptz,
      check_out_time = CASE 
        WHEN NEW.requested_check_out IS NOT NULL 
        THEN (NEW.requested_date || ' ' || NEW.requested_check_out::text)::timestamptz
        ELSE check_out_time
      END,
      updated_at = now()
    WHERE 
      user_id = NEW.user_id 
      AND date = NEW.requested_date;
      
    -- Si no existe el time_entry, crearlo
    IF NOT FOUND AND NEW.requested_check_in IS NOT NULL THEN
      INSERT INTO public.time_entries (user_id, date, check_in_time, check_out_time, status)
      VALUES (
        NEW.user_id,
        NEW.requested_date,
        (NEW.requested_date || ' ' || NEW.requested_check_in::text)::timestamptz,
        CASE 
          WHEN NEW.requested_check_out IS NOT NULL 
          THEN (NEW.requested_date || ' ' || NEW.requested_check_out::text)::timestamptz
          ELSE NULL
        END,
        CASE 
          WHEN NEW.requested_check_out IS NOT NULL 
          THEN 'checked_out'
          ELSE 'checked_in'
        END
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_schedule_change_approved
  AFTER UPDATE ON public.schedule_changes
  FOR EACH ROW
  EXECUTE FUNCTION update_time_entry_on_schedule_approval();