ALTER TABLE public.booking_request
  ADD COLUMN IF NOT EXISTS tracking_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_booking_request_tracking_code
  ON public.booking_request (tracking_code)
  WHERE tracking_code IS NOT NULL;
