import React, { useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

export function Spinner({ label = "Cargando…" }) {
  return (
    <div className="loading-state" role="status">
      <Loader2 className="spin" size={20} />
      <span>{label}</span>
    </div>
  );
}

export function Notice({ kind = "success", children, onClose }) {
  if (!children) return null;
  const Icon = kind === "error" ? AlertCircle : CheckCircle2;
  return (
    <div className={`notice notice-${kind}`} role={kind === "error" ? "alert" : "status"}>
      <Icon size={18} />
      <span>{children}</span>
      {onClose && (
        <button type="button" className="notice-close" onClick={onClose} aria-label="Cerrar aviso">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Modal({ title, children, onClose, wide = false }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status}</span>;
}
