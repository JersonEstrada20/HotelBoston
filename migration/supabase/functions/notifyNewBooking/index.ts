import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { nuevaReservaAdminHtml, nuevaReservaAdminText } from "../_shared/emailTemplates.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  let supabase: ReturnType<typeof createClient> | null = null;
  let claimedBookingId: string | null = null;
  let claimedAt: string | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const senderName = Deno.env.get("BREVO_SENDER_NAME") || "Hotel Boston";
    if (!supabaseUrl || !serviceRoleKey || !brevoApiKey || !senderEmail) {
      throw new Error("Falta configuración de Supabase o Brevo.");
    }

    const { booking_id } = await req.json();
    if (!booking_id || typeof booking_id !== "string") return json({ error: "booking_id es requerido." }, 400);

    supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: booking, error: bookingError } = await supabase
      .from("booking_request")
      .select("*")
      .eq("id", booking_id)
      .single();
    if (bookingError || !booking) return json({ error: "Solicitud no encontrada." }, 404);

    const notificationTime = new Date().toISOString();
    const { data: claim, error: claimError } = await supabase
      .from("booking_request")
      .update({ notification_sent_at: notificationTime })
      .eq("id", booking_id)
      .eq("status", "pendiente")
      .is("notification_sent_at", null)
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claim) return json({ ok: true, sent: 0, duplicate: true });
    claimedBookingId = booking_id;
    claimedAt = notificationTime;

    const { data: staff, error: staffError } = await supabase
      .from("profiles")
      .select("email")
      .in("role", ["admin", "recepcion", "recepcionista"])
      .not("email", "is", null);
    if (staffError) throw staffError;
    const recipients = [...new Set((staff || []).map(({ email }) => email).filter(Boolean))];
    if (!recipients.length) {
      const { error: releaseError } = await supabase.from("booking_request").update({ notification_sent_at: null })
        .eq("id", booking_id).eq("notification_sent_at", notificationTime);
      if (releaseError) throw releaseError;
      claimedBookingId = null;
      claimedAt = null;
      return json({ ok: true, sent: 0, reason: "no_staff" });
    }

    const subject = `Nueva solicitud de reserva — ${booking.cabin}`;
    const html = nuevaReservaAdminHtml(booking);
    const text = nuevaReservaAdminText(booking);
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoApiKey, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ sender: { email: senderEmail, name: senderName }, to: recipients.map((email) => ({ email })), subject, htmlContent: html, textContent: text }),
    });
    if (!response.ok) throw new Error(`No se pudo enviar la notificación: ${await response.text()}`);

    claimedBookingId = null;
    claimedAt = null;
    return json({ ok: true, sent: recipients.length });
  } catch (error) {
    if (supabase && claimedBookingId && claimedAt) {
      const { error: releaseError } = await supabase
        .from("booking_request")
        .update({ notification_sent_at: null })
        .eq("id", claimedBookingId)
        .eq("notification_sent_at", claimedAt);
      if (releaseError) console.error("No se pudo liberar el aviso para reintentar:", releaseError);
    }
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Error inesperado." }, 500);
  }
});
