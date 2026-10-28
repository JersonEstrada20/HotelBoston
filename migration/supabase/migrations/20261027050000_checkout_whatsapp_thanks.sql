ALTER TABLE public.visitor_entry
  ADD COLUMN IF NOT EXISTS responsible_person_index INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS whatsapp_thanks_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_thanks_status TEXT NOT NULL DEFAULT 'no_consent'
    CHECK (whatsapp_thanks_status IN ('no_consent', 'no_phone', 'pending', 'sent', 'failed'));

CREATE TABLE IF NOT EXISTS public.whatsapp_checkout_thanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_entry_id UUID NOT NULL UNIQUE REFERENCES public.visitor_entry(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'es' CHECK (language IN ('es', 'en')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_checkout_thanks_pending
  ON public.whatsapp_checkout_thanks (status, created_at)
  WHERE status IN ('pending', 'sending');

ALTER TABLE public.whatsapp_checkout_thanks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_checkout_thanks FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.whatsapp_checkout_thanks TO service_role;

DROP FUNCTION IF EXISTS public.register_visitor_checkout(UUID, TEXT, DATE);

CREATE FUNCTION public.register_visitor_checkout(
  p_entry_id UUID,
  p_checkout_time TEXT,
  p_checkout_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
DECLARE
  v_entry public.visitor_entry%ROWTYPE;
  v_booking public.booking_request%ROWTYPE;
  v_phone TEXT;
  v_name TEXT;
  v_status TEXT := 'no_consent';
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

  SELECT * INTO v_entry
  FROM public.visitor_entry
  WHERE id = p_entry_id AND check_out_time IS NULL
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Entry not found or checkout already registered' USING ERRCODE = 'P0002';
  END IF;
  IF p_checkout_date < v_entry.entry_date THEN
    RAISE EXCEPTION 'Checkout date cannot be before check-in date' USING ERRCODE = '22007';
  END IF;

  IF v_entry.booking_request_id IS NOT NULL THEN
    SELECT * INTO v_booking FROM public.booking_request WHERE id = v_entry.booking_request_id;
    IF FOUND AND p_checkout_date < v_booking.arrival_date THEN
      RAISE EXCEPTION 'Checkout date cannot be before booking arrival' USING ERRCODE = '22007';
    END IF;
    IF FOUND THEN
      v_phone := NULLIF(trim(v_booking.phone), '');
      v_name := NULLIF(trim(v_booking.name), '');
    END IF;
  END IF;

  -- If no reservation phone was captured (or there is no linked booking), use
  -- the responsible group contact selected when reception registered arrival.
  v_phone := COALESCE(v_phone, NULLIF(trim(v_entry.people -> v_entry.responsible_person_index ->> 'phone'), ''));
  v_name := COALESCE(v_name, NULLIF(trim(v_entry.people -> v_entry.responsible_person_index ->> 'full_name'), ''));

  IF v_entry.whatsapp_thanks_consent THEN
    IF v_phone IS NOT NULL AND length(regexp_replace(v_phone, '[^0-9]', '', 'g')) BETWEEN 6 AND 15 THEN
      v_status := 'pending';
      INSERT INTO public.whatsapp_checkout_thanks (visitor_entry_id, phone, guest_name)
      VALUES (
        p_entry_id,
        '+' || regexp_replace(v_phone, '[^0-9]', '', 'g'),
        COALESCE(NULLIF(trim(v_name), ''), 'Hola')
      );
    ELSE
      v_status := 'no_phone';
    END IF;
  END IF;

  UPDATE public.visitor_entry
  SET check_out_time = p_checkout_time,
      check_out_date = p_checkout_date,
      whatsapp_thanks_status = v_status
  WHERE id = p_entry_id;

  IF v_entry.booking_request_id IS NOT NULL THEN
    UPDATE public.booking_request
    SET departure_date = LEAST(departure_date, p_checkout_date)
    WHERE id = v_entry.booking_request_id
      AND status = 'confirmada'
      AND departure_date > p_checkout_date;
  END IF;

  RETURN jsonb_build_object('whatsapp_thanks_status', v_status);
END;
$$;

REVOKE ALL ON FUNCTION public.register_visitor_checkout(UUID, TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_visitor_checkout(UUID, TEXT, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_whatsapp_checkout_thanks(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (id UUID, phone TEXT, guest_name TEXT, language TEXT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH candidates AS (
    SELECT q.id
    FROM public.whatsapp_checkout_thanks q
    WHERE q.attempts < 5
      AND (q.status = 'pending' OR (q.status = 'sending' AND q.locked_until < now()))
    ORDER BY q.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 20)
  ), claimed AS (
    UPDATE public.whatsapp_checkout_thanks q
    SET status = 'sending', attempts = q.attempts + 1,
        locked_until = now() + interval '5 minutes', updated_at = now()
    FROM candidates c
    WHERE q.id = c.id
    RETURNING q.id, q.phone, q.guest_name, q.language
  )
  SELECT claimed.id, claimed.phone, claimed.guest_name, claimed.language FROM claimed;
$$;

CREATE OR REPLACE FUNCTION public.complete_whatsapp_checkout_thanks(
  p_id UUID,
  p_sent BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_entry_id UUID;
  v_status TEXT;
BEGIN
  UPDATE public.whatsapp_checkout_thanks
  SET status = CASE WHEN p_sent THEN 'sent' WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
      sent_at = CASE WHEN p_sent THEN now() ELSE sent_at END,
      locked_until = NULL,
      last_error = CASE WHEN p_sent THEN NULL ELSE left(COALESCE(p_error, 'No se pudo enviar.'), 300) END,
      updated_at = now()
  WHERE id = p_id
  RETURNING visitor_entry_id, status INTO v_entry_id, v_status;
  IF NOT FOUND THEN RETURN; END IF;

  UPDATE public.visitor_entry
  SET whatsapp_thanks_status = CASE WHEN v_status = 'sent' THEN 'sent' WHEN v_status = 'failed' THEN 'failed' ELSE 'pending' END
  WHERE id = v_entry_id;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_whatsapp_checkout_thanks(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_whatsapp_checkout_thanks(INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.complete_whatsapp_checkout_thanks(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_whatsapp_checkout_thanks(UUID, BOOLEAN, TEXT) TO service_role;
