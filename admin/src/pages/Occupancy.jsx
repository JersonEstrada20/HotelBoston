import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Spinner, Notice, EmptyState } from "@/components/ui";
import { dateOffset, formatDate, todayIso } from "@/lib/format";

const dayCount = 21;

export default function Occupancy() {
  const [cabins, setCabins] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rangeStart = todayIso();
  const rangeEnd = dateOffset(dayCount);
  const days = useMemo(() => Array.from({ length: dayCount }, (_, index) => dateOffset(index)), []);

  useEffect(() => {
    document.title = "Ocupación · Hotel Boston";
    const load = async () => {
      const [cabinResult, bookingResult, calendarResult, blockResult] = await Promise.all([
        supabase.from("cabin").select("id, name, type").eq("is_active", true).order("order"),
        supabase.from("booking_request").select("id, name, cabin, arrival_date, departure_date, guests, status").eq("status", "confirmada").lt("arrival_date", rangeEnd).gt("departure_date", rangeStart).order("arrival_date"),
        supabase.from("external_calendar").select("id, cabin_id"),
        supabase.from("external_calendar_block").select("calendar_id, starts_on, ends_on").lt("starts_on", rangeEnd).gt("ends_on", rangeStart),
      ]);
      const firstError = cabinResult.error || bookingResult.error || calendarResult.error || blockResult.error;
      if (firstError) setError(firstError.message);
      else {
        setCabins(cabinResult.data || []);
        setBookings(bookingResult.data || []);
        setCalendars(calendarResult.data || []);
        setBlocks(blockResult.data || []);
      }
      setLoading(false);
    };
    void load();
  }, [rangeStart, rangeEnd]);

  const calendarCabin = useMemo(() => new Map(calendars.map((calendar) => [calendar.id, calendar.cabin_id])), [calendars]);

  const occupiedToday = cabins.filter((cabin) => bookings.some((booking) => booking.cabin === cabin.name && booking.arrival_date <= rangeStart && booking.departure_date > rangeStart)).length;

  return (
    <>
      <PageHeader eyebrow="Operación" title="Ocupación" description="Reservas confirmadas y bloqueos externos de los próximos 21 días." />
      <Notice kind="error">{error}</Notice>

      <div className="occupancy-summary">
        <div><span>Espacios activos</span><strong>{cabins.length}</strong></div>
        <div><span>Ocupados hoy</span><strong>{occupiedToday}</strong></div>
        <div><span>Llegadas próximas</span><strong>{bookings.filter((booking) => booking.arrival_date > rangeStart).length}</strong></div>
        <div><span>Bloqueos externos</span><strong>{blocks.length}</strong></div>
      </div>

      {loading ? <Spinner /> : cabins.length === 0 ? <EmptyState title="No hay espacios activos" /> : (
        <>
          <div className="legend">
            <span><i className="legend-reserved" /> Reserva confirmada</span>
            <span><i className="legend-blocked" /> Bloqueo externo</span>
            <span><i className="legend-free" /> Disponible</span>
          </div>
          <div className="occupancy-scroll">
            <table className="occupancy-table">
              <thead>
                <tr>
                  <th className="sticky-col">Espacio</th>
                  {days.map((day) => {
                    const date = new Date(`${day}T00:00:00`);
                    return <th key={day} className={day === rangeStart ? "today" : ""}><span>{date.toLocaleDateString("es-CL", { weekday: "short" })}</span>{date.getDate()}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {cabins.map((cabin) => {
                  const cabinBookings = bookings.filter((booking) => booking.cabin === cabin.name);
                  const cabinBlocks = blocks.filter((block) => calendarCabin.get(block.calendar_id) === cabin.id);
                  return (
                    <tr key={cabin.id}>
                      <th className="sticky-col"><strong>{cabin.name}</strong><small>{cabin.type === "salon" ? "Salón" : "Habitación"}</small></th>
                      {days.map((day) => {
                        const booking = cabinBookings.find((item) => item.arrival_date <= day && item.departure_date > day);
                        const block = cabinBlocks.find((item) => item.starts_on <= day && item.ends_on > day);
                        const nextDay = new Date(`${day}T00:00:00`);
                        nextDay.setDate(nextDay.getDate() + 1);
                        const next = nextDay.toISOString().slice(0, 10);
                        const startsHere = booking?.arrival_date === day;
                        const endsHere = booking?.departure_date === next;
                        const classNames = [booking ? "reserved" : "", block ? "blocked" : "", day === rangeStart ? "today" : ""].filter(Boolean).join(" ");
                        return (
                          <td key={day} className={classNames} title={booking ? `${booking.name} · ${formatDate(booking.arrival_date)} a ${formatDate(booking.departure_date)}` : block ? `Bloqueo externo ${block.starts_on} a ${block.ends_on}` : "Disponible"}>
                            {booking && startsHere ? <span>{booking.name.split(" ")[0]}{endsHere ? "" : " →"}</span> : booking ? (endsHere ? <span>← fin</span> : "") : block ? <span>Externo</span> : ""}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
