import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isStaffRole, normalizeStaffEmail, validateRoleChange, validateStaffCreation } from "../_shared/staffAccess.js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
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

async function applyRoleChange(supabase: ReturnType<typeof createClient>, callerId: string, target: { id: string; role: string }, nextRole: string) {
  let adminCount = 0;
  if (target.role === "admin" && nextRole !== "admin") {
    const { count, error } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin");
    if (error) throw error;
    adminCount = count || 0;
  }

  const blocked = validateRoleChange({
    callerId,
    targetId: target.id,
    currentRole: target.role,
    nextRole,
    adminCount,
  });
  if (blocked) return json({ error: blocked }, 409);

  const { error } = await supabase.from("profiles").update({ role: nextRole }).eq("id", target.id);
  if (error) throw error;
  return null;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Falta configurar Supabase en la función.");
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7));
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { data: callerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profileError || callerProfile.role !== "admin") return json({ error: "Forbidden" }, 403);

    const input = await req.json();
    const action = input?.action;

    if (["update_access", "create"].includes(action)) {
      const email = normalizeStaffEmail(input.email);
      const role = input.role;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Correo no válido" }, 400);
      if (!isStaffRole(role)) return json({ error: "Rol no válido" }, 400);

      const { data: existingProfile, error: lookupError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("email", email)
        .maybeSingle();
      if (lookupError) throw lookupError;

      if (action === "update_access") {
        if (!existingProfile) return json({ error: "No existe una cuenta con ese correo. Elige crear una cuenta nueva." }, 404);
        const blocked = await applyRoleChange(supabase, user.id, existingProfile, role);
        if (blocked) return blocked;
        return json({ ok: true, action: "access_updated" });
      }

      if (existingProfile) return json({ error: "Ya existe una cuenta con ese correo. Elige habilitar una cuenta existente." }, 409);
      const validatedCreation = validateStaffCreation(input);
      if (!validatedCreation.ok) return json({ error: validatedCreation.error }, 400);

      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: validatedCreation.email,
        password: validatedCreation.password,
        email_confirm: true,
      });
      if (createError) {
        if (createError.status === 422) return json({ error: "Ese correo ya está registrado. Elige habilitar una cuenta existente." }, 409);
        throw createError;
      }
      if (!data.user) throw new Error("Supabase no devolvió el usuario creado");

      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        role,
        must_change_password: true,
      });
      if (upsertError) {
        await supabase.auth.admin.deleteUser(data.user.id);
        throw upsertError;
      }
      return json({ ok: true, action: "account_created" });
    }

    if (["set_role", "revoke_access"].includes(action)) {
      const targetUserId = typeof input.targetUserId === "string" ? input.targetUserId : "";
      if (!targetUserId) return json({ error: "Falta el usuario" }, 400);
      const nextRole = action === "revoke_access" ? "user" : input.role;
      if (action === "set_role" && !isStaffRole(nextRole)) return json({ error: "Rol no válido" }, 400);

      const { data: target, error: targetError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", targetUserId)
        .maybeSingle();
      if (targetError) throw targetError;
      if (!target || !isStaffRole(target.role)) return json({ error: "No se encontró una cuenta del personal." }, 404);

      const blocked = await applyRoleChange(supabase, user.id, target, nextRole);
      if (blocked) return blocked;
      return json({ ok: true, action: action === "revoke_access" ? "access_revoked" : "role_updated" });
    }

    return json({ error: "Tipo de operación no válido" }, 400);
  } catch (error) {
    console.error("inviteUser failed", error);
    return json({ error: error instanceof Error ? error.message : "No se pudo procesar el acceso" }, 500);
  }
});
