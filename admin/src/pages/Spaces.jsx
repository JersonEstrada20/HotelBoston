import React, { useEffect, useState } from "react";
import { BedDouble, ImagePlus, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { supabase, uploadPublicFile } from "@/lib/supabase";
import { PageHeader, Spinner, Notice, EmptyState, Modal } from "@/components/ui";
import { formatClp } from "@/lib/format";

const amenityOptions = [
  ["attention", "Atención cercana"],
  ["breakfast", "Desayuno"],
  ["parking", "Estacionamiento"],
  ["wifi", "Wi-Fi"],
  ["tv", "TV"],
  ["heating", "Calefacción"],
  ["bathroom", "Baño privado"],
  ["phone", "Teléfono"],
  ["commonAreas", "Áreas comunes"],
  ["whiteboard", "Pizarra"],
  ["projector", "Proyector"],
  ["catering", "Catering"],
];

const emptyForm = {
  id: "",
  slug: "",
  name: "",
  name_en: "",
  type: "habitacion",
  capacity: "2",
  sector: "Habitaciones",
  size: "",
  beds_es: "",
  beds_en: "",
  short_es: "",
  short_en: "",
  description: "",
  description_en: "",
  prices: [],
  amenities: [],
  images: [],
  is_active: true,
  order: 0,
};

function normalizeType(type) {
  if (type === "cabaña") return "habitacion";
  if (type === "salón") return "salon";
  return type || "habitacion";
}

function normalizePrices(prices) {
  if (!Array.isArray(prices)) return [];
  return prices.map((price) => ({
    amount: Number(price?.amount) || 0,
    label: {
      es: typeof price?.label === "string" ? price.label : price?.label?.es || "",
      en: typeof price?.label === "string" ? price.label : price?.label?.en || "",
    },
  }));
}

export default function Spaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase.from("cabin").select("*").order("order", { ascending: true });
    if (loadError) setError(loadError.message || "No se pudieron cargar los espacios.");
    else setSpaces(data || []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Habitaciones y salones · Hotel Boston";
    void load();
  }, []);

  const openNew = () => {
    setError("");
    setMessage("");
    setImageUrl("");
    setForm({ ...emptyForm, order: spaces.length + 1 });
  };

  const openEdit = (space) => {
    setError("");
    setMessage("");
    setImageUrl("");
    setForm({
      ...emptyForm,
      ...space,
      type: normalizeType(space.type),
      prices: normalizePrices(space.prices),
      images: space.images || [],
      amenities: space.amenities || [],
    });
  };

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const toggleAmenity = (key) => {
    const current = form.amenities || [];
    update("amenities", current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const updatePrice = (index, field, value) => {
    const prices = [...form.prices];
    if (field === "amount") prices[index] = { ...prices[index], amount: Number(value) || 0 };
    else prices[index] = { ...prices[index], label: { ...prices[index].label, [field]: value } };
    update("prices", prices);
  };

  const addPrice = () => update("prices", [...form.prices, { amount: 0, label: { es: "", en: "" } }]);
  const removePrice = (index) => update("prices", form.prices.filter((_, position) => position !== index));

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) uploaded.push(await uploadPublicFile(file));
      update("images", [...(form.images || []), ...uploaded]);
      setMessage(`${uploaded.length} imagen(es) cargada(s). Guarda para publicarlas.`);
    } catch (uploadError) {
      setError(uploadError?.message || "No se pudieron cargar las imágenes.");
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const value = imageUrl.trim();
    if (!value) return;
    if (!value.startsWith("/") && !value.startsWith("https://")) {
      setError("La URL debe ser una ruta interna que empiece con / o una dirección HTTPS.");
      return;
    }
    update("images", [...(form.images || []), value]);
    setImageUrl("");
  };

  const save = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!/^[a-z0-9-]+$/.test(form.slug.trim())) {
      setError("El identificador debe usar minúsculas, números y guiones.");
      return;
    }
    if (form.type === "habitacion" && form.prices.length === 0) {
      setError("Agrega al menos un precio para la habitación.");
      return;
    }
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      name_en: form.name_en.trim() || form.name.trim(),
      type: form.type,
      capacity: String(form.capacity || "").trim(),
      sector: form.sector.trim(),
      size: form.size.trim() || null,
      beds_es: form.beds_es.trim() || null,
      beds_en: form.beds_en.trim() || null,
      short_es: form.short_es.trim() || null,
      short_en: form.short_en.trim() || null,
      description: form.description.trim() || null,
      description_en: form.description_en.trim() || null,
      prices: form.prices,
      amenities: form.amenities,
      images: form.images,
      is_active: Boolean(form.is_active),
      order: Number(form.order) || 0,
    };
    setSaving(true);
    try {
      const query = form.id
        ? supabase.from("cabin").update(payload).eq("id", form.id)
        : supabase.from("cabin").insert(payload);
      const { error: saveError } = await query;
      if (saveError) throw saveError;
      setMessage(form.id ? "Espacio actualizado. Publica el sitio para reflejar los cambios." : "Espacio creado. Publica el sitio para reflejar los cambios.");
      setForm(null);
      await load();
    } catch (saveError) {
      setError(saveError?.message || "No se pudo guardar el espacio.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (space) => {
    if (!window.confirm(`¿Eliminar “${space.name}”? Las reservas existentes conservarán el nombre guardado.`)) return;
    setError("");
    const { error: deleteError } = await supabase.from("cabin").delete().eq("id", space.id);
    if (deleteError) setError(deleteError.message);
    else {
      setMessage("Espacio eliminado.");
      await load();
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Contenido"
        title="Habitaciones y salones"
        description="Administra nombres, descripciones, precios, capacidad, servicios y fotografías."
        actions={<button type="button" className="button button-primary" onClick={openNew}><Plus size={17} /> Nuevo espacio</button>}
      />
      <Notice>{message}</Notice>
      <Notice kind="error">{error}</Notice>

      {loading ? <Spinner /> : spaces.length === 0 ? (
        <EmptyState title="No hay espacios registrados">Crea la primera habitación o salón.</EmptyState>
      ) : (
        <div className="space-grid">
          {spaces.map((space) => (
            <article className="space-card" key={space.id}>
              <div className="space-image">
                {space.images?.[0] ? <img src={space.images[0]} alt="" /> : <BedDouble size={30} />}
                {!space.is_active && <span className="inactive-chip">Oculto</span>}
              </div>
              <div className="space-body">
                <div className="space-title">
                  <div>
                    <span className="eyebrow">{space.type === "salon" ? "Salón" : "Habitación"}</span>
                    <h2>{space.name}</h2>
                  </div>
                  <span className="order-chip">#{space.order ?? 0}</span>
                </div>
                <p>{space.short_es || space.description || "Sin descripción breve."}</p>
                <div className="space-meta">
                  <span>{space.capacity || "—"} personas</span>
                  {space.prices?.[0] ? <span>Desde {formatClp(space.prices[0].amount)}</span> : <span>Sin precio</span>}
                </div>
                <div className="card-actions">
                  <button type="button" className="button button-quiet" onClick={() => openEdit(space)}><Pencil size={15} /> Editar</button>
                  <button type="button" className="button button-danger" onClick={() => remove(space)}><Trash2 size={15} /> Eliminar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? `Editar ${form.name}` : "Nuevo espacio"} onClose={() => setForm(null)} wide>
          <form onSubmit={save} className="form-stack">
            <div className="form-grid">
              <label>Nombre en español<input required value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
              <label>Nombre en inglés<input value={form.name_en} onChange={(event) => update("name_en", event.target.value)} placeholder="Igual al español si se deja vacío" /></label>
              <label>Identificador URL<input required value={form.slug} onChange={(event) => update("slug", event.target.value.toLowerCase())} placeholder="single" /></label>
              <label>Tipo<select value={form.type} onChange={(event) => update("type", event.target.value)}><option value="habitacion">Habitación</option><option value="salon">Salón</option></select></label>
              <label>Capacidad<input required value={form.capacity} onChange={(event) => update("capacity", event.target.value)} placeholder="2" /></label>
              <label>Sector<input value={form.sector} onChange={(event) => update("sector", event.target.value)} placeholder="Habitaciones" /></label>
              <label>Tamaño<input value={form.size || ""} onChange={(event) => update("size", event.target.value)} placeholder="24 m²" /></label>
              <label>Orden<input type="number" value={form.order} onChange={(event) => update("order", event.target.value)} /></label>
              <label>Camas en español<input value={form.beds_es || ""} onChange={(event) => update("beds_es", event.target.value)} placeholder="1 cama de 2 plazas" /></label>
              <label>Camas en inglés<input value={form.beds_en || ""} onChange={(event) => update("beds_en", event.target.value)} placeholder="1 double bed" /></label>
            </div>

            <label>Descripción breve en español<textarea rows="2" value={form.short_es || ""} onChange={(event) => update("short_es", event.target.value)} /></label>
            <label>Descripción breve en inglés<textarea rows="2" value={form.short_en || ""} onChange={(event) => update("short_en", event.target.value)} /></label>
            <label>Descripción completa en español<textarea rows="4" value={form.description || ""} onChange={(event) => update("description", event.target.value)} /></label>
            <label>Descripción completa en inglés<textarea rows="4" value={form.description_en || ""} onChange={(event) => update("description_en", event.target.value)} /></label>

            <fieldset className="fieldset">
              <legend>Precios</legend>
              {form.prices.length === 0 && <p className="muted">Sin precios. Los salones pueden quedar sin precio.</p>}
              {form.prices.map((price, index) => (
                <div className="price-row" key={index}>
                  <label>Etiqueta ES<input value={price.label.es} onChange={(event) => updatePrice(index, "es", event.target.value)} placeholder="Valor por persona" /></label>
                  <label>Etiqueta EN<input value={price.label.en} onChange={(event) => updatePrice(index, "en", event.target.value)} placeholder="Rate per person" /></label>
                  <label>Monto CLP<input type="number" min="0" value={price.amount} onChange={(event) => updatePrice(index, "amount", event.target.value)} /></label>
                  <button type="button" className="icon-button danger" onClick={() => removePrice(index)} aria-label="Quitar precio"><Trash2 size={17} /></button>
                </div>
              ))}
              <button type="button" className="button button-quiet" onClick={addPrice}><Plus size={15} /> Agregar precio</button>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Servicios incluidos</legend>
              <div className="check-grid">
                {amenityOptions.map(([key, label]) => (
                  <label key={key} className="check-item">
                    <input type="checkbox" checked={form.amenities.includes(key)} onChange={() => toggleAmenity(key)} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="fieldset">
              <legend>Fotografías</legend>
              <div className="image-grid">
                {(form.images || []).map((image, index) => (
                  <div className="image-item" key={`${image}-${index}`}>
                    <img src={image} alt="" />
                    <button type="button" className="icon-button danger" onClick={() => update("images", form.images.filter((_, position) => position !== index))} aria-label="Quitar imagen"><Trash2 size={15} /></button>
                  </div>
                ))}
                <label className="upload-tile">
                  {uploading ? <Loader2 className="spin" size={22} /> : <ImagePlus size={22} />}
                  <span>{uploading ? "Cargando…" : "Subir fotos"}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
              <div className="inline-add">
                <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://… o /images/rooms/foto.jpg" />
                <button type="button" className="button button-quiet" onClick={addImageUrl}>Agregar URL</button>
              </div>
            </fieldset>

            <label className="check-item">
              <input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} />
              <span>Visible en el sitio público</span>
            </label>

            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setForm(null)}>Cancelar</button>
              <button type="submit" className="button button-primary" disabled={saving || uploading}>
                {saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
                {saving ? "Guardando…" : "Guardar espacio"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
