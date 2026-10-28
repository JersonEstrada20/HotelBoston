import React, { useEffect, useMemo, useState } from "react";
import { DoorOpen, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Spinner, Notice, EmptyState, Modal } from "@/components/ui";
import { formatDate, nowTime, todayIso } from "@/lib/format";

export default function Entries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [checkoutEntry, setCheckoutEntry] = useState(null);
  const [checkout, setCheckout] = useState({ date: todayIso(), time: nowTime() });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("visitor_entry")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_date", { ascending: false })
      .limit(300);
    if (loadError) setError(loadError.message || "No se pudieron cargar los ingresos.");
    else setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Ingresos · Hotel Boston";
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => {
      const people = Array.isArray(entry.people) ? entry.people : [];
      return entry.cabin?.toLowerCase().includes(needle)
        || people.some((person) => `${person.full_name || ""} ${person.document || ""} ${person.phone || ""}`.toLowerCase().includes(needle));
    });
  }, [entries, query]);

  const registerCheckout = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { data, error: checkoutError } = await supabase.rpc("register_visitor_checkout", {
        p_entry_id: checkoutEntry.id,
        p_checkout_time: checkout.time,
        p_checkout_date: checkout.date,
      });
      if (checkoutError) throw checkoutError;
      setMessage(data?.whatsapp_thanks_status === "pending"
        ? "Salida registrada. El agradecimiento por WhatsApp quedó en cola."
        : "Salida registrada.");
      setCheckoutEntry(null);
      await load();
    } catch (checkoutError) {
      setError(checkoutError?.message || "No se pudo registrar la salida.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Recepción" title="Ingresos registrados" description="Historial de ingresos y salidas del hotel." />
      <Notice>{message}</Notice>
      <Notice kind="error">{error}</Notice>

      <div className="toolbar">
        <label className="search-field">
          <Search size={17} />
          <input type="search" placeholder="Buscar persona, documento o espacio" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState title="No hay ingresos registrados">Los ingresos aparecerán aquí después de registrarlos.</EmptyState>
      ) : (
        <div className="entry-list">
          {filtered.map((entry) => {
            const people = Array.isArray(entry.people) ? entry.people : [];
            const responsible = people[entry.responsible_person_index] || people[0];
            return (
              <article className="entry-card" key={entry.id}>
                <div className="entry-main">
                  <div className="entry-title">
                    <strong>{entry.cabin}</strong>
                    {entry.check_out_time ? <span className="badge badge-confirmada">Salió</span> : <span className="badge badge-pendiente">En hotel</span>}
                  </div>
                  <p>{responsible?.full_name || `${people.length} personas`} · {people.length} {people.length === 1 ? "persona" : "personas"}</p>
                  <small>
                    Ingreso {formatDate(entry.entry_date)} {entry.check_in_time || ""}
                    {entry.check_out_time ? ` · Salida ${formatDate(entry.check_out_date || entry.entry_date)} ${entry.check_out_time}` : ""}
                  </small>
                  {people.length > 1 && (
                    <details>
                      <summary>Ver personas</summary>
                      <ul>{people.map((person, index) => <li key={index}>{person.full_name}{person.document ? ` · ${person.document}` : ""}</li>)}</ul>
                    </details>
                  )}
                </div>
                <div className="entry-actions">
                  {!entry.check_out_time && (
                    <button type="button" className="button button-primary" onClick={() => {
                      setCheckoutEntry(entry);
                      setCheckout({ date: todayIso(), time: nowTime() });
                    }}>
                      <DoorOpen size={16} /> Registrar salida
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {checkoutEntry && (
        <Modal title={`Salida de ${checkoutEntry.cabin}`} onClose={() => setCheckoutEntry(null)}>
          <form onSubmit={registerCheckout} className="form-stack">
            <div className="form-grid">
              <label>Fecha de salida<input type="date" required value={checkout.date} onChange={(event) => setCheckout((current) => ({ ...current, date: event.target.value }))} /></label>
              <label>Hora de salida<input type="time" required value={checkout.time} onChange={(event) => setCheckout((current) => ({ ...current, time: event.target.value }))} /></label>
            </div>
            {checkoutEntry.whatsapp_thanks_consent && <p className="muted">La persona autorizó el agradecimiento por WhatsApp.</p>}
            <div className="modal-actions">
              <button type="button" className="button button-quiet" onClick={() => setCheckoutEntry(null)}>Cancelar</button>
              <button type="submit" className="button button-primary" disabled={busy}>{busy ? "Registrando…" : "Registrar salida"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
