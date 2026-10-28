import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Notice } from "@/components/ui";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Nueva contraseña · Hotel Boston";
    supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", (await supabase.auth.getUser()).data.user?.id);
      setMessage("Contraseña actualizada. Ya puedes usar el panel.");
      setTimeout(() => navigate("/", { replace: true }), 900);
    } catch (updateError) {
      setError(updateError?.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) {
    return (
      <main className="auth-shell">
        <section className="auth-card auth-card-narrow">
          <h1>Enlace no válido</h1>
          <p>Abre el enlace de recuperación desde tu correo o solicita uno nuevo.</p>
          <Link className="button button-primary button-full" to="/forgot-password">Solicitar otro enlace</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand">
          <img src="/logo.svg" alt="Hotel Boston" />
          <span>Panel de administración</span>
        </div>
        <div className="auth-heading">
          <KeyRound size={24} />
          <h1>Nueva contraseña</h1>
          <p>Usa al menos 8 caracteres y no compartas esta clave.</p>
        </div>
        <form onSubmit={submit} className="form-stack">
          <label>
            Nueva contraseña
            <input type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label>
            Confirmar contraseña
            <input type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          <Notice>{message}</Notice>
          <Notice kind="error">{error}</Notice>
          <button type="submit" className="button button-primary button-full" disabled={submitting}>
            {submitting ? <Loader2 className="spin" size={18} /> : <KeyRound size={18} />}
            {submitting ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      </section>
    </main>
  );
}
