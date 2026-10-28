import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { reservaConfirmadaHtml, reservaConfirmadaText, reservaRechazadaHtml, reservaRechazadaText } from "../_shared/emailTemplates.ts";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
    const senderName = Deno.env.get("BREVO_SENDER_NAME") || "Hotel Boston";
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Falta la configuración de Supabase.");
    if (!brevoApiKey || !senderEmail) throw new Error("Falta configurar el correo saliente.");
    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "No autorizado." }, 401);
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.slice(7));
    if (userError || !user) return json({ error: "No autorizado." }, 401);
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profileError || !["admin", "recepcion", "recepcionista"].includes(profile?.role)) return json({ error: "No tienes permiso para gestionar solicitudes." }, 403);
    const { bookingId, status } = await req.json();
    if (!bookingId || !["confirmada", "rechazada", "pendiente"].includes(status)) return json({ error: "Datos de solicitud inválidos." }, 400);
    const { data: booking, error: bookingError } = await supabase.from("booking_request").select("*").eq("id", bookingId).single();
    if (bookingError || !booking) return json({ error: "Solicitud no encontrada." }, 404);
    const { error: updateError } = await supabase.from("booking_request").update({ status }).eq("id", bookingId);
    if (updateError) throw updateError;
    if (status === "pendiente") return json({ ok: true, status, emailSent: false });
    const confirmed = status === "confirmada";
    let whatsappQueued = false;
    if (confirmed) {
      const phone = String(booking.phone || "").replace(/\D/g, "");
      if (phone.length >= 6 && phone.length <= 15) {
        const { error: queueError } = await supabase.from("whatsapp_booking_confirmations").upsert({
          booking_request_id: booking.id,
          phone: `+${phone}`,
          guest_name: booking.name,
          cabin: booking.cabin,
          arrival_date: booking.arrival_date,
          departure_date: booking.departure_date,
          guests: booking.guests,
        }, { onConflict: "booking_request_id", ignoreDuplicates: true });
        if (queueError) console.error("No se pudo poner en cola la confirmación de WhatsApp:", queueError.name);
        else whatsappQueued = true;
      }
    }
    const subject = confirmed ? "Su reserva en Hotel Boston ha sido confirmada" : "Actualización de su solicitud de reserva — Hotel Boston";
    const html = confirmed ? reservaConfirmadaHtml(booking) : reservaRechazadaHtml(booking);
    const text = confirmed ? reservaConfirmadaText(booking) : reservaRechazadaText(booking);
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoApiKey, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ sender: { email: senderEmail, name: senderName }, to: [{ email: booking.email, name: booking.name }], subject, htmlContent: html, textContent: text }),
    });
    if (!emailResponse.ok) {
      console.error("Brevo error:", await emailResponse.text());
      return json({ ok: true, status, emailSent: false, email_sent: false, email_error: "Brevo rechazó el envío.", whatsappQueued });
    }
    return json({ ok: true, status, emailSent: true, email_sent: true, whatsappQueued });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Error inesperado." }, 500);
  }
});
