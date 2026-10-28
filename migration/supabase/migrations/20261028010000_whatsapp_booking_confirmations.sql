-- Queue one WhatsApp confirmation for every confirmed booking.
CREATE TABLE IF NOT EXISTS public.whatsapp_booking_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_request_id UUID NOT NULL UNIQUE REFERENCES public.booking_request(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  cabin TEXT NOT NULL,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  guests INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_booking_confirmations_pending
  ON public.whatsapp_booking_confirmations (status, created_at)
  WHERE status IN ('pending', 'sending');

ALTER TABLE public.whatsapp_booking_confirmations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_booking_confirmations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.whatsapp_booking_confirmations TO service_role;

CREATE OR REPLACE FUNCTION public.claim_whatsapp_booking_confirmations(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  phone TEXT,
  guest_name TEXT,
  cabin TEXT,
  arrival_date DATE,
  departure_date DATE,
  guests INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  WITH candidates AS (
    SELECT q.id
    FROM public.whatsapp_booking_confirmations q
    WHERE q.attempts < 5
      AND (q.status = 'pending' OR (q.status = 'sending' AND q.locked_until < now()))
    ORDER BY q.created_at
    FOR UPDATE SKIP LOCKED
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 10), 1), 20)
  ), claimed AS (
    UPDATE public.whatsapp_booking_confirmations q
    SET status = 'sending', attempts = q.attempts + 1,
        locked_until = now() + interval '5 minutes', updated_at = now()
    FROM candidates c
    WHERE q.id = c.id
    RETURNING q.id, q.phone, q.guest_name, q.cabin, q.arrival_date, q.departure_date, q.guests
  )
  SELECT claimed.id, claimed.phone, claimed.guest_name, claimed.cabin, claimed.arrival_date, claimed.departure_date, claimed.guests FROM claimed;
$$;

CREATE OR REPLACE FUNCTION public.complete_whatsapp_booking_confirmation(
  p_id UUID,
  p_sent BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  UPDATE public.whatsapp_booking_confirmations
  SET status = CASE WHEN p_sent THEN 'sent' WHEN attempts >= 5 THEN 'failed' ELSE 'pending' END,
      sent_at = CASE WHEN p_sent THEN now() ELSE sent_at END,
      locked_until = NULL,
      last_error = CASE WHEN p_sent THEN NULL ELSE left(COALESCE(p_error, 'No se pudo enviar.'), 300) END,
      updated_at = now()
  WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION public.claim_whatsapp_booking_confirmations(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_whatsapp_booking_confirmations(INTEGER) TO service_role;
REVOKE ALL ON FUNCTION public.complete_whatsapp_booking_confirmation(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_whatsapp_booking_confirmation(UUID, BOOLEAN, TEXT) TO service_role;
