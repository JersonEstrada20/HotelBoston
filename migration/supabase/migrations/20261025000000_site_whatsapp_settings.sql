-- Configurable public WhatsApp contact for Hotel Boston.
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  whatsapp_phone TEXT NOT NULL DEFAULT '51987292169',
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.site_settings (id, whatsapp_phone)
VALUES ('main', '51987292169')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_read_public" ON public.site_settings;
CREATE POLICY "site_settings_read_public"
  ON public.site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "site_settings_update_admin" ON public.site_settings;
CREATE POLICY "site_settings_update_admin"
  ON public.site_settings FOR UPDATE
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');
