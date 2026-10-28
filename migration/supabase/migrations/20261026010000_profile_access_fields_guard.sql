-- Only administrators and trusted service functions may change profile access flags.
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.must_change_password IS DISTINCT FROM OLD.must_change_password)
    AND auth.role() IS NOT NULL
    AND auth.role() <> 'service_role'
    AND public.current_user_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only administrators or trusted server functions may change profile access fields'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_role_guard ON public.profiles;
DROP TRIGGER IF EXISTS profiles_security_fields_guard ON public.profiles;
CREATE TRIGGER profiles_security_fields_guard
  BEFORE UPDATE OF role, must_change_password ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();
