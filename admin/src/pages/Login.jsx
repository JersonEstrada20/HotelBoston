import React, { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Notice } from "@/components/ui";

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const returnTo = new URLSearchParams(location.search).get("returnTo") || "/";

  useEffect(() => {
    document.title = "Ingresar · Hotel Boston";
  }, []);

  if (!loading && user) return <Navigate to={returnTo} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(returnTo, { replace: true });
    } catch (loginError) {
      setError(loginError?.message === "Invalid login credentials"
        ? "Correo o contraseña incorrectos."
        : loginError?.message || "No se pudo iniciar sesión.");
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
          <LockKeyhole size={24} />
          <h1>Ingresar</h1>
          <p>Acceso exclusivo para el personal de Hotel Boston.</p>
        </div>

        <form onSubmit={submit} className="form-stack">
          <label>
            Correo
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@hotelboston.cl"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contraseña"
            />
          </label>
          <Notice kind="error">{error}</Notice>
          <button type="submit" className="button button-primary button-full" disabled={submitting}>
            {submitting ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
            {submitting ? "Ingresando…" : "Ingresar al panel"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Olvidé mi contraseña</Link>
          <a href="/">Volver al sitio</a>
        </div>
      </section>
    </main>
  );
}
