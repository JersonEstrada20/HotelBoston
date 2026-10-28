import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { inspectAvailability, isValidDate, todayInChile } from "../_shared/bookingAvailability.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Falta configuración de Supabase.");

    const { cabin, arrival_date, departure_date, guests } = await req.json();
    if (typeof cabin !== "string" || !cabin.trim() || cabin.length > 160
      || !isValidDate(arrival_date) || arrival_date < todayInChile()
      || !isValidDate(departure_date) || departure_date <= arrival_date
      || (guests !== undefined && (!Number.isInteger(guests) || guests < 1 || guests > 50))) {
      return json({ error: "Indica una opción, fechas y cantidad de personas válidas." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const result = await inspectAvailability(supabase, cabin.trim(), arrival_date, departure_date, guests);
    return json(result);
  } catch (error) {
    console.error("checkWhatsAppAvailability falló:", error instanceof Error ? error.name : "error desconocido");
    return json({ error: "No se pudo consultar la disponibilidad." }, 500);
  }
});
