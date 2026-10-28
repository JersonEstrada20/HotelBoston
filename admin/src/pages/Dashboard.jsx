import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BedDouble, CalendarCheck, CalendarClock, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PageHeader, Spinner, Stat, StatusBadge, Notice } from "@/components/ui";
import { formatDate, todayIso, dateOffset } from "@/lib/format";

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const [data, setData] = useState({ pending: 0, arrivals: 0, occupied: 0, spaces: 0, reviews: 0, latest: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = todayIso();
  const weekAhead = dateOffset(7);

  useEffect(() => {
    document.title = "Resumen · Hotel Boston";
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [
          pendingResult,
          arrivalsResult,
          occupiedResult,
          spacesResult,
          reviewsResult,
          latestResult,
          upcomingResult,
        ] = await Promise.all([
          supabase.from("booking_request").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
          supabase.from("booking_request").select("id", { count: "exact", head: true }).eq("status", "confirmada").eq("arrival_date", today),
          supabase.from("booking_request").select("id", { count: "exact", head: true }).eq("status", "confirmada").lte("arrival_date", today).gt("departure_date", today),
          supabase.from("cabin").select("id", { count: "exact", head: true }).eq("is_active", true),
          supabase.from("guest_review").select("id", { count: "exact", head: true }).eq("status", "pendiente"),
          supabase.from("booking_request").select("id, name, cabin, arrival_date, departure_date, status, created_date").order("created_date", { ascending: false }).limit(5),
          supabase.from("booking_request").select("id, name, cabin, arrival_date, guests, status").eq("status", "confirmada").gte("arrival_date", today).lte("arrival_date", weekAhead).order("arrival_date").limit(5),
        ]);
        const firstError = [pendingResult, arrivalsResult, occupiedResult, spacesResult, reviewsResult, latestResult, upcomingResult].find((result) => result.error)?.error;
        if (firstError) throw firstError;
        if (!active) return;
        setData({
          pending: pendingResult.count || 0,
          arrivals: arrivalsResult.count || 0,
          occupied: occupiedResult.count || 0,
          spaces: spacesResult.count || 0,
          reviews: reviewsResult.count || 0,
          latest: latestResult.data || [],
          upcoming: upcomingResult.data || [],
        });
      } catch (loadError) {
        if (active) setError(loadError?.message || "No se pudo cargar el resumen.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [today, weekAhead]);

  return (
    <>
      <PageHeader
        eyebrow="Panel"
        title={`Hola${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="Resumen operativo de Hotel Boston."
        actions={<Link className="button button-primary" to="/solicitudes">Ver solicitudes <ArrowRight size={17} /></Link>}
      />

      <Notice kind="error">{error}</Notice>

      {loading ? <Spinner /> : (
        <>
          <section className="stats-grid" aria-label="Indicadores">
            <Stat label="Solicitudes pendientes" value={data.pending} hint="Requieren confirmación" />
            <Stat label="Llegadas hoy" value={data.arrivals} hint={formatDate(today)} />
            <Stat label="Reservas activas hoy" value={data.occupied} hint="Huéspedes alojados" />
            <Stat label="Espacios activos" value={data.spaces} hint="Habitaciones y salones" />
            {isAdmin && <Stat label="Opiniones por moderar" value={data.reviews} hint="Revisiones recientes" />}
          </section>

          <div className="dashboard-columns">
            <section className="panel">
              <div className="panel-heading">
                <div><h2>Solicitudes recientes</h2><p>Últimos ingresos desde el sitio.</p></div>
                <CalendarCheck size={20} />
              </div>
              {data.latest.length === 0 ? (
                <p className="muted">Todavía no hay solicitudes.</p>
              ) : (
                <div className="simple-list">
                  {data.latest.map((booking) => (
                    <Link to={`/solicitudes?buscar=${encodeURIComponent(booking.name)}`} key={booking.id}>
                      <span className="list-main">
                        <strong>{booking.name}</strong>
                        <small>{booking.cabin} · {formatDate(booking.arrival_date)} → {formatDate(booking.departure_date)}</small>
                      </span>
                      <StatusBadge status={booking.status} />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div><h2>Próximas llegadas</h2><p>Confirmadas para los próximos 7 días.</p></div>
                <CalendarClock size={20} />
              </div>
              {data.upcoming.length === 0 ? (
                <p className="muted">No hay llegadas confirmadas esta semana.</p>
              ) : (
                <div className="simple-list">
                  {data.upcoming.map((booking) => (
                    <div key={booking.id} className="list-row">
                      <span className="list-main">
                        <strong>{booking.name}</strong>
                        <small>{booking.cabin} · {booking.guests} {booking.guests === 1 ? "persona" : "personas"}</small>
                      </span>
                      <span className="date-chip">{formatDate(booking.arrival_date)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {isAdmin && (
            <section className="quick-grid">
              <Link to="/habitaciones"><BedDouble size={20} /><span><strong>Habitaciones y salones</strong><small>Precios, fotos y disponibilidad</small></span></Link>
              <Link to="/opiniones"><Star size={20} /><span><strong>Opiniones</strong><small>Moderar reseñas de huéspedes</small></span></Link>
              <Link to="/ajustes"><CalendarCheck size={20} /><span><strong>Sitio y promoción</strong><small>Contacto, WhatsApp y anuncio</small></span></Link>
            </section>
          )}
        </>
      )}
    </>
  );
}
