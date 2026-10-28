import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Notice } from "@/components/ui";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Recuperar contraseña · Hotel Boston";
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage("Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.");
    } catch (resetError) {
      setError(resetError?.message || "No se pudo enviar el correo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <img src="/logo.svg" alt="Hotel Boston" />
          <span>Panel de administración</span>
        </div>
        <div className="auth-heading">
          <Mail size={24} />
          <h1>Recuperar acceso</h1>
          <p>Te enviaremos un enlace seguro para cambiar tu contraseña.</p>
        </div>
        <form onSubmit={submit} className="form-stack">
          <label>
            Correo de la cuenta
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@hotelboston.cl"
            />
          </label>
          <Notice>{message}</Notice>
          <Notice kind="error">{error}</Notice>
          <button type="submit" className="button button-primary button-full" disabled={submitting}>
            {submitting ? <Loader2 className="spin" size={18} /> : <Mail size={18} />}
            {submitting ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login"><ArrowLeft size={15} /> Volver al ingreso</Link>
        </div>
      </section>
    </main>
  );
}
