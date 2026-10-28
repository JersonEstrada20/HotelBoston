import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Falta configurar Supabase.");

    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "No autorizado." }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: { user }, error: authError } = await admin.auth.getUser(authorization.slice(7));
    if (authError || !user) return json({ error: "No autorizado." }, 401);

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profileError || profile?.role !== "admin") return json({ error: "No tienes permiso para publicar." }, 403);

    const deployHook = Deno.env.get("CLOUDFLARE_DEPLOY_HOOK_URL");
    if (!deployHook) return json({ ok: true, configured: false });

    const response = await fetch(deployHook, { method: "POST" });
    if (!response.ok) {
      throw new Error(`Cloudflare rechazó la publicación (${response.status}).`);
    }

    const publishedAt = new Date().toISOString();
    const { error: updateError } = await admin
      .from("site_settings")
      .update({ last_published_at: publishedAt, updated_date: publishedAt })
      .eq("id", "main");
    if (updateError) throw updateError;

    return json({ ok: true, configured: true, publishedAt });
  } catch (error) {
    console.error("publishSite failed", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo publicar el sitio." }, 500);
  }
});
