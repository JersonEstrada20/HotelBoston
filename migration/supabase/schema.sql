-- ============================================================
-- Hotel Boston — Esquema Supabase
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- ============================================================
-- 1. Perfiles de usuario (extiende auth.users con rol)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'recepcion')),
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, auth;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 2. Habitaciones y salones
-- ============================================================

CREATE TABLE IF NOT EXISTS cabin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cabaña' CHECK (type IN ('cabaña', 'salón')),
  description TEXT,
  capacity TEXT,
  rooms TEXT,
  pool TEXT,
  high_season_price NUMERIC,
  low_season_price NUMERIC,
  sector TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  "order" INTEGER DEFAULT 0
);

CREATE INDEX idx_cabin_order ON cabin ("order");
CREATE INDEX idx_cabin_type ON cabin (type);

-- ============================================================
-- 3. Solicitudes de reserva
-- ============================================================

CREATE TABLE IF NOT EXISTS booking_request (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cabin TEXT NOT NULL,
  arrival_date DATE NOT NULL,
  departure_date DATE NOT NULL,
  guests INTEGER NOT NULL,
  message TEXT,
  tracking_code TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'rechazada'))
);

ALTER TABLE public.booking_request
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

CREATE INDEX idx_booking_status ON booking_request (status);
CREATE INDEX idx_booking_created ON booking_request (created_date DESC);
CREATE UNIQUE INDEX idx_booking_request_tracking_code
  ON booking_request (tracking_code)
  WHERE tracking_code IS NOT NULL;

-- ============================================================
-- 4. Registro de ingresos (visitor entries)
-- ============================================================

CREATE TABLE IF NOT EXISTS visitor_entry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW(),
  created_by_id UUID REFERENCES auth.users(id),
  cabin TEXT NOT NULL,
  entry_date DATE NOT NULL,
  check_in_time TEXT,
  check_out_time TEXT,
  people JSONB NOT NULL DEFAULT '[]',
  signature_url TEXT,
  notes TEXT
);

CREATE INDEX idx_visitor_cabin ON visitor_entry (cabin);
CREATE INDEX idx_visitor_created ON visitor_entry (created_date DESC);

-- ============================================================
-- 5. Public site settings
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  whatsapp_phone TEXT NOT NULL DEFAULT '51987292169',
  promo_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  promo_image_url TEXT,
  promo_title TEXT NOT NULL DEFAULT '',
  promo_message TEXT NOT NULL DEFAULT '',
  promo_button_label TEXT NOT NULL DEFAULT '',
  promo_button_url TEXT NOT NULL DEFAULT '',
  promo_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO site_settings (id, whatsapp_phone)
VALUES ('main', '51987292169')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. Trigger updated_date automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_date = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cabin_updated BEFORE UPDATE ON cabin
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER booking_updated BEFORE UPDATE ON booking_request
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER visitor_updated BEFORE UPDATE ON visitor_entry
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

CREATE TRIGGER profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_date();

-- ============================================================
-- 6. Row Level Security (RLS)
-- ============================================================

ALTER TABLE cabin ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Helper: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT p.role FROM public.profiles AS p WHERE p.id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = pg_catalog, public, auth;

-- A user may update their own profile fields, but only administrators or
-- trusted server/database roles may change a profile role.
CREATE OR REPLACE FUNCTION public.protect_profile_security_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.role IS DISTINCT FROM OLD.role
      OR NEW.must_change_password IS DISTINCT FROM OLD.must_change_password)
    AND auth.role() IS NOT NULL
    AND auth.role() <> 'service_role'
    AND public.current_user_role() IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Only administrators or trusted server functions may change profile access fields'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, auth;

DROP TRIGGER IF EXISTS profiles_security_fields_guard ON public.profiles;
CREATE TRIGGER profiles_security_fields_guard
  BEFORE UPDATE OF role, must_change_password ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_security_fields();

-- ---- cabin ----
-- Lectura: pública (todos pueden ver cabañas)
CREATE POLICY "cabin_read_all" ON cabin FOR SELECT USING (true);
-- Escritura: solo admin
CREATE POLICY "cabin_insert_admin" ON cabin FOR INSERT WITH CHECK (current_user_role() = 'admin');
CREATE POLICY "cabin_update_admin" ON cabin FOR UPDATE USING (current_user_role() = 'admin');
CREATE POLICY "cabin_delete_admin" ON cabin FOR DELETE USING (current_user_role() = 'admin');

-- ---- booking_request ----
-- Lectura: solo admin
CREATE POLICY "booking_read_staff" ON booking_request FOR SELECT USING (current_user_role() IN ('admin', 'recepcion', 'recepcionista'));
-- Creación: público (cualquiera puede enviar solicitud sin login)
CREATE POLICY "booking_insert_all" ON booking_request FOR INSERT WITH CHECK (true);
-- Actualización/eliminación: solo admin
CREATE POLICY "booking_update_staff" ON booking_request FOR UPDATE USING (current_user_role() IN ('admin', 'recepcion', 'recepcionista'));
CREATE POLICY "booking_delete_admin" ON booking_request FOR DELETE USING (current_user_role() = 'admin');

-- ---- visitor_entry ----
-- Lectura: admin y recepción
CREATE POLICY "visitor_read_staff" ON visitor_entry FOR SELECT USING (current_user_role() IN ('admin', 'recepcion'));
-- Creación: admin y recepción
CREATE POLICY "visitor_insert_staff" ON visitor_entry FOR INSERT WITH CHECK (current_user_role() IN ('admin', 'recepcion'));
-- Actualización: admin y recepción
CREATE POLICY "visitor_update_staff" ON visitor_entry FOR UPDATE USING (current_user_role() IN ('admin', 'recepcion'));
-- Eliminación: solo admin
CREATE POLICY "visitor_delete_admin" ON visitor_entry FOR DELETE USING (current_user_role() = 'admin');

-- ---- profiles ----
-- Lectura: propio usuario o admin
CREATE POLICY "profile_read_self_or_admin" ON profiles FOR SELECT USING (auth.uid() = id OR current_user_role() = 'admin');
-- Actualización: propio usuario (datos propios) o admin (rol de otros)
CREATE POLICY "profile_update_self_or_admin" ON profiles FOR UPDATE USING (auth.uid() = id OR current_user_role() = 'admin');

-- ---- site_settings ----
CREATE POLICY "site_settings_read_public" ON site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_update_admin" ON site_settings FOR UPDATE USING (current_user_role() = 'admin') WITH CHECK (current_user_role() = 'admin');

-- ============================================================
-- 7. Storage buckets
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('public', 'public', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('private', 'private', false) ON CONFLICT DO NOTHING;

-- Política: usuarios autenticados pueden subir al bucket público
CREATE POLICY "public_upload_auth" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');
CREATE POLICY "public_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'public');
