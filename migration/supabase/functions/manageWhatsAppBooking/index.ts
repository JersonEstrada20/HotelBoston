import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 6 && digits.length <= 15 ? digits : null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  if (!botAuthorized(req)) return json({ error: "No autorizado." }, 401);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Falta configuración de Supabase.");

    const { booking_id, action, phone } = await req.json();
    const isUuid = typeof booking_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(booking_id);
    const isTrackingCode = typeof booking_id === "string" && /^[A-HJ-NP-Z2-9]{8}$/i.test(booking_id);
    if ((!isUuid && !isTrackingCode)
      || !["status", "cancel"].includes(action) || !normalizePhone(phone)) {
      return json({ error: "El código o la acción no son válidos." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let bookingQuery = supabase
      .from("booking_request")
      .select("id, status, cabin, arrival_date, departure_date, guests, phone")
    bookingQuery = isUuid
      ? bookingQuery.eq("id", booking_id)
      : bookingQuery.eq("tracking_code", booking_id.toUpperCase());
    const { data: booking, error: bookingError } = await bookingQuery.maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return json({ ok: false, reason: "not_found" }, 200);
    if (normalizePhone(booking.phone) !== normalizePhone(phone)) return json({ ok: false, reason: "not_found" }, 200);

    if (action === "status") {
      return json({ ok: true, status: booking.status, cabin: booking.cabin, arrival_date: booking.arrival_date, departure_date: booking.departure_date });
    }
    if (booking.status !== "pendiente") return json({ ok: false, reason: "not_pending", status: booking.status }, 200);

    const { data: cancelled, error: cancelError } = await supabase
      .from("booking_request")
      .update({ status: "cancelada", updated_date: new Date().toISOString() })
      .eq("id", booking.id)
      .eq("status", "pendiente")
      .select("id")
      .maybeSingle();
    if (cancelError) throw cancelError;
    if (!cancelled) return json({ ok: false, reason: "not_pending", status: booking.status }, 200);
    return json({ ok: true, status: "cancelada" });
  } catch (error) {
    console.error("manageWhatsAppBooking falló:", error instanceof Error ? error.name : "error desconocido");
    return json({ error: "No se pudo gestionar la solicitud." }, 500);
  }
});
