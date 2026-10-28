import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "Falta configurar PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en el archivo .env.local."
    : "";

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "hotel-boston-admin-auth",
      },
    });

export async function uploadPublicFile(file) {
  if (!file) throw new Error("Selecciona un archivo.");
  if (!file.type.startsWith("image/")) throw new Error("Selecciona una imagen JPG, PNG, WebP o GIF.");
  if (file.size > 10 * 1024 * 1024) throw new Error("La imagen debe pesar 10 MB o menos.");
  const extension = file.name?.split(".").pop()?.toLowerCase() || "jpg";
  const path = `uploads/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("public").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from("public").getPublicUrl(path).data.publicUrl;
}

export async function uploadReviewPhoto(file) {
  if (!file) throw new Error("Selecciona una foto.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Elige una imagen JPG, PNG o WebP.");
  }
  if (file.size > 5 * 1024 * 1024) throw new Error("La imagen no puede superar los 5 MB.");
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
  const path = `pending/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("guest-review-photos").upload(path, file, {
    upsert: false,
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) throw error;
  return supabase.storage.from("guest-review-photos").getPublicUrl(path).data.publicUrl;
}

export async function functionErrorMessage(error) {
  if (!error) return "No se pudo completar la operación.";
  if (error.message?.includes("Failed to fetch")) {
    return "No se pudo conectar con Supabase. Revisa la conexión e inténtalo nuevamente.";
  }
  const response = error.context;
  if (response && typeof response.clone === "function") {
    if (response.status === 401) {
      return "Tu sesión ya no es válida. Cierra sesión y vuelve a entrar.";
    }
    try {
      const body = await response.clone().json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } catch {
      // La función no devolvió JSON; se usa el mensaje genérico.
    }
    if (response.status) {
      return `El servidor rechazó la solicitud (${response.status}). Intenta nuevamente.`;
    }
  }
  return error.message || "No se pudo completar la operación.";
}
