ALTER TABLE public.booking_request
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;
