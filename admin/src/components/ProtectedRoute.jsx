import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Spinner } from "./ui";

export default function ProtectedRoute({ allowedRoles = ["admin", "recepcion"] }) {
  const { loading, user, role, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="screen-center"><Spinner label="Verificando acceso…" /></div>;
  }

  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="screen-center">
        <div className="access-denied">
          <h1>Acceso restringido</h1>
          <p>{error || "Tu cuenta no tiene permisos para entrar a esta sección."}</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
