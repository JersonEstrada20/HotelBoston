import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BedDouble,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Star,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { roleLabels } from "@/lib/format";

const links = [
  { to: "/", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/solicitudes", label: "Solicitudes", icon: CalendarCheck },
  { to: "/ocupacion", label: "Ocupación", icon: CalendarRange },
  { to: "/registro", label: "Registrar ingreso", icon: UsersRound },
  { to: "/ingresos", label: "Ingresos", icon: ClipboardList },
  { to: "/habitaciones", label: "Habitaciones y salones", icon: BedDouble, adminOnly: true },
  { to: "/opiniones", label: "Opiniones", icon: Star },
  { to: "/integraciones", label: "Calendarios", icon: CalendarRange, adminOnly: true },
  { to: "/ajustes", label: "Sitio y promoción", icon: Settings, adminOnly: true },
  { to: "/accesos", label: "Accesos", icon: UserCog, adminOnly: true },
  { to: "/historial", label: "Historial", icon: History, adminOnly: true },
];

export default function AdminLayout() {
  const { profile, role, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const visibleLinks = links.filter((link) => isAdmin || !link.adminOnly);

  const logout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="admin-shell">
      <button
        type="button"
        className="mobile-menu-button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && <button type="button" className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}

      <aside className={`sidebar ${open ? "is-open" : ""}`}>
        <div className="sidebar-brand">
          <a href="/" target="_blank" rel="noreferrer" aria-label="Abrir el sitio público">
            <img src="/logo.svg" alt="" />
            <span>
              <strong>Hotel Boston</strong>
              <small>Panel de administración</small>
            </span>
          </a>
        </div>

        <nav aria-label="Secciones del panel">
          {visibleLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/cuenta" onClick={() => setOpen(false)}>
            <span className="avatar">{(profile?.full_name || profile?.email || "H").slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{profile?.full_name || profile?.email}</strong>
              <small>{roleLabels[role] || "Personal"}</small>
            </span>
          </NavLink>
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={17} /> Ver sitio
          </a>
          <button type="button" onClick={logout}>
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {profile?.must_change_password && (
          <div className="password-banner" role="alert">
            Debes cambiar tu contraseña inicial. <NavLink to="/cuenta">Cambiar ahora</NavLink>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
