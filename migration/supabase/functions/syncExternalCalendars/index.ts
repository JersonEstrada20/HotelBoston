import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

function validFeedUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2_000) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password
      && host !== "localhost" && !host.endsWith(".localhost")
      && !/^127\.|^0\.|^10\.|^192\.168\.|^169\.254\.|^::1$/.test(host);
  } catch { return false; }
}

function unfoldIcal(value: string) { return value.replace(/\r?\n[ \t]/g, ""); }
function dateFromIcal(value: string): string | null {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}
function nextDay(date: string) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}
function parseEvents(ical: string) {
  const results: { uid: string; starts_on: string; ends_on: string }[] = [];
  for (const event of unfoldIcal(ical).split("BEGIN:VEVENT").slice(1)) {
    const section = event.split("END:VEVENT")[0] || "";
    const uid = section.match(/(?:^|\n)UID(?:;[^:]*)?:([^\r\n]+)/)?.[1]?.trim();
    const start = section.match(/(?:^|\n)DTSTART(?:;[^:]*)?:([^\r\n]+)/)?.[1]?.trim();
    const end = section.match(/(?:^|\n)DTEND(?:;[^:]*)?:([^\r\n]+)/)?.[1]?.trim();
    const starts_on = start && dateFromIcal(start);
    const ends_on = end && dateFromIcal(end);
    if (uid && starts_on) results.push({ uid, starts_on, ends_on: ends_on && ends_on > starts_on ? ends_on : nextDay(starts_on) });
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const auth = req.headers.get("Authorization");
    if (!url || !key || !auth) throw new Error("Falta configuración de Supabase.");
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const token = auth.replace(/^Bearer\s+/i, "");
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "No autorizado." }, 401);
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role !== "admin") return json({ error: "Solo administradores pueden sincronizar calendarios." }, 403);

    const { calendar_id } = await req.json();
    if (typeof calendar_id !== "string") return json({ error: "Calendario inválido." }, 400);
    const { data: calendar, error } = await admin.from("external_calendar").select("id, feed_url").eq("id", calendar_id).maybeSingle();
    if (error) throw error;
    if (!calendar || !validFeedUrl(calendar.feed_url)) return json({ error: "Calendario no encontrado o URL no válida." }, 400);
    const response = await fetch(calendar.feed_url, { signal: AbortSignal.timeout(15_000), headers: { Accept: "text/calendar, text/plain" } });
    if (!response.ok) throw new Error("El calendario externo no respondió.");
    const body = await response.text();
    if (body.length > 2_000_000 || !body.includes("BEGIN:VCALENDAR")) throw new Error("El enlace no contiene un calendario iCal válido.");
    const events = parseEvents(body);
    const rows = events.map((event) => ({ calendar_id: calendar.id, external_uid: event.uid, starts_on: event.starts_on, ends_on: event.ends_on }));
    const { error: deleteError } = await admin.from("external_calendar_block").delete().eq("calendar_id", calendar.id);
    if (deleteError) throw deleteError;
    if (rows.length) {
      const { error: insertError } = await admin.from("external_calendar_block").insert(rows);
      if (insertError) throw insertError;
    }
    await admin.from("external_calendar").update({ last_synced_at: new Date().toISOString(), last_error: null }).eq("id", calendar.id);
    return json({ ok: true, imported: rows.length });
  } catch (error) {
    console.error("syncExternalCalendars falló:", error instanceof Error ? error.message : "error desconocido");
    return json({ error: error instanceof Error ? error.message : "No se pudo sincronizar el calendario." }, 500);
  }
});
