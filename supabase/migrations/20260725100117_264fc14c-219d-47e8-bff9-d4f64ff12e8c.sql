
-- 1) Backfill company_id from profiles for existing rows
ALTER TABLE public.vacation_requests DISABLE TRIGGER USER;
UPDATE public.vacation_requests vr SET company_id = p.company_id
  FROM public.profiles p WHERE vr.user_id = p.id AND vr.company_id IS NULL AND p.company_id IS NOT NULL;
ALTER TABLE public.vacation_requests ENABLE TRIGGER USER;
UPDATE public.extra_hours_requests er SET company_id = p.company_id
  FROM public.profiles p WHERE er.user_id = p.id AND er.company_id IS NULL AND p.company_id IS NOT NULL;
UPDATE public.schedule_changes sc SET company_id = p.company_id
  FROM public.profiles p WHERE sc.user_id = p.id AND sc.company_id IS NULL AND p.company_id IS NOT NULL;
UPDATE public.time_entries te SET company_id = p.company_id
  FROM public.profiles p WHERE te.user_id = p.id AND te.company_id IS NULL AND p.company_id IS NOT NULL;
UPDATE public.extra_hours eh SET company_id = p.company_id
  FROM public.profiles p WHERE eh.user_id = p.id AND eh.company_id IS NULL AND p.company_id IS NOT NULL;
UPDATE public.compensatory_days cd SET company_id = p.company_id
  FROM public.profiles p WHERE cd.user_id = p.id AND cd.company_id IS NULL AND p.company_id IS NOT NULL;

-- 2) Generic trigger to auto-fill company_id from the user's profile
CREATE OR REPLACE FUNCTION public.set_company_id_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.profiles WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_company_id_vacation_requests ON public.vacation_requests;
CREATE TRIGGER set_company_id_vacation_requests BEFORE INSERT ON public.vacation_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

DROP TRIGGER IF EXISTS set_company_id_extra_hours_requests ON public.extra_hours_requests;
CREATE TRIGGER set_company_id_extra_hours_requests BEFORE INSERT ON public.extra_hours_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

DROP TRIGGER IF EXISTS set_company_id_schedule_changes ON public.schedule_changes;
CREATE TRIGGER set_company_id_schedule_changes BEFORE INSERT ON public.schedule_changes
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

DROP TRIGGER IF EXISTS set_company_id_time_entries ON public.time_entries;
CREATE TRIGGER set_company_id_time_entries BEFORE INSERT ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

DROP TRIGGER IF EXISTS set_company_id_extra_hours ON public.extra_hours;
CREATE TRIGGER set_company_id_extra_hours BEFORE INSERT ON public.extra_hours
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

DROP TRIGGER IF EXISTS set_company_id_compensatory_days ON public.compensatory_days;
CREATE TRIGGER set_company_id_compensatory_days BEFORE INSERT ON public.compensatory_days
  FOR EACH ROW EXECUTE FUNCTION public.set_company_id_from_user();

-- 3) Fix notification triggers to only notify admins of the requester's company
CREATE OR REPLACE FUNCTION public.notify_admin_vacation_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
  req_company_id UUID;
BEGIN
  req_company_id := COALESCE(NEW.company_id, (SELECT company_id FROM public.profiles WHERE id = NEW.user_id));
  FOR admin_id IN
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin' AND p.company_id = req_company_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (admin_id, 'vacation_request', 'Nueva solicitud de vacaciones',
            'Un empleado ha solicitado vacaciones', NEW.id);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_extra_hours_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
  req_company_id UUID;
BEGIN
  req_company_id := COALESCE(NEW.company_id, (SELECT company_id FROM public.profiles WHERE id = NEW.user_id));
  FOR admin_id IN
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin' AND p.company_id = req_company_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (admin_id, 'extra_hours_request', 'Nueva solicitud de horas extra',
            'Un empleado ha solicitado usar horas extra acumuladas', NEW.id);
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_admin_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
  req_company_id UUID;
BEGIN
  req_company_id := COALESCE(NEW.company_id, (SELECT company_id FROM public.profiles WHERE id = NEW.user_id));
  FOR admin_id IN
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.profiles p ON p.id = ur.user_id
    WHERE ur.role = 'admin' AND p.company_id = req_company_id
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (admin_id, 'schedule_change', 'Nueva solicitud de cambio de horario',
            'Un empleado ha solicitado un cambio de horario', NEW.id);
  END LOOP;
  RETURN NEW;
END;
$$;
