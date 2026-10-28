-- Prevent authenticated users from escalating their own profiles to staff/admin.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog, public, auth
AS $$
  SELECT p.role
  FROM public.profiles AS p
  WHERE p.id = auth.uid();
$$;

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

DROP TRIGGER IF EXISTS profiles_security_fields_guard ON public.profiles;
CREATE TRIGGER profiles_security_fields_guard
  BEFORE UPDATE OF role, must_change_password ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();
