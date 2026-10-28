export const statusLabels = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  rechazada: "Rechazada",
  aprobada: "Aprobada",
};

export const roleLabels = {
  admin: "Administrador",
  recepcion: "Recepción",
  user: "Sin acceso",
};

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" });
}

export function formatClp(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(number);
}

export function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) return "";
  return digits;
}

export function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

export function todayIso() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

export function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function nightsBetween(arrival, departure) {
  if (!arrival || !departure) return 0;
  const start = new Date(`${arrival}T00:00:00`);
  const end = new Date(`${departure}T00:00:00`);
  return Math.max(0, Math.round((end - start) / 86400000));
}
