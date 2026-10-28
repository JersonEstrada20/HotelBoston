import React, { useEffect, useState } from "react";
import { CloudUpload, Globe2, ImagePlus, Loader2, MessageCircle, Plus, Save, Trash2 } from "lucide-react";
import { supabase, uploadPublicFile, functionErrorMessage } from "@/lib/supabase";
import { PageHeader, Spinner, Notice } from "@/components/ui";
import { formatDate, normalizePhone } from "@/lib/format";

function validActionUrl(value) {
  if (!value.trim()) return true;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export default function Settings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase.from("site_settings").select("*").eq("id", "main").single();
    if (loadError) setError(loadError.message || "No se pudo cargar la configuración.");
    else setForm({ ...data, phones: Array.isArray(data.phones) ? data.phones : [] });
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Sitio y promoción · Hotel Boston";
    void load();
  }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const updatePhone = (index, field, value) => {
    const phones = [...form.phones];
    phones[index] = { ...phones[index], [field]: value };
    update("phones", phones);
  };

  const save = async (event, { quiet = false } = {}) => {
    event?.preventDefault();
    setError("");
    setMessage("");
    const phone = normalizePhone(form.whatsapp_phone);
    if (!phone) {
      setError("El WhatsApp debe incluir código de país y entre 6 y 15 dígitos.");
      return false;
    }
    if (form.promo_enabled && !form.promo_image_url) {
      setError("Carga el flyer antes de activar la promoción.");
      return false;
    }
    if (!validActionUrl(form.promo_button_url || "")) {
      setError("El enlace del botón debe ser HTTPS o una ruta interna que empiece con /.");
      return false;
    }
    setSaving(true);
    try {
      const { error: saveError } = await supabase
        .from("site_settings")
        .update({
          whatsapp_phone: phone,
          contact_email: form.contact_email.trim(),
          phones: form.phones.filter((item) => item.label.trim() || item.href.trim()),
          founded: Number(form.founded) || 1997,
          address: form.address.trim(),
          address_full: form.address_full.trim(),
          map_embed: form.map_embed.trim(),
          maps_url: form.maps_url.trim(),
          waze_url: form.waze_url.trim(),
          promo_enabled: Boolean(form.promo_enabled),
          promo_image_url: form.promo_image_url || null,
          promo_title: form.promo_title || "",
          promo_message: form.promo_message || "",
          promo_button_label: form.promo_button_label || "",
          promo_button_url: form.promo_button_url || "",
          promo_updated_at: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        })
        .eq("id", "main");
      if (saveError) throw saveError;
      if (!quiet) setMessage("Cambios guardados. Pulsa “Publicar sitio” para actualizar la web.");
      return true;
    } catch (saveError) {
      setError(saveError?.message || "No se pudieron guardar los cambios.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setError("");
    setMessage("");
    const saved = await save(null, { quiet: true });
    if (!saved) return;
    setPublishing(true);
    try {
      const { data, error: publishError } = await supabase.functions.invoke("publishSite", { body: {} });
      if (publishError) throw publishError;
      if (data?.error) throw new Error(data.error);
      if (!data?.configured) {
        setError("El sitio se guardó, pero falta configurar el deploy hook de Cloudflare en la función publishSite.");
        return;
      }
      setMessage("Publicación iniciada. Cloudflare reconstruirá el sitio en 1-2 minutos.");
      await load();
    } catch (publishError) {
      setError(await functionErrorMessage(publishError));
    } finally {
      setPublishing(false);
    }
  };

  const uploadPromo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      update("promo_image_url", await uploadPublicFile(file));
      setMessage("Flyer cargado. Guarda o publica para aplicarlo.");
    } catch (uploadError) {
      setError(uploadError?.message || "No se pudo cargar el flyer.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <><PageHeader title="Sitio y promoción" /><Spinner /></>;
  if (!form) return <><PageHeader title="Sitio y promoción" /><Notice kind="error">{error}</Notice></>;

  return (
    <>
      <PageHeader
        eyebrow="Configuración"
        title="Sitio y promoción"
        description="Datos de contacto y anuncio de inicio. Los cambios se publican al reconstruir el sitio."
        actions={
          <>
            <button type="button" className="button button-quiet" onClick={publish} disabled={saving || publishing}>
              {publishing ? <Loader2 className="spin" size={17} /> : <CloudUpload size={17} />}
              {publishing ? "Publicando…" : "Publicar sitio"}
            </button>
            <button type="button" className="button button-primary" onClick={save} disabled={saving || uploading}>
              {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
              Guardar
            </button>
          </>
        }
      />

      <Notice>{message}</Notice>
      <Notice kind="error">{error}</Notice>

      <form onSubmit={save} className="panel form-stack">
        <div className="panel-heading"><div><h2>Contacto</h2><p>Se usa en el sitio, formularios y correos.</p></div><Globe2 size={20} /></div>
        <div className="form-grid">
          <label>Correo de reservas<input type="email" required value={form.contact_email || ""} onChange={(event) => update("contact_email", event.target.value)} /></label>
          <label>WhatsApp<input required value={form.whatsapp_phone || ""} onChange={(event) => update("whatsapp_phone", event.target.value)} placeholder="51987292169" /><small>Formato internacional sin +.</small></label>
          <label>Año de fundación<input type="number" min="1900" max="2100" value={form.founded || 1997} onChange={(event) => update("founded", event.target.value)} /></label>
          <label>Dirección corta<input required value={form.address || ""} onChange={(event) => update("address", event.target.value)} /></label>
          <label className="span-2">Dirección completa<input required value={form.address_full || ""} onChange={(event) => update("address_full", event.target.value)} /></label>
        </div>

        <fieldset className="fieldset">
          <legend>Teléfonos fijos</legend>
          {form.phones.map((phone, index) => (
            <div className="phone-row" key={index}>
              <label>Texto visible<input value={phone.label || ""} onChange={(event) => updatePhone(index, "label", event.target.value)} placeholder="(33) 225 3197" /></label>
              <label>Enlace tel:<input value={phone.href || ""} onChange={(event) => updatePhone(index, "href", event.target.value)} placeholder="+56332253197" /></label>
              <button type="button" className="icon-button danger" onClick={() => update("phones", form.phones.filter((_, position) => position !== index))} aria-label="Quitar teléfono"><Trash2 size={17} /></button>
            </div>
          ))}
          <button type="button" className="button button-quiet" onClick={() => update("phones", [...form.phones, { label: "", href: "" }])}><Plus size={15} /> Agregar teléfono</button>
        </fieldset>

        <div className="form-grid">
          <label className="span-2">Mapa embed<input value={form.map_embed || ""} onChange={(event) => update("map_embed", event.target.value)} /></label>
          <label>Google Maps<input value={form.maps_url || ""} onChange={(event) => update("maps_url", event.target.value)} /></label>
          <label>Waze<input value={form.waze_url || ""} onChange={(event) => update("waze_url", event.target.value)} /></label>
        </div>

        <div className="publish-status">
          <MessageCircle size={17} />
          {form.last_published_at
            ? <>Última publicación: <strong>{formatDate(form.last_published_at, true)}</strong></>
            : <>El sitio aún no registra una publicación desde el panel.</>}
        </div>
      </form>

      <form onSubmit={save} className="panel form-stack">
        <div className="panel-heading"><div><h2>Promoción de inicio</h2><p>Flyer opcional que aparece al entrar al sitio.</p></div><ImagePlus size={20} /></div>
        <label className="check-item">
          <input type="checkbox" checked={Boolean(form.promo_enabled)} onChange={(event) => update("promo_enabled", event.target.checked)} />
          <span>Mostrar promoción en la página principal</span>
        </label>

        {form.promo_image_url ? (
          <div className="promo-preview">
            <img src={form.promo_image_url} alt="Vista previa de la promoción" />
            <button type="button" className="button button-danger" onClick={() => update("promo_image_url", "")}><Trash2 size={15} /> Quitar flyer</button>
          </div>
        ) : (
          <label className="upload-tile upload-wide">
            {uploading ? <Loader2 className="spin" size={24} /> : <ImagePlus size={24} />}
            <span>{uploading ? "Cargando…" : "Subir flyer JPG, PNG, WebP o GIF"}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={uploadPromo} disabled={uploading} />
          </label>
        )}

        <div className="form-grid">
          <label>Título<input maxLength={100} value={form.promo_title || ""} onChange={(event) => update("promo_title", event.target.value)} /></label>
          <label>Texto<input maxLength={240} value={form.promo_message || ""} onChange={(event) => update("promo_message", event.target.value)} /></label>
          <label>Texto del botón<input maxLength={40} value={form.promo_button_label || ""} onChange={(event) => update("promo_button_label", event.target.value)} /></label>
          <label>Destino del botón<input value={form.promo_button_url || ""} onChange={(event) => update("promo_button_url", event.target.value)} placeholder="/reservas" /></label>
        </div>
      </form>
    </>
  );
}
