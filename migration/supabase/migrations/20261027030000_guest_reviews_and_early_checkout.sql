-- Public reviews are held for moderation; only approved reviews are readable publicly.
CREATE TABLE IF NOT EXISTS public.guest_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  guest_name TEXT NOT NULL CHECK (length(trim(guest_name)) BETWEEN 2 AND 100),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 10 AND 2000),
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  admin_reply TEXT CHECK (admin_reply IS NULL OR length(admin_reply) <= 1000),
  admin_reply_date TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_guest_review_public
  ON public.guest_review (created_date DESC) WHERE status = 'aprobada';
CREATE INDEX IF NOT EXISTS idx_guest_review_moderation
  ON public.guest_review (status, created_date DESC);

DROP TRIGGER IF EXISTS guest_review_updated ON public.guest_review;
CREATE TRIGGER guest_review_updated BEFORE UPDATE ON public.guest_review
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_date();

ALTER TABLE public.guest_review ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.guest_review TO anon, authenticated;
GRANT UPDATE, DELETE ON public.guest_review TO authenticated;
DROP POLICY IF EXISTS guest_review_public_read_approved ON public.guest_review;
CREATE POLICY guest_review_public_read_approved ON public.guest_review
  FOR SELECT USING (status = 'aprobada');
DROP POLICY IF EXISTS guest_review_public_submit ON public.guest_review;
CREATE POLICY guest_review_public_submit ON public.guest_review
  FOR INSERT WITH CHECK (
    status = 'pendiente' AND admin_reply IS NULL AND admin_reply_date IS NULL
  );
DROP POLICY IF EXISTS guest_review_staff_read ON public.guest_review;
CREATE POLICY guest_review_staff_read ON public.guest_review
  FOR SELECT USING (public.current_user_role() IN ('admin', 'recepcion'));
DROP POLICY IF EXISTS guest_review_staff_update ON public.guest_review;
CREATE POLICY guest_review_staff_update ON public.guest_review
  FOR UPDATE USING (public.current_user_role() IN ('admin', 'recepcion'))
  WITH CHECK (public.current_user_role() IN ('admin', 'recepcion'));
DROP POLICY IF EXISTS guest_review_admin_delete ON public.guest_review;
CREATE POLICY guest_review_admin_delete ON public.guest_review
  FOR DELETE USING (public.current_user_role() = 'admin');

-- Link a checked-in group to its confirmed booking so an early checkout releases
-- the unused nights for both the website and WhatsApp availability checks.
ALTER TABLE public.visitor_entry
  ADD COLUMN IF NOT EXISTS booking_request_id UUID REFERENCES public.booking_request(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS check_out_date DATE;
CREATE INDEX IF NOT EXISTS idx_visitor_booking_request
  ON public.visitor_entry (booking_request_id) WHERE booking_request_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.register_visitor_checkout(
  p_entry_id UUID,
  p_checkout_time TEXT,
  p_checkout_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_booking_id UUID;
  v_entry_date DATE;
BEGIN
  IF public.current_user_role() NOT IN ('admin', 'recepcion') THEN
    RAISE EXCEPTION 'Not authorized to register a checkout' USING ERRCODE = '42501';
  END IF;
  IF p_checkout_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' THEN
    RAISE EXCEPTION 'Invalid checkout time' USING ERRCODE = '22007';
  END IF;
  IF p_checkout_date IS NULL THEN
    RAISE EXCEPTION 'Checkout date is required' USING ERRCODE = '22007';
  END IF;

  UPDATE public.visitor_entry
  SET check_out_time = p_checkout_time,
      check_out_date = p_checkout_date
  WHERE id = p_entry_id AND check_out_time IS NULL
  RETURNING booking_request_id, entry_date INTO v_booking_id, v_entry_date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entry not found or checkout already registered' USING ERRCODE = 'P0002';
  END IF;
  IF p_checkout_date < v_entry_date THEN
    RAISE EXCEPTION 'Checkout date cannot be before check-in date' USING ERRCODE = '22007';
  END IF;

  IF v_booking_id IS NOT NULL THEN
    IF p_checkout_date < (SELECT arrival_date FROM public.booking_request WHERE id = v_booking_id) THEN
      RAISE EXCEPTION 'Checkout date cannot be before booking arrival' USING ERRCODE = '22007';
    END IF;
    UPDATE public.booking_request
    SET departure_date = LEAST(departure_date, p_checkout_date)
    WHERE id = v_booking_id
      AND status = 'confirmada'
      AND departure_date > p_checkout_date;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.register_visitor_checkout(UUID, TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_visitor_checkout(UUID, TEXT, DATE) TO authenticated;
