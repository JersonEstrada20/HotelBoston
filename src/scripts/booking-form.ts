import { createClient } from "@supabase/supabase-js";

type CabinOption = {
  id: string;
  slug: string | null;
  name: string;
  type: string;
  capacity: string | null;
  prices: { amount?: number }[] | null;
};

const TRACKING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createTrackingCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (byte) => TRACKING_CODE_ALPHABET[byte & 31]).join("");
}

function createOption(value: string, label: string, cabinName: string, type: "habitacion" | "salon", cabinId?: string) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  option.dataset.cabinName = cabinName;
  option.dataset.spaceType = type;
  if (cabinId) option.dataset.cabinId = cabinId;
  return option;
}

export function initBookingForm() {
  const form = document.querySelector<HTMLFormElement>("[data-booking-form]");
  if (!form) return;

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";
  const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
  const locale = document.documentElement.dataset.lang === "en" ? "en-US" : "es-CL";

  const arrival = form.querySelector<HTMLInputElement>('[name="arrival"]');
  const departure = form.querySelector<HTMLInputElement>('[name="departure"]');
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const whatsappButton = form.querySelector<HTMLButtonElement>("[data-whatsapp-submit]");
  const submitButton = form.querySelector<HTMLButtonElement>("[data-submit-button]");
  const submitLabel = form.querySelector<HTMLElement>("[data-submit-label]");
  const roomSelect = form.querySelector<HTMLSelectElement>('[name="room"]');
  const guestsInput = form.querySelector<HTMLInputElement>('[name="guests"]');
  const availabilityButton = form.querySelector<HTMLButtonElement>("[data-availability-button]");
  const availabilityLabel = form.querySelector<HTMLElement>("[data-availability-label]");
  const availabilityStatus = form.querySelector<HTMLElement>("[data-availability-status]");

  const today = new Date();
  const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (arrival) arrival.min = isoToday;
  if (departure) departure.min = isoToday;

  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get("habitacion");
  const salonParam = params.get("salon");

  const applyPreset = () => {
    if (!roomSelect) return;
    if (roomParam) roomSelect.value = `room:${roomParam}`;
    if (salonParam) roomSelect.value = `salon:${salonParam}`;
  };
  applyPreset();

  const formatDate = (value: string) => {
    if (!value) return "—";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(locale);
  };

  const formatPrice = (amount?: number) => {
    if (!amount) return "";
    return new Intl.NumberFormat(locale, { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(amount);
  };

  const getValue = (name: string) => {
    const field = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!field) return "—";
    if (field instanceof HTMLSelectElement) {
      const option = field.selectedOptions[0];
      return option?.dataset.cabinName?.trim() || option?.textContent?.trim() || field.value || "—";
    }
    if (field instanceof HTMLInputElement && field.type === "date") return formatDate(field.value);
    return field.value.trim() || "—";
  };

  const labelFor = (name: string) => {
    const label = form.querySelector<HTMLLabelElement>(`label[for="${name}"]`);
    return label?.querySelector("span")?.textContent?.trim() || name;
  };

  const setStatus = (message: string, kind: "success" | "error") => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status is-${kind}`;
  };

  const validate = () => {
    if (departure) departure.setCustomValidity("");
    if (arrival && departure && arrival.value && departure.value && departure.value <= arrival.value) {
      departure.setCustomValidity(form.dataset.msgDates || "");
      departure.reportValidity();
      return false;
    }
    return form.reportValidity();
  };

  const buildMessage = () => {
    const lines = form.dataset.intro ? [form.dataset.intro, ""] : [];
    ["name", "email", "phone", "room", "arrival", "departure", "guests", "message"].forEach((name) => {
      lines.push(`${labelFor(name)}: ${getValue(name)}`);
    });
    return lines.join("\n");
  };

  const loadCabins = async () => {
    if (!supabase || !roomSelect) return;
    const { data, error } = await supabase
      .from("cabin")
      .select("id, slug, name, type, capacity, prices")
      .eq("is_active", true)
      .order("order");
    if (error || !data?.length) return;

    const cabins = data as CabinOption[];
    const rooms = cabins.filter((cabin) => !["salon", "salón"].includes(cabin.type));
    const salons = cabins.filter((cabin) => ["salon", "salón"].includes(cabin.type));
    const placeholder = roomSelect.options[0]?.textContent || "Selecciona una opción";
    const fragment = document.createDocumentFragment();
    fragment.append(createOption("", placeholder, "", "habitacion"));

    if (rooms.length) {
      const group = document.createElement("optgroup");
      group.label = form.dataset.roomsGroup || "Habitaciones";
      rooms.forEach((cabin) => {
        const price = formatPrice(cabin.prices?.[0]?.amount);
        const label = [cabin.name, price].filter(Boolean).join(" — ");
        group.append(createOption(`room:${cabin.slug || cabin.id}`, label, cabin.name, "habitacion", cabin.id));
      });
      fragment.append(group);
    }

    if (salons.length) {
      const group = document.createElement("optgroup");
      group.label = form.dataset.salonsGroup || "Salones";
      salons.forEach((cabin) => {
        const label = [`Salón ${cabin.name}`, cabin.capacity].filter(Boolean).join(" — ");
        group.append(createOption(`salon:${cabin.slug || cabin.id}`, label, cabin.name, "salon", cabin.id));
      });
      fragment.append(group);
    }

    roomSelect.replaceChildren(fragment);
    applyPreset();
  };

  const hideAvailability = () => {
    if (!availabilityStatus) return;
    availabilityStatus.hidden = true;
    availabilityStatus.textContent = "";
    availabilityStatus.className = "availability-status";
  };

  const showAvailability = (message: string, kind: "success" | "error" | "neutral") => {
    if (!availabilityStatus) return;
    availabilityStatus.textContent = message;
    availabilityStatus.className = `availability-status is-${kind}`;
    availabilityStatus.hidden = false;
  };

  const checkAvailability = async () => {
    if (!supabase || !roomSelect || !arrival || !departure) return;

    const selected = roomSelect.selectedOptions[0];
    if (!selected?.value) {
      roomSelect.reportValidity();
      return;
    }
    if (departure.value && arrival.value && departure.value <= arrival.value) {
      departure.setCustomValidity(form.dataset.msgDates || "");
      departure.reportValidity();
      return;
    }
    if (!arrival.value || !departure.value) {
      (arrival.value ? departure : arrival).reportValidity();
      return;
    }

    const guests = Number(getValue("guests")) || 1;
    if (availabilityButton) availabilityButton.disabled = true;
    if (availabilityLabel) {
      if (!availabilityLabel.dataset.defaultLabel) {
        availabilityLabel.dataset.defaultLabel = availabilityLabel.textContent || "";
      }
      availabilityLabel.textContent = form.dataset.availabilityChecking || "Consultando...";
    }
    hideAvailability();

    try {
      const { data, error } = await supabase.functions.invoke("checkWhatsAppAvailability", {
        body: {
          cabin: selected.dataset.cabinName || getValue("room"),
          arrival_date: arrival.value,
          departure_date: departure.value,
          guests,
        },
      });
      if (error) throw error;
      if (!data || data.error) throw new Error(data?.error || "availability");

      if (data.available) {
        showAvailability(form.dataset.availabilityAvailable || "Disponible.", "success");
      } else if (data.reason === "capacity") {
        const message = (form.dataset.availabilityCapacity || "Capacidad: {capacity} personas.").replace(
          "{capacity}",
          String(data.capacity ?? ""),
        );
        showAvailability(message, "neutral");
      } else if (data.reason === "occupied") {
        showAvailability(form.dataset.availabilityOccupied || "Ocupada.", "neutral");
      } else {
        showAvailability(form.dataset.availabilityUnavailable || "No disponible.", "neutral");
      }
    } catch (error) {
      console.error("No se pudo consultar la disponibilidad", error);
      showAvailability(form.dataset.availabilityError || "No se pudo consultar.", "error");
    } finally {
      if (availabilityButton) availabilityButton.disabled = false;
      if (availabilityLabel) {
        availabilityLabel.textContent = availabilityLabel.dataset.defaultLabel || "";
      }
    }
  };

  availabilityButton?.addEventListener("click", () => void checkAvailability());
  [roomSelect, arrival, departure, guestsInput].forEach((field) => {
    field?.addEventListener("change", hideAvailability);
    field?.addEventListener("input", hideAvailability);
  });

  const setSending = (sending: boolean) => {
    if (submitButton) submitButton.disabled = sending;
    if (submitLabel) {
      if (!submitLabel.dataset.defaultLabel) submitLabel.dataset.defaultLabel = submitLabel.textContent || "";
      submitLabel.textContent = sending ? form.dataset.msgSending || "Enviando…" : submitLabel.dataset.defaultLabel;
    }
  };

  void loadCabins();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validate() || !roomSelect) return;

    const selected = roomSelect.selectedOptions[0];
    if (!selected?.value) {
      roomSelect.reportValidity();
      return;
    }

    if (!supabase) {
      const subject = `${form.dataset.intro || "Hotel Boston"} — ${getValue("name")}`;
      const mailto = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildMessage())}`;
      window.location.href = mailto;
      setStatus(form.dataset.msgEmail || "", "success");
      return;
    }

    const phone = String(getValue("phone")).replace(/\D/g, "");
    if (phone.length < 6) {
      setStatus(form.dataset.msgPhone || "Indica un teléfono válido.", "error");
      return;
    }

    const [spaceType, slug] = selected.value.split(":");
    const cabinName = selected.dataset.cabinName || getValue("room");
    setSending(true);
    if (status) {
      status.textContent = "";
      status.className = "form-status";
    }

    try {
      let cabinId = selected.dataset.cabinId || null;
      if (!cabinId && slug) {
        const { data } = await supabase.from("cabin").select("id").eq("slug", slug).maybeSingle();
        cabinId = data?.id || null;
      }

      const trackingCode = createTrackingCode();
      const bookingId = crypto.randomUUID();
      const booking = {
        id: bookingId,
        name: getValue("name").trim(),
        email: getValue("email").trim().toLowerCase(),
        phone: getValue("phone").trim(),
        cabin: cabinName,
        cabin_id: cabinId,
        space_type: spaceType === "salon" ? "salon" : "habitacion",
        arrival_date: arrival?.value || "",
        departure_date: departure?.value || "",
        guests: Number(getValue("guests")) || 1,
        message: getValue("message") === "—" ? "" : getValue("message"),
        tracking_code: trackingCode,
        status: "pendiente",
      };

      const { error } = await supabase.from("booking_request").insert(booking);
      if (error) throw error;

      void supabase.functions.invoke("notifyNewBooking", { body: { booking_id: bookingId } })
        .then(({ error: notifyError }) => {
          if (notifyError) console.error("No se pudo notificar la nueva solicitud:", notifyError);
        })
        .catch((notifyError) => console.error("No se pudo notificar la nueva solicitud:", notifyError));

      const reference = form.dataset.msgReference || "N.º de seguimiento";
      setStatus(`${form.dataset.msgSuccess || "Solicitud enviada."} ${reference}: ${trackingCode}`, "success");
      form.reset();
      if (arrival) arrival.min = isoToday;
      if (departure) departure.min = isoToday;
    } catch (error) {
      console.error("No se pudo enviar la solicitud", error);
      setStatus(form.dataset.msgError || "No se pudo enviar la solicitud.", "error");
    } finally {
      setSending(false);
    }
  });

  whatsappButton?.addEventListener("click", () => {
    if (!validate()) return;
    const url = `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setStatus(form.dataset.msgWhatsapp || "", "success");
  });
}
