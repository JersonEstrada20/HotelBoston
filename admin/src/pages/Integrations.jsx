import React, { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { supabase, functionErrorMessage } from "@/lib/supabase";
import { PageHeader, Spinner, Notice, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";

const providers = [
  { value: "airbnb", label: "Airbnb" },
  { value: "booking", label: "Booking.com" },
  { value: "other", label: "Otro calendario iCal" },
];

export default function Integrations() {
  const [cabins, setCabins] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [exports, setExports] = useState([]);
  const [form, setForm] = useState({ cabin_id: "", provider: "airbnb", feed_url: "", label: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const baseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;

  const load = async () => {
    setLoading(true);
    const [cabinResult, calendarResult, exportResult] = await Promise.all([
      supabase.from("cabin").select("id, name, type").order("order"),
      supabase.from("external_calendar").select("*, cabin(name)").order("created_at", { ascending: false }),
      supabase.from("external_calendar_export").select("cabin_id, token"),
    ]);
    const firstError = cabinResult.error || calendarResult.error || exportResult.error;
    if (firstError) setError(firstError.message);
    else {
      const rooms = (cabinResult.data || []).filter((cabin) => cabin.type !== "salon" && cabin.type !== "salón");
      setCabins(rooms);
      setCalendars(calendarResult.data || []);
      setExports(exportResult.data || []);
      setForm((current) => ({ ...current, cabin_id: current.cabin_id || rooms[0]?.id || "" }));
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Calendarios · Hotel Boston";
    void load();
  }, []);

  const exportByCabin = useMemo(() => new Map(exports.map((item) => [item.cabin_id, item.token])), [exports]);
  const feedUrl = (token) => `${baseUrl}/functions/v1/externalCalendarFeed?token=${token}`;
  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const addCalendar = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const parsed = new URL(form.feed_url.trim());
      if (parsed.protocol !== "https:") throw new Error("El enlace iCal debe comenzar con https://.");
      const { error: insertError } = await supabase.from("external_calendar").insert({
        cabin_id: form.cabin_id,
        provider: form.provider,
        feed_url: form.feed_url.trim(),
        label: form.label.trim(),
      });
      if (insertError) throw insertError;
      setForm((current) => ({ ...current, feed_url: "", label: "" }));
      setMessage("Calendario agregado. Sincronízalo para importar las fechas ocupadas.");
      await load();
    } catch (saveError) {
      setError(saveError?.message || "No se pudo guardar el calendario.");
    } finally {
      setSaving(false);
    }
  };

  const sync = async (calendar) => {
    setBusy(calendar.id);
    setError("");
    setMessage("");
    try {
      const { data, error: syncError } = await supabase.functions.invoke("syncExternalCalendars", {
        body: { calendar_id: calendar.id },
      });
      if (syncError) throw syncError;
      if (data?.error) throw new Error(data.error);
      setMessage(`${calendar.cabin?.name || "Espacio"}: ${data.imported} bloqueo(s) importado(s).`);
      await load();
    } catch (syncError) {
      setError(functionErrorMessage(syncError));
    } finally {
      setBusy("");
    }
  };

  const remove = async (calendar) => {
    if (!window.confirm(`¿Quitar el calendario ${calendar.provider} de ${calendar.cabin?.name}?`)) return;
    const { error: deleteError } = await supabase.from("external_calendar").delete().eq("id", calendar.id);
    if (deleteError) setError(deleteError.message);
    else {
      setMessage("Calendario eliminado.");
      await load();
    }
  };

  const copy = async (value) => {
    await navigator.clipboard.writeText(value);
    setMessage("Enlace copiado. Pégalo como calendario importado en Airbnb o Booking.com.");
  };

  return (
    <>
      <PageHeader eyebrow="Distribución" title="Calendarios externos" description="Conecta Airbnb y Booking.com por iCal para evitar sobreventa." />
      <Notice>{message}</Notice>
      <Notice kind="error">{error}</Notice>

      <div className="info-banner">
        <strong>La conexión es de ida y vuelta.</strong>
        <p>Pega el enlace que exporta Airbnb o Booking.com. Luego copia el enlace de cada habitación y pégalo como calendario importado en esas plataformas. iCal no es instantáneo.</p>
      </div>

      {loading ? <Spinner /> : (
        <>
          <section className="panel">
            <div className="panel-heading"><div><h2>1. Importar ocupación externa</h2><p>Fechas de Airbnb, Booking.com u otros iCal.</p></div><Link2 size={20} /></div>
            <form onSubmit={addCalendar} className="form-grid">
              <label>Habitación<select required value={form.cabin_id} onChange={(event) => set("cabin_id", event.target.value)}><option value="">Selecciona</option>{cabins.map((cabin) => <option key={cabin.id} value={cabin.id}>{cabin.name}</option>)}</select></label>
              <label>Plataforma<select value={form.provider} onChange={(event) => set("provider", event.target.value)}>{providers.map((provider) => <option key={provider.value} value={provider.value}>{provider.label}</option>)}</select></label>
              <label className="span-2">Enlace iCal<input type="url" required placeholder="https://… .ics" value={form.feed_url} onChange={(event) => set("feed_url", event.target.value)} /></label>
              <label className="span-2">Nombre opcional<input value={form.label} onChange={(event) => set("label", event.target.value)} /></label>
              <button type="submit" className="button button-primary" disabled={saving || !form.cabin_id}>{saving ? <Loader2 className="spin" size={17} /> : <Link2 size={17} />} Agregar calendario</button>
            </form>
          </section>

          <section className="panel">
            <div className="panel-heading"><div><h2>Calendarios conectados</h2><p>Sincroniza cuando cambien las reservas externas.</p></div><RefreshCw size={20} /></div>
            {calendars.length === 0 ? <EmptyState title="No hay calendarios externos conectados." /> : (
              <div className="calendar-list">
                {calendars.map((calendar) => (
                  <div className="calendar-row" key={calendar.id}>
                    <div className="calendar-main">
                      <strong>{calendar.cabin?.name} · {providers.find((provider) => provider.value === calendar.provider)?.label || calendar.provider}</strong>
                      <small>{calendar.feed_url}</small>
                      <small>{calendar.last_synced_at ? `Última sincronización: ${formatDate(calendar.last_synced_at, true)}` : "Aún no sincronizado"}{calendar.last_error ? ` · Error: ${calendar.last_error}` : ""}</small>
                    </div>
                    <div className="calendar-actions">
                      <button type="button" className="button button-quiet" disabled={busy === calendar.id} onClick={() => sync(calendar)}>{busy === calendar.id ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />} Sincronizar</button>
                      <button type="button" className="icon-button danger" onClick={() => remove(calendar)} aria-label="Eliminar calendario"><Trash2 size={17} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-heading"><div><h2>2. Exportar reservas del hotel</h2><p>Copia el enlace de cada habitación en Airbnb y Booking.com.</p></div><Copy size={20} /></div>
            <div className="export-list">
              {cabins.map((cabin) => {
                const token = exportByCabin.get(cabin.id);
                return (
                  <div className="export-row" key={cabin.id}>
                    <strong>{cabin.name}</strong>
                    {token ? (
                      <>
                        <code>{feedUrl(token)}</code>
                        <button type="button" className="button button-quiet" onClick={() => copy(feedUrl(token))}><Copy size={15} /> Copiar</button>
                      </>
                    ) : <span className="muted">Disponible después de aplicar las migraciones.</span>}
                  </div>
                );
              })}
            </div>
          </section>
          {message && <p className="inline-success"><Check size={16} /> {message}</p>}
        </>
      )}
    </>
  );
}
