import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const text = (body: string, status = 200) => new Response(body, { status, headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" } });
const stamp = (value: string) => `${value.replaceAll("-", "")}T000000Z`;

Deno.serve(async (req) => {
  if (req.method !== "GET") return text("Method not allowed", 405);
  try {
    const token = new URL(req.url).searchParams.get("token");
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!token || token.length !== 48 || !url || !key) return text("Not found", 404);
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: exportRow } = await db.from("external_calendar_export").select("cabin_id, cabin(name)").eq("token", token).maybeSingle();
    if (!exportRow) return text("Not found", 404);
    const { data: bookings, error } = await db.from("booking_request")
      .select("id, arrival_date, departure_date, updated_date").eq("cabin", exportRow.cabin.name).eq("status", "confirmada").gte("departure_date", new Date().toISOString().slice(0, 10));
    if (error) throw error;
    const events = (bookings || []).map((booking) => ["BEGIN:VEVENT", `UID:hotelboston-${booking.id}@hotelboston`, `DTSTAMP:${stamp(booking.updated_date.slice(0, 10))}`, `DTSTART;VALUE=DATE:${booking.arrival_date.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${booking.departure_date.replaceAll("-", "")}`, "SUMMARY:No disponible", "END:VEVENT"].join("\r\n"));
    return text(["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hotel Boston//Reservas//ES", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n"));
  } catch (error) {
    console.error("externalCalendarFeed falló:", error instanceof Error ? error.name : "error desconocido");
    return text("No se pudo generar el calendario", 500);
  }
});
