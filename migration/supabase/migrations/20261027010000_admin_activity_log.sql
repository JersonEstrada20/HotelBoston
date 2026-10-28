CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
  changes JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created
  ON public.admin_activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity
  ON public.admin_activity_log (entity_type, entity_id, created_at DESC);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_activity_log_read_admin" ON public.admin_activity_log;
CREATE POLICY "admin_activity_log_read_admin"
  ON public.admin_activity_log FOR SELECT
  USING (public.current_user_role() = 'admin');

REVOKE ALL ON public.admin_activity_log FROM anon, authenticated;
GRANT SELECT ON public.admin_activity_log TO authenticated;

CREATE OR REPLACE FUNCTION public.capture_admin_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_row JSONB;
  new_row JSONB;
  allowed_fields TEXT[];
  field_name TEXT;
  diff JSONB := '{}'::JSONB;
  current_value JSONB;
  previous_value JSONB;
BEGIN
  IF TG_TABLE_NAME = 'booking_request' THEN
    allowed_fields := ARRAY['status', 'cabin', 'arrival_date', 'departure_date', 'guests'];
  ELSIF TG_TABLE_NAME = 'cabin' THEN
    allowed_fields := ARRAY['name', 'capacity', 'high_season_price', 'low_season_price', 'is_active', 'sector'];
  ELSE
    allowed_fields := ARRAY['promo_enabled', 'promo_title', 'promo_message', 'promo_button_label', 'promo_button_url', 'whatsapp_phone'];
  END IF;

  old_row := CASE WHEN TG_OP = 'INSERT' THEN '{}'::JSONB ELSE to_jsonb(OLD) END;
  new_row := CASE WHEN TG_OP = 'DELETE' THEN '{}'::JSONB ELSE to_jsonb(NEW) END;

  IF TG_OP = 'UPDATE' THEN
    FOREACH field_name IN ARRAY allowed_fields LOOP
      previous_value := old_row -> field_name;
      current_value := new_row -> field_name;
      IF previous_value IS DISTINCT FROM current_value THEN
        diff := diff || jsonb_build_object(field_name, jsonb_build_object('from', previous_value, 'to', current_value));
      END IF;
    END LOOP;
    IF diff = '{}'::JSONB THEN RETURN NEW; END IF;
  ELSIF TG_OP = 'INSERT' THEN
    FOREACH field_name IN ARRAY allowed_fields LOOP
      current_value := new_row -> field_name;
      IF current_value IS NOT NULL AND current_value <> 'null'::JSONB THEN
        diff := diff || jsonb_build_object(field_name, jsonb_build_object('from', NULL, 'to', current_value));
      END IF;
    END LOOP;
  ELSE
    FOREACH field_name IN ARRAY allowed_fields LOOP
      previous_value := old_row -> field_name;
      IF previous_value IS NOT NULL AND previous_value <> 'null'::JSONB THEN
        diff := diff || jsonb_build_object(field_name, jsonb_build_object('from', previous_value, 'to', NULL));
      END IF;
    END LOOP;
  END IF;

  INSERT INTO public.admin_activity_log (actor_id, entity_type, entity_id, action, changes)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(new_row ->> 'id', old_row ->> 'id', 'main'),
    CASE TG_OP WHEN 'INSERT' THEN 'created' WHEN 'DELETE' THEN 'deleted' ELSE 'updated' END,
    diff
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, auth;

DROP TRIGGER IF EXISTS booking_request_activity_log ON public.booking_request;
CREATE TRIGGER booking_request_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.booking_request
  FOR EACH ROW EXECUTE FUNCTION public.capture_admin_activity();

DROP TRIGGER IF EXISTS cabin_activity_log ON public.cabin;
CREATE TRIGGER cabin_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.cabin
  FOR EACH ROW EXECUTE FUNCTION public.capture_admin_activity();

DROP TRIGGER IF EXISTS site_settings_activity_log ON public.site_settings;
CREATE TRIGGER site_settings_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.capture_admin_activity();
