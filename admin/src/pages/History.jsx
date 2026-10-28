import React, { useEffect, useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader, Spinner, Notice } from "@/components/ui";
import { formatDate } from "@/lib/format";

const entityLabels = {
  booking_request: "Solicitud de reserva",
  cabin: "Habitación o salón",
  site_settings: "Ajustes del sitio",
  visitor_entry: "Registro de ingreso",
};

const actionLabels = { created: "Creado", updated: "Actualizado", deleted: "Eliminado" };

const fieldLabels = {
  status: "Estado",
  cabin: "Espacio",
  arrival_date: "Llegada",
  departure_date: "Salida",
  guests: "Personas",
  name: "Nombre",
  capacity: "Capacidad",
  high_season_price: "Precio temporada alta",
  low_season_price: "Precio temporada baja",
  is_active: "Visible",
  sector: "Sector",
  promo_enabled: "Promoción activa",
  promo_title: "Título de promoción",
  promo_message: "Mensaje de promoción",
  promo_button_label: "Texto del botón",
  promo_button_url: "Enlace del botón",
  whatsapp_phone: "WhatsApp del sitio",
};

function displayValue(value) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function History() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Historial · Hotel Boston";
    let active = true;
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from("admin_activity_log")
        .select("id, entity_type, entity_id, action, changes, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!active) return;
      if (loadError) setError(loadError.message || "No se pudo cargar el historial.");
      else setEvents(data || []);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <>
      <PageHeader eyebrow="Auditoría" title="Historial de cambios" description="Últimos 200 cambios en reservas, espacios y ajustes." />
      <Notice kind="error">{error}</Notice>
      {loading ? <Spinner /> : events.length === 0 ? (
        <div className="empty-state"><strong>Todavía no hay cambios registrados.</strong></div>
      ) : (
        <ol className="history-list">
          {events.map((event) => (
            <li key={event.id} className="panel">
              <div className="history-head">
                <HistoryIcon size={17} />
                <strong>{entityLabels[event.entity_type] || event.entity_type}</strong>
                <span>{actionLabels[event.action] || event.action}</span>
                <time dateTime={event.created_at}>{formatDate(event.created_at, true)}</time>
              </div>
              <dl className="history-changes">
                {Object.entries(event.changes || {}).map(([field, change]) => (
                  <div key={field}>
                    <dt>{fieldLabels[field] || field}</dt>
                    <dd>{displayValue(change?.from)} <span>→</span> {displayValue(change?.to)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
