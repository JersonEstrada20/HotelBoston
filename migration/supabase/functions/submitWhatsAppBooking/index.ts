import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { inspectAvailability, isValidDate, todayInChile } from "../_shared/bookingAvailability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-whatsapp-bot-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

function botAuthorized(req: Request): boolean {
  const expected = Deno.env.get("WHATSAPP_BOT_TOKEN") || "";
  const received = req.headers.get("x-whatsapp-bot-token") || "";
  if (!expected || received.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) diff |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  return diff === 0;
}

function createTrackingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  if (!botAuthorized(req)) return json({ error: "No autorizado." }, 401);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Falta configuración de Supabase.");

    const input = await req.json();
    const { name, email, phone, cabin, arrival_date, departure_date, guests, consent_at } = input ?? {};
    const cleanPhone = typeof phone === "string" ? phone.replace(/[^\d+]/g, "") : "";
    const phoneDigits = cleanPhone.replace(/\D/g, "");
    const consentTime = typeof consent_at === "string" ? Date.parse(consent_at) : Number.NaN;
    if (typeof name !== "string" || name.trim().length < 3 || name.length > 160
      || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
      || phoneDigits.length < 6 || phoneDigits.length > 15
      || typeof cabin !== "string" || !cabin.trim() || cabin.length > 160
      || !isValidDate(arrival_date) || arrival_date < todayInChile()
      || !isValidDate(departure_date) || departure_date <= arrival_date
      || !Number.isFinite(consentTime) || consentTime > Date.now() + 5 * 60 * 1000 || consentTime < Date.now() - 24 * 60 * 60 * 1000
      || !Number.isInteger(guests) || guests < 1 || guests > 50) {
      return json({ error: "Los datos de la solicitud no son válidos." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const canonicalPhone = cleanPhone.startsWith("+") ? cleanPhone : `+${phoneDigits}`;
    const canonicalEmail = email.trim().toLowerCase();
    const cleanCabin = cabin.trim();

    const { data: duplicate, error: duplicateError } = await supabase
      .from("booking_request")
      .select("id, tracking_code")
      .eq("phone", canonicalPhone)
      .eq("email", canonicalEmail)
      .eq("cabin", cleanCabin)
      .eq("arrival_date", arrival_date)
      .eq("departure_date", departure_date)
      .eq("status", "pendiente")
      .gte("created_date", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate) return json({ ok: true, booking_id: duplicate.id, tracking_code: duplicate.tracking_code, duplicate: true });

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [{ count: phoneCount, error: phoneCountError }, { count: emailCount, error: emailCountError }] = await Promise.all([
      supabase.from("booking_request").select("id", { count: "exact", head: true }).eq("phone", canonicalPhone).gte("created_date", hourAgo),
      supabase.from("booking_request").select("id", { count: "exact", head: true }).eq("email", canonicalEmail).gte("created_date", hourAgo),
    ]);
    if (phoneCountError) throw phoneCountError;
    if (emailCountError) throw emailCountError;
    if ((phoneCount ?? 0) >= 3 || (emailCount ?? 0) >= 3) return json({ ok: false, reason: "rate_limit" }, 200);

    const availability = await inspectAvailability(supabase, cleanCabin, arrival_date, departure_date, guests);
    if (!availability.available) return json({ ok: false, reason: availability.reason, capacity: availability.capacity }, 200);

    let booking: { id: string; tracking_code: string } | null = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const { data, error } = await supabase
        .from("booking_request")
        .insert({
          name: name.trim(),
          email: canonicalEmail,
          phone: canonicalPhone,
          cabin: cleanCabin,
          arrival_date,
          departure_date,
          guests,
          tracking_code: createTrackingCode(),
          message: `Solicitud recibida por el asistente oficial de WhatsApp. Consentimiento informado registrado: ${new Date(consentTime).toISOString()}.`,
          status: "pendiente",
        })
        .select("id, tracking_code")
        .single();
      if (!error) {
        booking = data;
        break;
      }
      if (error.code !== "23505") throw error;
    }
    if (!booking) throw new Error("No se pudo generar un código de seguimiento único.");

    const notifyResponse = await fetch(`${supabaseUrl}/functions/v1/notifyNewBooking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ booking_id: booking.id }),
    });
    if (!notifyResponse.ok) console.error("La solicitud se guardó, pero falló el aviso por correo.");

    return json({ ok: true, booking_id: booking.id, tracking_code: booking.tracking_code, duplicate: false });
  } catch (error) {
    console.error("submitWhatsAppBooking falló:", error instanceof Error ? error.name : "error desconocido");
    return json({ error: "No se pudo registrar la solicitud." }, 500);
  }
});
