import React, { useEffect, useState } from "react";
import { Loader2, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { supabase, functionErrorMessage } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PageHeader, Spinner, Notice } from "@/components/ui";
import { formatDate, roleLabels } from "@/lib/format";

export default function Staff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", role: "recepcion", accountType: "existing", password: "", confirmation: "" });
  const [roleEdits, setRoleEdits] = useState({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_date")
      .in("role", ["admin", "recepcion"])
      .order("created_date", { ascending: true });
    if (loadError) setError(loadError.message || "No se pudo cargar el personal.");
    else setStaff(data || []);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Accesos · Hotel Boston";
    void load();
  }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.accountType === "create" && form.password.length < 8) {
      setError("La contraseña inicial debe tener al menos 8 caracteres.");
      return;
    }
    if (form.accountType === "create" && form.password !== form.confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy("new");
    try {
      const { data, error: inviteError } = await supabase.functions.invoke("inviteUser", {
        body: {
          action: form.accountType === "create" ? "create" : "update_access",
          email: form.email.trim().toLowerCase(),
          role: form.role,
          ...(form.accountType === "create" ? { password: form.password } : {}),
        },
        timeout: 20000,
      });
      if (inviteError) throw inviteError;
      if (data?.error) throw new Error(data.error);
      setMessage(data?.action === "account_created"
        ? "Cuenta creada. Comparte la contraseña inicial por un canal seguro."
        : "Acceso habilitado para la cuenta.");
      setForm({ email: "", role: "recepcion", accountType: "existing", password: "", confirmation: "" });
      await load();
    } catch (inviteError) {
      setError(functionErrorMessage(inviteError));
    } finally {
      setBusy("");
    }
  };

  const staffAction = async (person, action, nextRole) => {
    if (action === "revoke_access" && !window.confirm(`¿Quitar el acceso al panel de ${person.email}?`)) return;
    setBusy(person.id);
    setError("");
    setMessage("");
    try {
      const { data, error: actionError } = await supabase.functions.invoke("inviteUser", {
        body: {
          action,
          targetUserId: person.id,
          ...(action === "set_role" ? { role: nextRole } : {}),
        },
        timeout: 20000,
      });
      if (actionError) throw actionError;
      if (data?.error) throw new Error(data.error);
      setMessage(action === "revoke_access" ? "Acceso retirado." : "Permiso actualizado.");
      setRoleEdits((current) => ({ ...current, [person.id]: undefined }));
      await load();
    } catch (actionError) {
      setError(functionErrorMessage(actionError));
    } finally {
      setBusy("");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Seguridad"
        title="Accesos al panel"
        description="Administrador ve y edita todo. Recepción gestiona solicitudes, ingresos y ocupación."
      />
      <Notice>{message}</Notice>
      <Notice kind="error">{error}</Notice>

      <form onSubmit={submit} className="panel form-stack">
        <div className="panel-heading"><div><h2>Habilitar personal</h2><p>Puedes habilitar una cuenta existente o crear una nueva.</p></div><UserPlus size={20} /></div>
        <div className="form-grid">
          <label>Correo<input type="email" required value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="correo@ejemplo.com" /></label>
          <label>Tipo de cuenta<select value={form.accountType} onChange={(event) => update("accountType", event.target.value)}><option value="existing">El correo ya tiene cuenta</option><option value="create">Crear cuenta nueva</option></select></label>
          <label>Permiso<select value={form.role} onChange={(event) => update("role", event.target.value)}><option value="recepcion">Recepción</option><option value="admin">Administrador</option></select></label>
        </div>
        {form.accountType === "create" && (
          <div className="form-grid">
            <label>Contraseña inicial<input type="password" autoComplete="new-password" value={form.password} onChange={(event) => update("password", event.target.value)} /></label>
            <label>Confirmar contraseña<input type="password" autoComplete="new-password" value={form.confirmation} onChange={(event) => update("confirmation", event.target.value)} /></label>
          </div>
        )}
        <button type="submit" className="button button-primary" disabled={busy === "new"}>
          {busy === "new" ? <Loader2 className="spin" size={17} /> : <Mail size={17} />}
          {busy === "new" ? "Procesando…" : "Habilitar acceso"}
        </button>
      </form>

      <section className="panel">
        <div className="panel-heading"><div><h2>Personal con acceso</h2><p>Cambia permisos o retira el acceso sin borrar la cuenta.</p></div><ShieldCheck size={20} /></div>
        {loading ? <Spinner /> : staff.length === 0 ? <p className="muted">No hay cuentas de personal.</p> : (
          <div className="staff-list">
            {staff.map((person) => {
              const selectedRole = roleEdits[person.id] ?? person.role;
              return (
                <div className="staff-row" key={person.id}>
                  <div className="staff-person">
                    <span className="avatar">{(person.full_name || person.email || "H").slice(0, 1).toUpperCase()}</span>
                    <div><strong>{person.full_name || person.email}{person.id === user?.id ? " (tú)" : ""}</strong><small>{person.email} · desde {formatDate(person.created_date)}</small></div>
                  </div>
                  <div className="staff-actions">
                    <select aria-label={`Permiso de ${person.email}`} value={selectedRole} onChange={(event) => setRoleEdits((current) => ({ ...current, [person.id]: event.target.value }))} disabled={busy === person.id}>
                      <option value="recepcion">Recepción</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button type="button" className="button button-quiet" disabled={busy === person.id || selectedRole === person.role} onClick={() => staffAction(person, "set_role", selectedRole)}>Guardar permiso</button>
                    <button type="button" className="button button-danger" disabled={busy === person.id} onClick={() => staffAction(person, "revoke_access")}>Quitar acceso</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <p className="muted small">Rol actual: {roleLabels.admin}. La cuenta con rol de administrador puede gestionar accesos y configuración.</p>
      </section>
    </>
  );
}
