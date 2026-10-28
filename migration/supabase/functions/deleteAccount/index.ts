import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export default async function (req: Request): Promise<Response> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Eliminar datos personales del usuario
    try {
      await supabase.from("visitor_entry").delete().eq("created_by_id", user.id);
    } catch (e) {
      // Continuar aunque no haya registros
    }

    // Eliminar el perfil
    try {
      await supabase.from("profiles").delete().eq("id", user.id);
    } catch (e) {
      // Continuar
    }

    // Eliminar la cuenta de auth
    try {
      await supabase.auth.admin.deleteUser(user.id);
    } catch (e) {
      return Response.json({
        success: true,
        partial: true,
        message: "Tus datos fueron eliminados. Cierra sesión para completar el proceso.",
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
