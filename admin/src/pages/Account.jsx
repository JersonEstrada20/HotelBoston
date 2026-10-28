import React, { useEffect, useState } from "react";
import { KeyRound, Loader2, Save, ShieldCheck } from "lucide-react";
import { supabase, functionErrorMessage } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PageHeader, Notice } from "@/components/ui";
import { roleLabels } from "@/lib/format";

export default function Account() {
  const { profile, role, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Mi cuenta · Hotel Boston";
    setName(profile?.full_name || "");
  }, [profile?.full_name]);

  const saveName = async (event) => {
    event.preventDefault();
    setSavingName(true);
    setError("");
    setMessage("");
    const { error: updateError } = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", profile.id);
    if (updateError) setError(updateError.message);
    else {
      setMessage("Nombre actualizado.");
      await refreshProfile();
    }
    setSavingName(false);
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSavingPassword(true);
    try {
      const { data, error: changeError } = await supabase.functions.invoke("completePasswordChange", {
        body: { currentPassword, newPassword },
      });
      if (changeError) throw changeError;
      if (data?.error) throw new Error(data.error);
      setMessage("Contraseña actualizada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      await refreshProfile();
    } catch (changeError) {
      setError(functionErrorMessage(changeError));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Mi cuenta" title="Cuenta y contraseña" description="Datos de tu acceso al panel." />
      <Notice>{message}</Notice>
      <Notice kind="error">{error}</Notice>

      <section className="panel">
        <div className="panel-heading"><div><h2>Datos de la cuenta</h2><p>El correo solo puede cambiarse desde Supabase.</p></div><ShieldCheck size={20} /></div>
        <div className="detail-grid">
          <div><span>Correo</span><strong>{profile?.email}</strong></div>
          <div><span>Rol</span><strong>{roleLabels[role] || role}</strong></div>
        </div>
        <form onSubmit={saveName} className="inline-form">
          <label>Nombre visible<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre y apellido" /></label>
          <button type="submit" className="button button-primary" disabled={savingName}>
            {savingName ? <Loader2 className="spin" size={17} /> : <Save size={17} />} Guardar nombre
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><h2>Cambiar contraseña</h2><p>Usa al menos 8 caracteres y una clave distinta a la actual.</p></div><KeyRound size={20} /></div>
        <form onSubmit={changePassword} className="form-stack">
          <label>Contraseña actual<input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
          <div className="form-grid">
            <label>Nueva contraseña<input type="password" autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
            <label>Confirmar contraseña<input type="password" autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
          </div>
          <button type="submit" className="button button-primary" disabled={savingPassword}>
            {savingPassword ? <Loader2 className="spin" size={17} /> : <KeyRound size={17} />} {savingPassword ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      </section>
    </>
  );
}
