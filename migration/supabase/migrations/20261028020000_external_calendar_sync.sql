-- iCal sync for external booking channels (Airbnb, Booking.com, etc.).
-- External feeds never contain guest information in this database: only dates.

CREATE TABLE IF NOT EXISTS public.external_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id UUID NOT NULL REFERENCES public.cabin(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('airbnb', 'booking', 'other')),
  feed_url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cabin_id, provider, feed_url)
);

CREATE TABLE IF NOT EXISTS public.external_calendar_block (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES public.external_calendar(id) ON DELETE CASCADE,
  external_uid TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_on > starts_on),
  UNIQUE (calendar_id, external_uid, starts_on, ends_on)
);

CREATE INDEX IF NOT EXISTS external_calendar_block_lookup
  ON public.external_calendar_block (calendar_id, starts_on, ends_on);

CREATE TABLE IF NOT EXISTS public.external_calendar_export (
  cabin_id UUID PRIMARY KEY REFERENCES public.cabin(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.external_calendar_export (cabin_id)
SELECT id FROM public.cabin
ON CONFLICT (cabin_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.create_external_calendar_export()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.external_calendar_export (cabin_id) VALUES (NEW.id)
  ON CONFLICT (cabin_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

DROP TRIGGER IF EXISTS cabin_external_calendar_export ON public.cabin;
CREATE TRIGGER cabin_external_calendar_export
  AFTER INSERT ON public.cabin
  FOR EACH ROW EXECUTE FUNCTION public.create_external_calendar_export();

ALTER TABLE public.external_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_calendar_block ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_calendar_export ENABLE ROW LEVEL SECURITY;

CREATE POLICY "external_calendar_admin_all" ON public.external_calendar
  FOR ALL USING (public.current_user_role() = 'admin') WITH CHECK (public.current_user_role() = 'admin');
CREATE POLICY "external_calendar_blocks_staff_read" ON public.external_calendar_block
  FOR SELECT USING (public.current_user_role() IN ('admin', 'recepcion', 'recepcionista'));
CREATE POLICY "external_calendar_export_admin_read" ON public.external_calendar_export
  FOR SELECT USING (public.current_user_role() = 'admin');
