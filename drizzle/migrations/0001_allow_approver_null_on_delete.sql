CREATE OR REPLACE FUNCTION public.prevent_vacation_modification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Allow clearing the approver when the approver account is deleted
  IF (to_jsonb(NEW) - 'approved_by' - 'updated_at') = (to_jsonb(OLD) - 'approved_by' - 'updated_at') THEN
    RETURN NEW;
  END IF;

  IF OLD.status IN ('approved', 'rejected') THEN
    IF NOT (has_role(auth.uid(), 'admin') OR is_super_admin(auth.uid())) THEN
      RAISE EXCEPTION 'Las solicitudes aprobadas o rechazadas no pueden ser modificadas';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_vacation_overlap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.start_date = OLD.start_date AND NEW.end_date = OLD.end_date
     AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.vacation_requests
    WHERE user_id = NEW.user_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status IN ('pending', 'approved')
      AND (
        (NEW.start_date >= start_date AND NEW.start_date <= end_date)
        OR (NEW.end_date >= start_date AND NEW.end_date <= end_date)
        OR (NEW.start_date <= start_date AND NEW.end_date >= end_date)
      )
  ) THEN
    RAISE EXCEPTION 'Ya existe una solicitud de vacaciones para estas fechas o parte de ellas';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_vacation_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_vacation_overlap() FROM PUBLIC, anon, authenticated;