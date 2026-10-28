-- Allow guests to withdraw an unconfirmed booking request through WhatsApp.
ALTER TABLE public.booking_request
  DROP CONSTRAINT IF EXISTS booking_request_status_check;

ALTER TABLE public.booking_request
  ADD CONSTRAINT booking_request_status_check
  CHECK (status IN ('pendiente', 'confirmada', 'rechazada', 'cancelada'));
