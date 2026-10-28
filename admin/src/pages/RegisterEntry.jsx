import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, UserRoundCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PageHeader, Spinner, Notice } from "@/components/ui";
import { formatDate, todayIso } from "@/lib/format";

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

const blankPerson = () => ({ full_name: "", document: "", phone: "", notes: "" });

export default function RegisterEntry() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    booking_request_id: "",
    cabin: "",
    entry_date: todayIso(),
    check_in_time: nowTime(),
    responsible_person_index: 0,
    whatsapp_thanks_consent: false,
    notes: "",
    people: [blankPerson()],
  });

  useEffect(() => {
    document.title = "Registrar ingreso · Hotel Boston";
    const load = async () => {
      const [spaceResult, bookingResult] = await Promise.all([
        supabase.from("cabin").select("id, name, type").eq("is_active", true).order("order"),
        supabase.from("booking_request").select("id, name, phone, cabin, arrival_date, departure_date, guests, status").eq("status", "confirmada").gte("departure_date", todayIso()).order("arrival_date").limit(100),
      ]);
      const firstError = spaceResult.error || bookingResult.error;
      if (firstError) setError(firstError.message);
      else {
        setSpaces(spaceResult.data || []);
        setBookings(bookingResult.data || []);
      }
      setLoading(false);
    };
    void load();
  }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updatePerson = (index, field, value) => {
    const people = [...form.people];
    people[index] = { ...people[index], [field]: value };
    update("people", people);
  };

  const selectBooking = (bookingId) => {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) {
      update("booking_request_id", "");
      return;
    }
    setForm((current) => ({
      ...current,
      booking_request_id: booking.id,
      cabin: booking.cabin,
      entry_date: booking.arrival_date,
      responsible_person_index: 0,
      people: [{ ...blankPerson(), full_name: booking.name, phone: booking.phone }],
    }));
  };

  const filteredBookings = useMemo(
    () => bookings.filter((booking) => !form.cabin || booking.cabin === form.cabin),
    [bookings, form.cabin],
  );

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!form.cabin) {
      setError("Selecciona una habitación o salón.");
      return;
    }
    const people = form.people.filter((person) => person.full_name.trim());
    if (people.length === 0) {
      setError("Agrega al menos una persona.");
      return;
    }
    setSaving(true);
    try {
      const { error: insertError } = await supabase.from("visitor_entry").insert({
        booking_request_id: form.booking_request_id || null,
        cabin: form.cabin,
        entry_date: form.entry_date,
        check_in_time: form.check_in_time,
        people,
        notes: form.notes.trim() || null,
        responsible_person_index: Math.min(form.responsible_person_index, people.length - 1),
        whatsapp_thanks_consent: Boolean(form.whatsapp_thanks_consent),
        created_by_id: user.id,
      });
      if (insertError) throw insertError;
      setMessage("Ingreso registrado correctamente.");
      setForm({
        booking_request_id: "",
        cabin: "",
        entry_date: todayIso(),
        check_in_time: nowTime(),
        responsible_person_index: 0,
        whatsapp_thanks_consent: false,
        notes: "",
        people: [blankPerson()],
      });
    } catch (insertError) {
      setError(insertError?.message || "No se pudo registrar el ingreso.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Recepción" title="Registrar ingreso" description="Registra las personas que ingresan y vincúlalas a una reserva confirmada." />
      <Notice>{message}</Notice>
      <Notice kind="error">{error}</Notice>

      {loading ? <Spinner /> : (
        <form onSubmit={submit} className="panel form-stack">
          <div className="form-grid">
            <label>Reserva confirmada opcional
              <select value={form.booking_request_id} onChange={(event) => selectBooking(event.target.value)}>
                <option value="">Sin reserva vinculada</option>
                {bookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.name} · {booking.cabin} · {formatDate(booking.arrival_date)}
                  </option>
                ))}
              </select>
            </label>
            <label>Habitación o salón
              <select required value={form.cabin} onChange={(event) => update("cabin", event.target.value)}>
                <option value="">Selecciona</option>
                {spaces.map((space) => <option key={space.id} value={space.name}>{space.name}</option>)}
              </select>
            </label>
            <label>Fecha de ingreso<input type="date" required value={form.entry_date} onChange={(event) => update("entry_date", event.target.value)} /></label>
            <label>Hora de ingreso<input type="time" required value={form.check_in_time} onChange={(event) => update("check_in_time", event.target.value)} /></label>
          </div>
          {filteredBookings.length > 0 && form.cabin && (
            <p className="muted small">{filteredBookings.length} reserva(s) confirmada(s) para este espacio.</p>
          )}

          <fieldset className="fieldset">
            <legend>Personas</legend>
            {form.people.map((person, index) => (
              <div className="person-row" key={index}>
                <div className="person-grid">
                  <label>Nombre completo<input required value={person.full_name} onChange={(event) => updatePerson(index, "full_name", event.target.value)} /></label>
                  <label>Documento<input value={person.document} onChange={(event) => updatePerson(index, "document", event.target.value)} /></label>
                  <label>Teléfono<input value={person.phone} onChange={(event) => updatePerson(index, "phone", event.target.value)} /></label>
                  <label>Notas<input value={person.notes} onChange={(event) => updatePerson(index, "notes", event.target.value)} /></label>
                </div>
                <label className="check-item responsible">
                  <input type="radio" name="responsible" checked={form.responsible_person_index === index} onChange={() => update("responsible_person_index", index)} />
                  <span>Persona responsable</span>
                </label>
                {form.people.length > 1 && (
                  <button type="button" className="icon-button danger" onClick={() => update("people", form.people.filter((_, position) => position !== index))} aria-label="Quitar persona"><Trash2 size={17} /></button>
                )}
              </div>
            ))}
            <button type="button" className="button button-quiet" onClick={() => update("people", [...form.people, blankPerson()])}><Plus size={15} /> Agregar persona</button>
          </fieldset>

          <label>Notas del ingreso<textarea rows="3" value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label>
          <label className="check-item">
            <input type="checkbox" checked={form.whatsapp_thanks_consent} onChange={(event) => update("whatsapp_thanks_consent", event.target.checked)} />
            <span>La persona autoriza un agradecimiento por WhatsApp al registrar la salida.</span>
          </label>

          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? <Loader2 className="spin" size={17} /> : <UserRoundCheck size={17} />}
            {saving ? "Registrando…" : "Registrar ingreso"}
          </button>
        </form>
      )}
    </>
  );
}
