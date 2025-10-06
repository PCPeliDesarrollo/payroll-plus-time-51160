-- Fix security warnings by setting search_path on all functions
CREATE OR REPLACE FUNCTION close_open_time_entries()
RETURNS void AS $$
BEGIN
  UPDATE public.time_entries
  SET 
    check_out_time = (date + INTERVAL '1 day' - INTERVAL '1 second')::timestamptz,
    status = 'checked_out',
    updated_at = now()
  WHERE 
    status = 'checked_in' 
    AND date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION notify_admin_vacation_request()
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
      'vacation_request',
      'Nueva solicitud de vacaciones',
      'Un empleado ha solicitado vacaciones',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION update_time_entry_on_schedule_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;