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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  if (!botAuthorized(req)) return json({ error: "No autorizado." }, 401);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Falta configuración de Supabase.");
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await req.json();

    if (body.action === "claim") {
      const { data, error } = await supabase.rpc("claim_whatsapp_booking_confirmations", {
        p_limit: Number.isInteger(body.limit) ? body.limit : 10,
      });
      if (error) throw error;
      return json({ ok: true, messages: data || [] });
    }

    if (body.action === "complete") {
      const validId = typeof body.id === "string"
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id);
      if (!validId || typeof body.sent !== "boolean") return json({ error: "Solicitud no válida." }, 400);
      const { error } = await supabase.rpc("complete_whatsapp_booking_confirmation", {
        p_id: body.id,
        p_sent: body.sent,
        p_error: typeof body.error === "string" ? body.error.slice(0, 300) : null,
      });
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Acción no válida." }, 400);
  } catch (error) {
    console.error("whatsappBookingConfirmation falló:", error instanceof Error ? error.name : "error desconocido");
    return json({ error: "No se pudo procesar la cola de confirmaciones." }, 500);
  }
});
