import { createClient } from "@supabase/supabase-js";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function initReviewForm() {
  const form = document.querySelector<HTMLFormElement>("[data-review-form]");
  if (!form) return;

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

  const status = form.querySelector<HTMLElement>("[data-review-status]");
  const photoInput = form.querySelector<HTMLInputElement>('input[name="photo"]');
  const photoPreview = form.querySelector<HTMLElement>("[data-photo-preview]");
  const photoPreviewImage = form.querySelector<HTMLImageElement>("[data-photo-preview-image]");
  const photoRemove = form.querySelector<HTMLButtonElement>("[data-photo-remove]");
  const submitButton = form.querySelector<HTMLButtonElement>("[data-review-submit]");
  const submitLabel = form.querySelector<HTMLElement>("[data-review-submit-label]");
  let previewUrl = "";

  const fieldValue = (name: string) =>
    (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null)?.value || "";

  const setStatus = (message: string, kind: "success" | "error") => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status is-${kind}`;
  };

  const clearStatus = () => {
    if (!status) return;
    status.textContent = "";
    status.className = "form-status";
  };

  const clearPhoto = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
    if (photoInput) photoInput.value = "";
    if (photoPreviewImage) photoPreviewImage.removeAttribute("src");
    if (photoPreview) photoPreview.hidden = true;
  };

  const setSending = (sending: boolean) => {
    if (submitButton) submitButton.disabled = sending;
    if (submitLabel) {
      if (!submitLabel.dataset.defaultLabel) {
        submitLabel.dataset.defaultLabel = submitLabel.textContent || "";
      }
      submitLabel.textContent = sending
        ? form.dataset.msgSending || "Enviando..."
        : submitLabel.dataset.defaultLabel;
    }
  };

  const validatePhoto = (file: File) => {
    if (!PHOTO_TYPES[file.type] || file.size > MAX_PHOTO_BYTES) {
      setStatus(form.dataset.msgPhotoError || "Elige una imagen válida.", "error");
      clearPhoto();
      return false;
    }
    return true;
  };

  photoInput?.addEventListener("change", () => {
    clearStatus();
    const file = photoInput.files?.[0];
    if (!file) {
      clearPhoto();
      return;
    }
    if (!validatePhoto(file)) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    if (photoPreviewImage) {
      photoPreviewImage.src = previewUrl;
      photoPreviewImage.alt = file.name;
    }
    if (photoPreview) photoPreview.hidden = false;
  });

  photoRemove?.addEventListener("click", () => {
    clearPhoto();
    clearStatus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearStatus();
    if (!form.reportValidity()) return;

    if (!supabase) {
      setStatus(form.dataset.msgError || "No pudimos enviar tu opinión.", "error");
      return;
    }

    const guestName = fieldValue("guest_name").trim();
    const message = fieldValue("message").trim();
    const rating = Number(fieldValue("rating") || 5);
    const file = photoInput?.files?.[0];

    if (file && !validatePhoto(file)) return;

    setSending(true);
    try {
      let photoUrl: string | null = null;
      if (file) {
        const extension = PHOTO_TYPES[file.type];
        const path = `pending/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("guest-review-photos")
          .upload(path, file, {
            upsert: false,
            contentType: file.type,
            cacheControl: "31536000",
          });
        if (uploadError) throw uploadError;
        photoUrl = supabase.storage.from("guest-review-photos").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from("guest_review").insert({
        guest_name: guestName,
        rating,
        message,
        language: form.dataset.lang === "en" ? "en" : "es",
        photo_url: photoUrl,
      });
      if (error) throw error;

      form.reset();
      clearPhoto();
      setStatus(form.dataset.msgSuccess || "Recibimos tu opinión.", "success");
    } catch (error) {
      console.error("No se pudo enviar la opinión", error);
      setStatus(form.dataset.msgError || "No pudimos enviar tu opinión.", "error");
    } finally {
      setSending(false);
    }
  });
}
