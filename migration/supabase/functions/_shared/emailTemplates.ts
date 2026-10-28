const LOGO_URL = "https://hotelboston.pages.dev/logo-email.png";
const SITE_URL = "https://hotelboston.pages.dev";
const siteUrl = (path = "") => `${SITE_URL}${path}`;

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]!);
}

function shell(title: string, content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f7f3ea;font-family:Inter,Helvetica,Arial,sans-serif;color:#1f302c;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ea;">
<tr><td align="center" style="padding:24px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#1f302c;padding:22px 36px;border-radius:4px 4px 0 0;">
<img src="${LOGO_URL}" alt="Hotel Boston" width="140" height="70" style="display:block;border:0;width:140px;height:auto;max-width:140px;" />
</td></tr>
<tr><td style="background:#fffdf9;padding:36px;">${content}</td></tr>
<tr><td style="background:#f7f3ea;padding:18px 36px;border-top:1px solid #e2d7c5;border-radius:0 0 4px 4px;">
<p style="margin:0;text-align:center;font-size:12px;color:#40524c;">Hotel Boston · 21 de Mayo 468, Quillota · Región de Valparaíso</p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

function detailRow(label: string, value: string): string {
  return `<tr><td style="padding:5px 0;font-size:15px;line-height:1.6;"><strong style="color:#40524c;font-weight:600;">${escapeHtml(label)}:</strong> ${escapeHtml(value)}</td></tr>`;
}

function detailsCard(label: string, rows: string[]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f3ea;border-radius:4px;margin-top:16px;">
<tr><td style="padding:24px 28px;">
<p style="margin:0;font-size:11px;color:#40524c;letter-spacing:0.08em;">${label}</p>
<hr style="border:none;border-top:1px solid #e2d7c5;margin:10px 0 14px 0;" />
<table width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>
</td></tr>
</table>`;
}

function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:24px;padding:14px 32px;background:#a75a42;color:#ffffff;text-decoration:none;font-size:14px;border-radius:4px;">${label}</a>`;
}

export function nuevaReservaAdminHtml(b: any): string {
  const rows = [
    detailRow("Nombre", b.name),
    detailRow("Email", b.email),
    detailRow("Teléfono", b.phone),
    detailRow("Habitación / Salón", b.cabin),
    detailRow("Llegada", b.arrival_date),
    detailRow("Salida", b.departure_date),
    detailRow("Personas", String(b.guests)),
    detailRow("Mensaje", b.message || "Sin mensaje adicional"),
  ];
  const content = `
<h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:700;color:#1f302c;margin:0 0 6px 0;line-height:1.2;">Nueva solicitud de reserva</h1>
<p style="margin:0 0 4px 0;font-size:14px;color:#40524c;">Has recibido una nueva solicitud desde el sitio web.</p>
${detailsCard("DETALLES DE LA SOLICITUD", rows)}
${btn(siteUrl("/admin/solicitudes"), "Revisar en el panel")}`;
  return shell("Nueva solicitud de reserva — " + b.cabin, content);
}

export function nuevaReservaAdminText(b: any): string {
  return `Nueva solicitud de reserva recibida desde el sitio web.

Nombre: ${b.name}
Email: ${b.email}
Teléfono: ${b.phone}
Habitación / Salón: ${b.cabin}
Llegada: ${b.arrival_date}
Salida: ${b.departure_date}
Personas: ${b.guests}
Mensaje: ${b.message || "Sin mensaje adicional"}

Revisa la solicitud en el panel: ${siteUrl("/admin/solicitudes")}`;
}

export function reservaConfirmadaHtml(b: any): string {
  const rows = [
    detailRow("Habitación / Salón", b.cabin),
    detailRow("Fecha de llegada", b.arrival_date),
    detailRow("Fecha de salida", b.departure_date),
    detailRow("Personas", String(b.guests)),
  ];
  const content = `
<h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:700;color:#1f302c;margin:0 0 6px 0;line-height:1.2;">Su reserva ha sido confirmada</h1>
<p style="margin:0 0 14px 0;font-size:14px;color:#40524c;">Estimado/a ${escapeHtml(b.name)}, nos alegra confirmar su reserva.</p>
<p style="margin:0 0 0 0;font-size:15px;line-height:1.6;color:#1f302c;">Nos complace confirmar su reserva en Hotel Boston. Nos pondremos en contacto con usted para coordinar los detalles del pago y la llegada.</p>
${detailsCard("DETALLES DE LA RESERVA", rows)}
<p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:#1f302c;">Gracias por elegirnos. ¡Le esperamos en Hotel Boston!</p>
${btn(siteUrl(), "Visitar el sitio")}`;
  return shell("Su reserva en Hotel Boston ha sido confirmada", content);
}

export function reservaConfirmadaText(b: any): string {
  return `Estimado/a ${b.name},

Nos alegra confirmar su reserva en Hotel Boston.

Detalles de la reserva:
- Habitación / Salón: ${b.cabin}
- Fecha de llegada: ${b.arrival_date}
- Fecha de salida: ${b.departure_date}
- Personas: ${b.guests}

Nos pondremos en contacto con usted para coordinar los detalles del pago y la llegada.

Gracias por elegirnos. ¡Le esperamos en Hotel Boston!

${siteUrl()}`;
}

export function reservaRechazadaHtml(b: any): string {
  const content = `
<h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:30px;font-weight:700;color:#1f302c;margin:0 0 6px 0;line-height:1.2;">Actualización de su solicitud</h1>
<p style="margin:0 0 14px 0;font-size:14px;color:#40524c;">Estimado/a ${escapeHtml(b.name)},</p>
<p style="margin:0 0 0 0;font-size:15px;line-height:1.6;color:#1f302c;">Lamentamos informarle que no fue posible confirmar su solicitud de reserva para ${escapeHtml(b.cabin)} entre el ${escapeHtml(b.arrival_date)} y el ${escapeHtml(b.departure_date)}.</p>
<p style="margin:16px 0 0 0;font-size:15px;line-height:1.6;color:#1f302c;">Lo invitamos a contactarnos para explorar fechas alternativas. Estaremos encantados de ayudarle a encontrar la mejor opción para su visita.</p>
${btn(siteUrl("/reservas"), "Solicitar otra fecha")}`;
  return shell("Actualización de su solicitud de reserva — Hotel Boston", content);
}

export function reservaRechazadaText(b: any): string {
  return `Estimado/a ${b.name},

Lamentamos informarle que no fue posible confirmar su solicitud de reserva para ${b.cabin} entre el ${b.arrival_date} y el ${b.departure_date}.

Lo invitamos a contactarnos para explorar fechas alternativas. Estaremos encantados de ayudarle a encontrar la mejor opción para su visita.

${siteUrl("/reservas")}`;
}
