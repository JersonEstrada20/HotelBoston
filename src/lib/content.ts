import type { ImageMetadata } from "astro";
import { createClient } from "@supabase/supabase-js";
import {
  amenityKeys,
  images,
  reviews as fallbackReviews,
  roomTypes,
  salons as fallbackSalons,
  site,
} from "../data/site";
import type { AmenityKey, Lang, Localized } from "../data/site";

export type PublicImage = ImageMetadata | string;

export type PublicSite = {
  name: string;
  city: string;
  region: string;
  country: string;
  address: string;
  addressFull: string;
  founded: number;
  email: string;
  whatsapp: string;
  whatsappDisplay: string;
  phones: { label: string; href: string }[];
  mapEmbed: string;
  mapsUrl: string;
  wazeUrl: string;
  coords: { lat: number; lng: number };
  social: { tripadvisor: string; booking: string };
};

export type PublicRoom = {
  slug: string;
  name: Localized;
  short: Localized;
  description: Localized;
  size: string;
  beds: Localized;
  capacity: number;
  prices: { label: Localized; amount: number }[];
  image: PublicImage;
  gallery: PublicImage[];
  amenities: AmenityKey[];
};

export type PublicSalon = {
  slug: string;
  name: string;
  capacity: number;
  description: Localized;
  image: PublicImage;
  gallery: PublicImage[];
};

export type PublicReview = {
  id: string;
  name: string;
  rating: number;
  text: string;
  language: Lang;
  photoUrl: string | null;
  adminReply: string | null;
  adminReplyDate: string | null;
};

export type PublicPromo = {
  enabled: boolean;
  imageUrl: string | null;
  title: string;
  message: string;
  buttonLabel: string;
  buttonUrl: string;
};

export type SiteContent = {
  source: "supabase" | "fallback";
  site: PublicSite;
  rooms: PublicRoom[];
  salons: PublicSalon[];
  guestReviews: PublicReview[];
  promo: PublicPromo;
};

type CabinRow = {
  id?: string;
  slug?: string | null;
  name?: string | null;
  name_en?: string | null;
  type?: string | null;
  short_es?: string | null;
  short_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  size?: string | null;
  beds_es?: string | null;
  beds_en?: string | null;
  capacity?: string | number | null;
  prices?: unknown;
  amenities?: unknown;
  images?: unknown;
  order?: number | null;
};

type SettingsRow = {
  whatsapp_phone?: string | null;
  contact_email?: string | null;
  phones?: unknown;
  founded?: number | null;
  address?: string | null;
  address_full?: string | null;
  map_embed?: string | null;
  maps_url?: string | null;
  waze_url?: string | null;
  social?: unknown;
  promo_enabled?: boolean | null;
  promo_image_url?: string | null;
  promo_title?: string | null;
  promo_message?: string | null;
  promo_button_label?: string | null;
  promo_button_url?: string | null;
};

type ReviewRow = {
  id: string;
  guest_name: string;
  rating: number;
  message: string;
  language: string;
  admin_reply: string | null;
  admin_reply_date?: string | null;
  photo_url?: string | null;
  created_date?: string | null;
};

const fallbackSite: PublicSite = {
  ...site,
  phones: [...site.phones],
  coords: { ...site.coords },
  social: { ...site.social },
};

const fallbackPromo: PublicPromo = {
  enabled: true,
  imageUrl: null,
  title: "",
  message: "",
  buttonLabel: "",
  buttonUrl: "",
};

const fallbackContent: SiteContent = {
  source: "fallback",
  site: fallbackSite,
  rooms: roomTypes,
  salons: fallbackSalons,
  guestReviews: [],
  promo: fallbackPromo,
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function positiveInt(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(text(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function normalizedImage(value: unknown): string | null {
  const path = text(value);
  if (!path) return null;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("/")) return path;
  return `/${path}`;
}

function imageList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(normalizedImage).filter((item): item is string => Boolean(item));
}

function whatsappDisplay(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (/^51\d{9}$/.test(digits)) {
    return `+51 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  if (/^56\d{9}$/.test(digits)) {
    return `+56 ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return digits ? `+${digits}` : value;
}

function phoneList(value: unknown): { label: string; href: string }[] {
  if (!Array.isArray(value)) return fallbackSite.phones;
  const phones = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const label = text(record.label);
      const href = text(record.href);
      return label && href ? { label, href } : null;
    })
    .filter((item): item is { label: string; href: string } => Boolean(item));
  return phones.length ? phones : fallbackSite.phones;
}

function socialLinks(value: unknown): PublicSite["social"] {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    tripadvisor: text(record.tripadvisor) || fallbackSite.social.tripadvisor,
    booking: text(record.booking) || fallbackSite.social.booking,
  };
}

function localized(first: unknown, second: unknown, fallback: Localized): Localized {
  const es = text(first) || fallback.es;
  return { es, en: text(second) || es || fallback.en };
}

function priceList(value: unknown, fallback: { label: Localized; amount: number }[]) {
  if (!Array.isArray(value)) return fallback;
  const prices = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const amount = Number(record.amount);
      if (!Number.isFinite(amount) || amount <= 0) return null;
      const label = record.label;
      if (label && typeof label === "object") {
        const labelRecord = label as Record<string, unknown>;
        return {
          amount,
          label: {
            es: text(labelRecord.es) || "Valor",
            en: text(labelRecord.en) || text(labelRecord.es) || "Rate",
          },
        };
      }
      const single = text(label);
      return single ? { amount, label: { es: single, en: single } } : null;
    })
    .filter((item): item is { label: Localized; amount: number } => Boolean(item));
  return prices.length ? prices : fallback;
}

function amenities(value: unknown, fallback: AmenityKey[]): AmenityKey[] {
  if (!Array.isArray(value)) return fallback;
  const valid = value.filter(
    (item): item is AmenityKey => typeof item === "string" && amenityKeys.includes(item as AmenityKey),
  );
  return valid.length ? valid : fallback;
}

function buildSite(settings: SettingsRow | null): PublicSite {
  if (!settings) return fallbackSite;

  const whatsapp = text(settings.whatsapp_phone) || fallbackSite.whatsapp;
  return {
    ...fallbackSite,
    email: text(settings.contact_email) || fallbackSite.email,
    whatsapp,
    whatsappDisplay:
      whatsapp === fallbackSite.whatsapp ? fallbackSite.whatsappDisplay : whatsappDisplay(whatsapp),
    phones: phoneList(settings.phones),
    founded: Number(settings.founded) || fallbackSite.founded,
    address: text(settings.address) || fallbackSite.address,
    addressFull: text(settings.address_full) || fallbackSite.addressFull,
    mapEmbed: text(settings.map_embed) || fallbackSite.mapEmbed,
    mapsUrl: text(settings.maps_url) || fallbackSite.mapsUrl,
    wazeUrl: text(settings.waze_url) || fallbackSite.wazeUrl,
    social: socialLinks(settings.social),
  };
}

function buildPromo(settings: SettingsRow | null): PublicPromo {
  if (!settings) return fallbackPromo;
  return {
    enabled: settings.promo_enabled === true,
    imageUrl: normalizedImage(settings.promo_image_url),
    title: text(settings.promo_title),
    message: text(settings.promo_message),
    buttonLabel: text(settings.promo_button_label),
    buttonUrl: text(settings.promo_button_url),
  };
}

function isSalonType(type: string): boolean {
  return type.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase() === "salon";
}

function buildRooms(rows: CabinRow[]): PublicRoom[] {
  const roomRows = rows.filter((row) => !isSalonType(text(row.type)));
  if (!roomRows.length) return roomTypes;

  return roomRows.map((row, index) => {
    const fallback = roomTypes[index % roomTypes.length];
    const remoteImages = imageList(row.images);
    const name = text(row.name) || text(row.name_en) || fallback.name.es;
    const description = localized(row.description, row.description_en, fallback.description);

    return {
      slug: text(row.slug) || text(row.id) || fallback.slug,
      name: { es: name, en: text(row.name_en) || name },
      short: localized(row.short_es, row.short_en, fallback.short),
      description,
      size: text(row.size) || fallback.size,
      beds: localized(row.beds_es, row.beds_en, fallback.beds),
      capacity: positiveInt(row.capacity, fallback.capacity),
      prices: priceList(row.prices, fallback.prices),
      image: remoteImages[0] || fallback.image,
      gallery: remoteImages.length ? remoteImages : fallback.gallery,
      amenities: amenities(row.amenities, fallback.amenities),
    };
  });
}

function buildSalons(rows: CabinRow[]): PublicSalon[] {
  const salonRows = rows.filter((row) => isSalonType(text(row.type)));
  if (!salonRows.length) return fallbackSalons;

  return salonRows.map((row, index) => {
    const fallback = fallbackSalons[index % fallbackSalons.length];
    const remoteImages = imageList(row.images);
    return {
      slug: text(row.slug) || text(row.id) || fallback.slug,
      name: text(row.name) || text(row.name_en) || fallback.name,
      capacity: positiveInt(row.capacity, fallback.capacity),
      description: localized(row.description, row.description_en, fallback.description),
      image: remoteImages[0] || fallback.image,
      gallery: remoteImages.length ? remoteImages : fallback.gallery,
    };
  });
}

function buildReviews(rows: ReviewRow[]): PublicReview[] {
  return rows.map((row) => {
    const language: Lang = row.language === "en" ? "en" : "es";
    return {
      id: row.id,
      name: row.guest_name,
      rating: Math.min(5, Math.max(1, Number(row.rating) || 5)),
      text: row.message,
      language,
      photoUrl: normalizedImage(row.photo_url),
      adminReply: text(row.admin_reply) || null,
      adminReplyDate: text(row.admin_reply_date) || null,
    };
  });
}

async function loadContent(): Promise<SiteContent> {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallbackContent;

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [settingsResult, cabinsResult, reviewsResult] = await Promise.allSettled([
      supabase.from("site_settings").select("*").eq("id", "main").maybeSingle(),
      supabase.from("cabin").select("*").eq("is_active", true).order("order", { ascending: true }),
      supabase
        .from("guest_review")
        .select("id, guest_name, rating, message, language, admin_reply, admin_reply_date, photo_url, created_date")
        .eq("status", "aprobada")
        .order("created_date", { ascending: false })
        .limit(6),
    ]);

    const settings =
      settingsResult.status === "fulfilled" && !settingsResult.value.error
        ? (settingsResult.value.data as SettingsRow | null)
        : null;
    const cabins =
      cabinsResult.status === "fulfilled" && !cabinsResult.value.error
        ? ((cabinsResult.value.data ?? []) as CabinRow[])
        : [];
    const reviews =
      reviewsResult.status === "fulfilled" && !reviewsResult.value.error
        ? ((reviewsResult.value.data ?? []) as ReviewRow[])
        : [];

    if (!settings && !cabins.length) return fallbackContent;

    return {
      source: "supabase",
      site: buildSite(settings),
      rooms: buildRooms(cabins),
      salons: buildSalons(cabins),
      guestReviews: buildReviews(reviews),
      promo: buildPromo(settings),
    };
  } catch {
    return fallbackContent;
  }
}

let contentPromise: Promise<SiteContent> | null = null;

export function getSiteContent(): Promise<SiteContent> {
  if (!contentPromise) contentPromise = loadContent();
  return contentPromise;
}

export { fallbackReviews, images };
