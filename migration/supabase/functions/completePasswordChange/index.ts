import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error("Falta configurar Supabase en la función.");
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "No autorizado." }, 401);

    const { data: { user }, error: authError } = await admin.auth.getUser(authorization.slice(7));
    if (authError || !user) return json({ error: "No autorizado." }, 401);

    const { currentPassword, newPassword } = await req.json();
    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8) {
      return json({ error: "Indica tu contraseña actual y una nueva de al menos 8 caracteres." }, 400);
    }
    if (currentPassword === newPassword) return json({ error: "La nueva contraseña debe ser distinta de la actual." }, 400);

    const verifier = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error: passwordError } = await verifier.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    if (passwordError) return json({ error: "La contraseña actual no es correcta." }, 400);

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (updateError) throw updateError;

    const { data, error } = await admin
      .from("profiles")
      .update({ must_change_password: false })
      .eq("id", user.id)
      .select("id")
      .single();
    if (error || !data) throw error || new Error("No se encontró el perfil de la cuenta.");

    return json({ ok: true });
  } catch (error) {
    console.error("completePasswordChange failed", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo finalizar el cambio." }, 500);
  }
});
