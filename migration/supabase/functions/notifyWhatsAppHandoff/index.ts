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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const senderName = Deno.env.get("BREVO_SENDER_NAME") || "Hotel Boston";
    if (!supabaseUrl || !serviceRoleKey || !brevoApiKey || !senderEmail) throw new Error("Falta configuración de Supabase o Brevo.");

    const { phone, stage } = await req.json();
    const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    if ((digits.length > 0 && (digits.length < 6 || digits.length > 15)) || typeof stage !== "string" || stage.length > 40) {
      return json({ error: "La solicitud de atención no es válida." }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: staff, error: staffError } = await supabase
      .from("profiles")
      .select("email")
      .in("role", ["admin", "recepcion"]);
    if (staffError) throw staffError;
    const recipients = [...new Set((staff || []).map(({ email }) => email).filter(Boolean))];
    if (!recipients.length) return json({ ok: true, notified: false });

    const phoneText = digits ? `+${digits}` : "No detectado; revisar el chat en el dispositivo vinculado";
    const safePhone = escapeHtml(phoneText);
    const safeStage = escapeHtml(stage);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoApiKey, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: recipients.map((email) => ({ email })),
        subject: "Solicitud de atención humana por WhatsApp — Hotel Boston",
        htmlContent: `<p>Una persona solicita atención humana por WhatsApp.</p><p><strong>Teléfono:</strong> ${safePhone}</p><p><strong>Etapa del asistente:</strong> ${safeStage}</p><p>Continúa la conversación desde un dispositivo vinculado al WhatsApp oficial del Fundo.</p><p><a href="https://hotelboston.pages.dev/admin">Abrir el panel de recepción</a></p>`,
        textContent: `Una persona solicita atención humana por WhatsApp.\nTeléfono: ${phoneText}\nEtapa: ${stage}\nContinúa desde un dispositivo vinculado al WhatsApp oficial del Fundo.\nhttps://hotelboston.pages.dev/admin`,
      }),
    });
    if (!response.ok) throw new Error("Brevo no aceptó la notificación.");
    return json({ ok: true, notified: true });
  } catch (error) {
    console.error("notifyWhatsAppHandoff falló:", error instanceof Error ? error.name : "error desconocido");
    return json({ error: "No se pudo avisar al equipo." }, 500);
  }
});
