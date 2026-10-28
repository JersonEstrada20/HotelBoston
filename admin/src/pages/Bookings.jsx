import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Eye, Mail, MessageCircle, Search, X } from "lucide-react";
import { supabase, functionErrorMessage } from "@/lib/supabase";
import { PageHeader, Spinner, StatusBadge, Notice, EmptyState, Modal } from "@/components/ui";
import { formatDate, nightsBetween } from "@/lib/format";

const filters = [
  { value: "todas", label: "Todas" },
  { value: "pendiente", label: "Pendientes" },
  { value: "confirmada", label: "Confirmadas" },
  { value: "rechazada", label: "Rechazadas" },
];

export default function Bookings() {
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("todas");
  const [query, setQuery] = useState(searchParams.get("buscar") || "");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("booking_request")
      .select("*")
      .order("created_date", { ascending: false });
    if (loadError) setError(loadError.message || "No se pudieron cargar las solicitudes.");
    else setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Solicitudes · Hotel Boston";
    void load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (filter !== "todas" && booking.status !== filter) return false;
      if (!needle) return true;
      return [booking.name, booking.email, booking.phone, booking.cabin, booking.tracking_code]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [bookings, filter, query]);

  const updateStatus = async (booking, status) => {
    if (status === "rechazada" && !window.confirm(`¿Rechazar la solicitud de ${booking.name}? Se enviará un correo.`)) return;
    setBusyId(booking.id);
    setError("");
    setMessage("");
    try {
      const { data, error: updateError } = await supabase.functions.invoke("manageBooking", {
        body: { bookingId: booking.id, status },
      });
      if (updateError) throw updateError;
      if (data?.error) throw new Error(data.error);
      const updated = { ...booking, status };
      setBookings((current) => current.map((item) => item.id === booking.id ? updated : item));
      setSelected((current) => current?.id === booking.id ? updated : current);
      if (status === "pendiente") setMessage("Solicitud devuelta a pendiente.");
      else if (data?.email_sent === false) setMessage(`Estado actualizado a ${status}, pero Brevo no pudo enviar el correo. Revisa la configuración.`);
      else setMessage(`Solicitud ${status}. Correo enviado${data?.whatsappQueued ? " y WhatsApp en cola" : ""}.`);
    } catch (updateError) {
      setError(functionErrorMessage(updateError));
    } finally {
      setBusyId("");
    }
  };

  const notifyTeam = async (booking) => {
    setBusyId(booking.id);
    setError("");
    setMessage("");
    try {
      const { data, error: notifyError } = await supabase.functions.invoke("notifyNewBooking", {
        body: { booking_id: booking.id },
      });
      if (notifyError) throw notifyError;
      if (data?.error) throw new Error(data.error);
      setMessage(data?.duplicate ? "El equipo ya fue avisado de esta solicitud." : "Aviso enviado al equipo por Brevo.");
      await load();
    } catch (notifyError) {
      setError(functionErrorMessage(notifyError));
    } finally {
      setBusyId("");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Reservas"
        title="Solicitudes"
        description="Confirma o rechaza solicitudes. La confirmación envía correo por Brevo y puede encolar WhatsApp."
      />

      <Notice>{message}</Notice>
      <Notice kind="error">{error}</Notice>

      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Filtrar solicitudes">
          {filters.map((item) => (
            <button key={item.value} type="button" className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)}>
              {item.label}
              {item.value !== "todas" && <span>{bookings.filter((booking) => booking.status === item.value).length}</span>}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input type="search" placeholder="Buscar huésped, correo o espacio" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState title="No hay solicitudes con este filtro">Las nuevas solicitudes del sitio aparecerán aquí.</EmptyState>
      ) : (
        <div className="booking-list">
          {filtered.map((booking) => (
            <article className="booking-card" key={booking.id}>
              <div className="booking-main">
                <div className="booking-title">
                  <strong>{booking.name}</strong>
                  <StatusBadge status={booking.status} />
                </div>
                <p>{booking.cabin} · {booking.guests} {booking.guests === 1 ? "persona" : "personas"} · {nightsBetween(booking.arrival_date, booking.departure_date)} noches</p>
                <small>{formatDate(booking.arrival_date)} → {formatDate(booking.departure_date)} · recibida {formatDate(booking.created_date, true)}</small>
              </div>
              <div className="booking-actions">
                <button type="button" className="button button-quiet" onClick={() => setSelected(booking)}>
                  <Eye size={16} /> Detalle
                </button>
                {booking.status !== "confirmada" && (
                  <button type="button" className="button button-primary" disabled={busyId === booking.id} onClick={() => updateStatus(booking, "confirmada")}>
                    <Check size={16} /> Confirmar
                  </button>
                )}
                {booking.status !== "rechazada" && (
                  <button type="button" className="button button-danger" disabled={busyId === booking.id} onClick={() => updateStatus(booking, "rechazada")}>
                    <X size={16} /> Rechazar
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <Modal title={`Solicitud de ${selected.name}`} onClose={() => setSelected(null)}>
          <div className="detail-grid">
            <div><span>Estado</span><StatusBadge status={selected.status} /></div>
            <div><span>Espacio</span><strong>{selected.cabin}</strong></div>
            <div><span>Llegada</span><strong>{formatDate(selected.arrival_date)}</strong></div>
            <div><span>Salida</span><strong>{formatDate(selected.departure_date)}</strong></div>
            <div><span>Personas</span><strong>{selected.guests}</strong></div>
            <div><span>Código</span><strong>{selected.tracking_code || "—"}</strong></div>
          </div>
          <div className="contact-row">
            <a href={`mailto:${selected.email}`}><Mail size={16} /> {selected.email}</a>
            <a href={`https://wa.me/${String(selected.phone).replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> {selected.phone}</a>
          </div>
          {selected.message && <blockquote>{selected.message}</blockquote>}
          <div className="modal-actions">
            {selected.status !== "confirmada" && <button className="button button-primary" type="button" onClick={() => updateStatus(selected, "confirmada")}><Check size={16} /> Confirmar</button>}
            {selected.status !== "rechazada" && <button className="button button-danger" type="button" onClick={() => updateStatus(selected, "rechazada")}><X size={16} /> Rechazar</button>}
            {selected.status === "pendiente" && !selected.notification_sent_at && <button className="button button-quiet" type="button" onClick={() => notifyTeam(selected)}>Avisar al equipo</button>}
          </div>
        </Modal>
      )}
    </>
  );
}
