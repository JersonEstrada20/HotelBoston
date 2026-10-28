-- Hotel Boston content model.
-- Run after schema.sql and the other migrations.

ALTER TABLE public.cabin
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS short_es TEXT,
  ADD COLUMN IF NOT EXISTS short_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS size TEXT,
  ADD COLUMN IF NOT EXISTS beds_es TEXT,
  ADD COLUMN IF NOT EXISTS beds_en TEXT,
  ADD COLUMN IF NOT EXISTS prices JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS amenities TEXT[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS idx_cabin_slug ON public.cabin (slug) WHERE slug IS NOT NULL;

ALTER TABLE public.cabin DROP CONSTRAINT IF EXISTS cabin_type_check;
ALTER TABLE public.cabin ADD CONSTRAINT cabin_type_check
  CHECK (type IN ('cabaña', 'salón', 'habitacion', 'salon'));

ALTER TABLE public.booking_request
  ADD COLUMN IF NOT EXISTS cabin_id UUID REFERENCES public.cabin(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS space_type TEXT;

CREATE INDEX IF NOT EXISTS idx_booking_cabin_id ON public.booking_request (cabin_id);

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_email TEXT NOT NULL DEFAULT 'hotelbostonreservas@gmail.com',
  ADD COLUMN IF NOT EXISTS phones JSONB NOT NULL DEFAULT '[]'::JSONB,
  ADD COLUMN IF NOT EXISTS founded INTEGER NOT NULL DEFAULT 1997,
  ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '21 de Mayo 468',
  ADD COLUMN IF NOT EXISTS address_full TEXT NOT NULL DEFAULT '21 de Mayo 468, Quillota, Chile',
  ADD COLUMN IF NOT EXISTS map_embed TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS maps_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS waze_url TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS last_published_at TIMESTAMPTZ;

UPDATE public.site_settings
SET
  whatsapp_phone = '51987292169',
  contact_email = 'hotelbostonreservas@gmail.com',
  phones = '[
    {"label":"(33) 225 3197","href":"+56332253197"},
    {"label":"(33) 231 6500","href":"+56332316500"},
    {"label":"(33) 231 2800","href":"+56332312800"}
  ]'::JSONB,
  founded = 1997,
  address = '21 de Mayo 468',
  address_full = '21 de Mayo 468, Quillota, Chile',
  map_embed = 'https://www.google.com/maps?q=Hotel%20Boston%2C%2021%20de%20Mayo%20468%2C%20Quillota&output=embed',
  maps_url = 'https://maps.google.com/?q=Hotel+Boston,+21+de+Mayo+468,+Quillota',
  waze_url = 'https://waze.to/?ll=-32.86882,-71.23909&navigate=yes',
  social = '{
    "tripadvisor":"https://www.tripadvisor.cl/UserReviewEdit-g652401-d2540627-Hotel_Boston-Quillota_Valparaiso_Region.html",
    "booking":"https://www.booking.com/hotel/cl/boston-quillota.es.html"
  }'::JSONB,
  promo_enabled = TRUE,
  promo_image_url = NULL,
  promo_title = '',
  promo_message = '',
  promo_button_label = '',
  promo_button_url = '',
  updated_date = NOW()
WHERE id = 'main';

INSERT INTO public.cabin (
  slug, name, name_en, type, short_es, short_en, description, description_en,
  size, beds_es, beds_en, capacity, prices, amenities, sector, images, is_active, "order"
)
VALUES
  (
    'single', 'Single', 'Single', 'habitacion',
    'Confort y tranquilidad para tu viaje.', 'Comfort and quiet for your trip.',
    'Una habitación confortable con una cama de dos plazas, pensada para descansar sin preocupaciones. Incluye desayuno.',
    'A comfortable room with a double bed, designed for an easy rest. Breakfast included.',
    '24 m²', '1 cama de 2 plazas', '1 double bed', '2',
    '[{"label":{"es":"Valor por persona","en":"Rate per person"},"amount":72000},{"label":{"es":"Valor matrimonial","en":"Double occupancy"},"amount":75000}]'::JSONB,
    ARRAY['breakfast','tv','wifi','heating','bathroom','phone','parking','commonAreas'],
    'Habitaciones',
    ARRAY['/images/rooms/single-1.jpg','/images/rooms/single-2.jpg'],
    TRUE, 1
  ),
  (
    'doble', 'Doble', 'Double', 'habitacion',
    'Ideal para el descanso y la conversación.', 'Ideal for rest and conversation.',
    'Amplia habitación equipada con dos camas de dos plazas. Incluye desayuno para dos personas.',
    'A spacious room with two double beds. Breakfast for two included.',
    '36 m²', '2 camas de 2 plazas', '2 double beds', '2',
    '[{"label":{"es":"Valor por dos personas","en":"Rate for two guests"},"amount":80000}]'::JSONB,
    ARRAY['breakfast','tv','wifi','heating','bathroom','phone','parking','commonAreas'],
    'Habitaciones',
    ARRAY['/images/rooms/double-1.jpg','/images/rooms/double-2.jpg'],
    TRUE, 2
  ),
  (
    'suite', 'Suite', 'Suite', 'habitacion',
    'Una pausa con todo lo necesario para una buena noche.', 'A pause with everything you need for a good night.',
    'Hermosa habitación de dos ambientes con dos camas King. Incluye desayuno para dos personas.',
    'A beautiful two-room suite with two King beds. Breakfast for two included.',
    '50 m²', '2 camas King', '2 King beds', '2',
    '[{"label":{"es":"Valor","en":"Rate"},"amount":90000}]'::JSONB,
    ARRAY['breakfast','tv','wifi','heating','bathroom','phone','parking','commonAreas'],
    'Habitaciones',
    ARRAY['/images/rooms/suite-1.jpg','/images/rooms/suite-2.jpg','/images/rooms/suite-3.jpg'],
    TRUE, 3
  ),
  (
    'silver', 'Silver', 'Silver', 'salon',
    'Un salón versátil para reuniones de empresa, capacitaciones y celebraciones íntimas.',
    'A versatile room for business meetings, training sessions and intimate celebrations.',
    'Un salón versátil para reuniones de empresa, capacitaciones y celebraciones íntimas.',
    'A versatile room for business meetings, training sessions and intimate celebrations.',
    NULL, NULL, NULL, '40',
    '[]'::JSONB,
    ARRAY['whiteboard','projector','catering','wifi','parking'],
    'Salones',
    ARRAY['/images/salons/silver-1.jpg','/images/salons/silver-2.jpg','/images/salons/silver-3.jpg'],
    TRUE, 4
  ),
  (
    'blanco', 'Blanco', 'Blanco', 'salon',
    'Nuestro salón más amplio, ideal para matrimonios, graduaciones y eventos de mayor escala.',
    'Our largest room, ideal for weddings, graduations and larger events.',
    'Nuestro salón más amplio, ideal para matrimonios, graduaciones y eventos de mayor escala.',
    'Our largest room, ideal for weddings, graduations and larger events.',
    NULL, NULL, NULL, '100',
    '[]'::JSONB,
    ARRAY['whiteboard','projector','catering','wifi','parking'],
    'Salones',
    ARRAY['/images/salons/blanco-1.jpg','/images/salons/blanco-2.jpg','/images/salons/blanco-3.jpg'],
    TRUE, 5
  ),
  (
    'london', 'London', 'London', 'salon',
    'Un espacio acogedor para aniversarios, cumpleaños y encuentros con personalidad.',
    'A welcoming space for anniversaries, birthdays and gatherings with character.',
    'Un espacio acogedor para aniversarios, cumpleaños y encuentros con personalidad.',
    'A welcoming space for anniversaries, birthdays and gatherings with character.',
    NULL, NULL, NULL, '50',
    '[]'::JSONB,
    ARRAY['whiteboard','projector','catering','wifi','parking'],
    'Salones',
    ARRAY['/images/salons/london-1.jpg','/images/salons/london-2.jpg','/images/salons/london-3.jpg'],
    TRUE, 6
  )
ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
