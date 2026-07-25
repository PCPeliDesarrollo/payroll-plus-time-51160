
-- Revoke EXECUTE from PUBLIC/anon/authenticated on all SECURITY DEFINER functions
-- that are trigger functions or admin-only utilities. Keep RLS helper functions
-- executable by authenticated so policies keep working.

DO $$
DECLARE
  fn text;
  trigger_and_admin_fns text[] := ARRAY[
    'close_open_time_entries()',
    'handle_new_user()',
    'get_current_vacation_period()',
    'prevent_vacation_modification()',
    'update_vacation_balance()',
    'notify_admin_extra_hours_request()',
    'validate_vacation_request_period()',
    'set_company_id_from_user()',
    'migrate_vacation_requests(uuid)',
    'notify_employee_extra_hours_decision()',
    'notify_admin_schedule_change()',
    'validate_extra_hours_request()',
    'restore_vacation_balance_on_delete()',
    'notify_employee_vacation_decision()',
    'calculate_proportional_vacation_days(date, integer)',
    'update_time_entry_on_schedule_approval()',
    'notify_admin_vacation_request()',
    'renew_vacation_periods()',
    'notify_employee_schedule_decision()',
    'check_vacation_overlap()'
  ];
  rls_helper_fns text[] := ARRAY[
    'has_role(uuid, app_role)',
    'is_super_admin(uuid)',
    'get_user_company_id(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY trigger_and_admin_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
  END LOOP;

  FOREACH fn IN ARRAY rls_helper_fns LOOP
    -- Only revoke from anon/PUBLIC; keep authenticated so RLS policies can call them.
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', fn);
  END LOOP;
END $$;
