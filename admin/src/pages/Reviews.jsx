import React, { useEffect, useMemo, useState } from "react";
import { Check, MessageSquare, Star, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PageHeader, Spinner, Notice, EmptyState } from "@/components/ui";
import { formatDate, statusLabels } from "@/lib/format";

const filters = ["todas", "pendiente", "aprobada", "rechazada"];

export default function Reviews() {
  const { isAdmin } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("todas");
  const [replies, setReplies] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("guest_review")
      .select("*")
      .order("created_date", { ascending: false });
    if (loadError) setError(loadError.message || "No se pudieron cargar las opiniones.");
    else {
      setReviews(data || []);
      setReplies(Object.fromEntries((data || []).map((review) => [review.id, review.admin_reply || ""])));
    }
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Opiniones · Hotel Boston";
    void load();
  }, []);

  const filtered = useMemo(() => filter === "todas" ? reviews : reviews.filter((review) => review.status === filter), [reviews, filter]);

  const updateReview = async (review, changes) => {
    setBusy(review.id);
    setError("");
    setMessage("");
    try {
      const payload = { ...changes };
      if (Object.prototype.hasOwnProperty.call(changes, "admin_reply")) {
        payload.admin_reply = changes.admin_reply.trim() || null;
        payload.admin_reply_date = changes.admin_reply.trim() ? new Date().toISOString() : null;
      }
      const { error: updateError } = await supabase.from("guest_review").update(payload).eq("id", review.id);
      if (updateError) throw updateError;
      setMessage("Opinión actualizada.");
      await load();
    } catch (updateError) {
      setError(updateError?.message || "No se pudo actualizar la opinión.");
    } finally {
      setBusy("");
    }
  };

  const remove = async (review) => {
    if (!window.confirm(`¿Eliminar la opinión de ${review.guest_name}?`)) return;
    setBusy(review.id);
    const { error: deleteError } = await supabase.from("guest_review").delete().eq("id", review.id);
    if (deleteError) setError(deleteError.message);
    else {
      setMessage("Opinión eliminada.");
      await load();
    }
    setBusy("");
  };

  return (
    <>
      <PageHeader eyebrow="Comunidad" title="Opiniones" description="Modera las reseñas enviadas por huéspedes y responde públicamente." />
      <Notice>{message}</Notice>
      <Notice kind="error">{error}</Notice>

      <div className="tabs" role="tablist" aria-label="Filtrar opiniones">
        {filters.map((value) => (
          <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
            {value === "todas" ? "Todas" : statusLabels[value]}
            {value !== "todas" && <span>{reviews.filter((review) => review.status === value).length}</span>}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <EmptyState title="No hay opiniones con este filtro" />
      ) : (
        <div className="review-list">
          {filtered.map((review) => (
            <article className="panel review-card" key={review.id}>
              <div className="review-head">
                <div>
                  <strong>{review.guest_name}</strong>
                  <span className="stars" aria-label={`${review.rating} de 5 estrellas`}>
                    {Array.from({ length: 5 }, (_, index) => <Star key={index} size={15} fill={index < review.rating ? "currentColor" : "none"} />)}
                  </span>
                </div>
                <span className={`badge badge-${review.status}`}>{statusLabels[review.status]}</span>
              </div>
              <p>{review.message}</p>
              {review.photo_url && <a href={review.photo_url} target="_blank" rel="noreferrer"><img className="review-photo" src={review.photo_url} alt={`Foto de ${review.guest_name}`} /></a>}
              <small>{formatDate(review.created_date, true)} · {review.language?.toUpperCase()}</small>
              <div className="review-actions">
                {review.status !== "aprobada" && <button type="button" className="button button-primary" disabled={busy === review.id} onClick={() => updateReview(review, { status: "aprobada" })}><Check size={16} /> Aprobar</button>}
                {review.status !== "rechazada" && <button type="button" className="button button-danger" disabled={busy === review.id} onClick={() => updateReview(review, { status: "rechazada" })}><X size={16} /> Rechazar</button>}
                {isAdmin && <button type="button" className="button button-quiet" disabled={busy === review.id} onClick={() => remove(review)}><Trash2 size={16} /> Eliminar</button>}
              </div>
              <div className="reply-box">
                <label>Respuesta pública
                  <textarea rows="2" value={replies[review.id] || ""} onChange={(event) => setReplies((current) => ({ ...current, [review.id]: event.target.value }))} placeholder="Gracias por tu visita…" />
                </label>
                <button type="button" className="button button-quiet" disabled={busy === review.id} onClick={() => updateReview(review, { admin_reply: replies[review.id] || "" })}>
                  <MessageSquare size={16} /> Guardar respuesta
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
