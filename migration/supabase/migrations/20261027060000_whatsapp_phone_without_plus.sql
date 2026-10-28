-- Store the public WhatsApp number as international digits without a leading +.
-- wa.me accepts this format directly, and the app also accepts legacy values.
UPDATE public.site_settings
SET whatsapp_phone = regexp_replace(whatsapp_phone, '[^0-9]', '', 'g')
WHERE whatsapp_phone IS NOT NULL;

ALTER TABLE public.site_settings
  ALTER COLUMN whatsapp_phone SET DEFAULT '51987292169';
