export const STAFF_ROLES = Object.freeze(["admin", "recepcion"]);

export const isStaffRole = (role) => STAFF_ROLES.includes(role);

export const normalizeStaffEmail = (email) => (
  typeof email === "string" ? email.trim().toLowerCase() : ""
);

export function validateStaffCreation({ email, role, password }) {
  const normalizedEmail = normalizeStaffEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, error: "Correo no válido" };
  }
  if (!isStaffRole(role)) return { ok: false, error: "Rol no válido" };
  if (typeof password !== "string" || password.length < 8) {
    return { ok: false, error: "La contraseña inicial debe tener al menos 8 caracteres." };
  }
  return { ok: true, email: normalizedEmail, role, password };
}

export function validateRoleChange({ callerId, targetId, currentRole, nextRole, adminCount }) {
  if (callerId === targetId && nextRole !== currentRole) {
    return "No puedes quitarte tu propio acceso de administrador.";
  }
  if (currentRole === "admin" && nextRole !== "admin" && adminCount <= 1) {
    return "Debe quedar al menos un administrador activo.";
  }
  return null;
}
