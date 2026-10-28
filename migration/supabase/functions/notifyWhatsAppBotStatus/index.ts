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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]!);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405);
  if (!botAuthorized(req)) return json({ error: "No autorizado." }, 401);

  try {
    const { event, connected = true } = await req.json();
    const subjects: Record<string, string> = {
      disconnected: "Alerta: bot de WhatsApp desconectado — Hotel Boston",
      reconnected: "Bot de WhatsApp reconectado — Hotel Boston",
      logged_out: "Acción necesaria: volver a vincular el bot de WhatsApp",
      monitor: "Alerta: asistente de WhatsApp sin señal — Hotel Boston",
      heartbeat: "",
    };
    if (typeof event !== "string" || !Object.hasOwn(subjects, event)) return json({ error: "Evento no válido." }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const senderName = Deno.env.get("BREVO_SENDER_NAME") || "Hotel Boston";
    if (!supabaseUrl || !serviceRoleKey || !brevoApiKey || !senderEmail) throw new Error("Falta configuración de Supabase o Brevo.");

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const now = new Date();
    if (event === "heartbeat") {
      const { error: heartbeatError } = await supabase.from("whatsapp_bot_health").upsert({
        id: 1,
        heartbeat_at: now.toISOString(),
        connected: Boolean(connected),
        updated_at: now.toISOString(),
      });
      if (heartbeatError) throw heartbeatError;
      return json({ ok: true, heartbeat: true });
    }

    let alertText: string | null = null;
    if (event === "monitor") {
      const { data: health, error: healthError } = await supabase.from("whatsapp_bot_health")
        .select("heartbeat_at, connected, alerted_at").eq("id", 1).maybeSingle();
      if (healthError) throw healthError;
      if (!health?.heartbeat_at) return json({ ok: true, healthy: false, waitingForInitialHeartbeat: true });
      const stale = now.getTime() - Date.parse(health.heartbeat_at) > 10 * 60 * 1000;
      const offline = health?.connected === false;
      if (!stale && !offline) return json({ ok: true, healthy: true });
      const lastAlert = health?.alerted_at ? Date.parse(health.alerted_at) : 0;
      if (lastAlert && now.getTime() - lastAlert < 30 * 60 * 1000) {
        return json({ ok: true, healthy: false, notified: false, cooldown: true });
      }
      alertText = offline
          ? "El bot informó que perdió conexión con WhatsApp. Revisa el servicio en la VM y el estado de la sesión."
          : `No se reciben señales de vida desde hace más de 10 minutos (última señal: ${health.heartbeat_at}). Revisa si la VM y el servicio del bot siguen activos.`;
    }

    if (event === "heartbeat") return json({ ok: true, heartbeat: true });
    if (event !== "monitor" && event !== "disconnected" && event !== "reconnected" && event !== "logged_out") {
      return json({ error: "Evento no válido." }, 400);
    }

    // A brief reconnection is useful state for the monitor, but emailing it
    // creates a flood when WhatsApp repeatedly drops and reconnects.
    if (event === "reconnected") {
      const { error: updateError } = await supabase.from("whatsapp_bot_health").upsert({
        id: 1,
        heartbeat_at: now.toISOString(),
        connected: true,
        updated_at: now.toISOString(),
      });
      if (updateError) throw updateError;
      return json({ ok: true, notified: false, recovered: true });
    }

    // The bot process can restart repeatedly while WhatsApp is logged out.
    // Keep the cooldown in the database so every new process cannot send a
    // fresh alert to reception.
    if (event === "disconnected" || event === "logged_out") {
      const { data: health, error: healthError } = await supabase.from("whatsapp_bot_health")
        .select("alerted_at").eq("id", 1).maybeSingle();
      if (healthError) throw healthError;
      const lastAlert = health?.alerted_at ? Date.parse(health.alerted_at) : 0;
      if (lastAlert && now.getTime() - lastAlert < 30 * 60 * 1000) {
        return json({ ok: true, notified: false, cooldown: true });
      }
    }

    const { data: staff, error } = await supabase.from("profiles").select("email").in("role", ["admin", "recepcion"]);
    if (error) throw error;
    const recipients = [...new Set((staff || []).map(({ email }: { email: string }) => email).filter(Boolean))];
    if (!recipients.length) {
      if (event === "monitor") {
        const { error: updateError } = await supabase.from("whatsapp_bot_health").update({ alerted_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", 1);
        if (updateError) throw updateError;
      }
      return json({ ok: true, notified: false });
    }

    const status = alertText || (event === "reconnected"
      ? "El bot volvió a conectarse a WhatsApp."
      : event === "logged_out"
        ? "WhatsApp cerró la sesión del asistente. Debes iniciar el proceso y volver a vincular el número oficial del Fundo."
        : "El bot perdió conexión con WhatsApp y está intentando reconectarse automáticamente. Si el equipo donde corre se apagó, el asistente no responderá hasta que se inicie de nuevo.");
    const safeStatus = escapeHtml(status);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoApiKey, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: recipients.map((email) => ({ email })),
        subject: subjects[event],
        htmlContent: `<p>${safeStatus}</p><p><a href="https://hotelboston.pages.dev/admin">Abrir panel de recepción</a></p>`,
        textContent: `${status}\nhttps://hotelboston.pages.dev/admin`,
      }),
    });
    if (!response.ok) throw new Error("Brevo no aceptó la notificación.");
    if (event === "monitor") {
      const { error: updateError } = await supabase.from("whatsapp_bot_health").update({ alerted_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", 1);
      if (updateError) throw updateError;
    } else if (event === "disconnected" || event === "logged_out") {
      const { error: updateError } = await supabase.from("whatsapp_bot_health").upsert({
        id: 1,
        heartbeat_at: now.toISOString(),
        connected: false,
        alerted_at: now.toISOString(),
        updated_at: now.toISOString(),
      });
      if (updateError) throw updateError;
    }
    return json({ ok: true, notified: true });
  } catch (error) {
    console.error("notifyWhatsAppBotStatus falló:", error instanceof Error ? error.name : "error desconocido");
    return json({ error: "No se pudo avisar al equipo." }, 500);
  }
});
