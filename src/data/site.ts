import type { ImageMetadata } from "astro";

import heroSuite from "../assets/hero-suite.jpg";
import heroLobby from "../assets/hero-lobby.jpg";
import heroEntrance from "../assets/hero-entrance.jpg";
import roomSingle1 from "../assets/room-single-1.jpg";
import roomSingle2 from "../assets/room-single-2.jpg";
import roomDouble1 from "../assets/room-double-1.jpg";
import roomDouble2 from "../assets/room-double-2.jpg";
import roomSuite1 from "../assets/room-suite-1.jpg";
import roomSuite2 from "../assets/room-suite-2.jpg";
import roomSuite3 from "../assets/room-suite-3.jpg";
import galleryAttention from "../assets/gallery-attention.jpg";
import gallerySpaces1 from "../assets/gallery-spaces-1.jpg";
import gallerySpaces2 from "../assets/gallery-spaces-2.jpg";
import gallerySpaces3 from "../assets/gallery-spaces-3.jpg";
import salonSilver1 from "../assets/salon-silver-1.jpg";
import salonSilver2 from "../assets/salon-silver-2.jpg";
import salonSilver3 from "../assets/salon-silver-3.jpg";
import salonBlanco1 from "../assets/salon-blanco-1.jpg";
import salonBlanco2 from "../assets/salon-blanco-2.jpg";
import salonBlanco3 from "../assets/salon-blanco-3.jpg";
import salonLondon1 from "../assets/salon-london-1.jpg";
import salonLondon2 from "../assets/salon-london-2.jpg";
import salonLondon3 from "../assets/salon-london-3.jpg";
import founderMariana from "../assets/founder-mariana.jpg";
import promoRomantica from "../assets/promo-romantica.jpg";
import sealSernatur from "../assets/seal-sernatur.png";
import sealQ from "../assets/seal-q.png";
import sealEsnna from "../assets/seal-esnna.png";
import logoBooking from "../assets/logo-booking.png";
import logoGoogle from "../assets/logo-google.png";
import logoTripadvisor from "../assets/logo-tripadvisor.png";

export type Lang = "es" | "en";
export type Localized<T = string> = Record<Lang, T>;

export const site = {
  name: "Hotel Boston",
  city: "Quillota",
  region: "Región de Valparaíso",
  country: "Chile",
  address: "21 de Mayo 468",
  addressFull: "21 de Mayo 468, Quillota, Chile",
  founded: 1997,
  email: "hotelbostonreservas@gmail.com",
  whatsapp: "51987292169",
  whatsappDisplay: "+51 987 292 169",
  phones: [
    { label: "(33) 225 3197", href: "+56332253197" },
    { label: "(33) 231 6500", href: "+56332316500" },
    { label: "(33) 231 2800", href: "+56332312800" },
  ],
  mapEmbed:
    "https://www.google.com/maps?q=Hotel%20Boston%2C%2021%20de%20Mayo%20468%2C%20Quillota&output=embed",
  mapsUrl:
    "https://maps.google.com/?q=Hotel+Boston,+21+de+Mayo+468,+Quillota",
  wazeUrl: "https://waze.to/?ll=-32.86882,-71.23909&navigate=yes",
  coords: { lat: -32.868716, lng: -71.2388694 },
  social: {
    tripadvisor:
      "https://www.tripadvisor.cl/UserReviewEdit-g652401-d2540627-Hotel_Boston-Quillota_Valparaiso_Region.html",
    booking: "https://www.booking.com/hotel/cl/boston-quillota.es.html",
  },
} as const;

export const images = {
  heroSuite,
  heroLobby,
  heroEntrance,
  galleryAttention,
  gallerySpaces1,
  gallerySpaces2,
  gallerySpaces3,
  founderMariana,
  promoRomantica,
  seals: { sernatur: sealSernatur, q: sealQ, esnna: sealEsnna },
  reviewLogos: { booking: logoBooking, google: logoGoogle, tripadvisor: logoTripadvisor },
};

export type AmenityKey =
  | "attention"
  | "breakfast"
  | "parking"
  | "wifi"
  | "tv"
  | "heating"
  | "bathroom"
  | "phone"
  | "commonAreas"
  | "whiteboard"
  | "projector"
  | "catering";

export type RoomType = {
  slug: "single" | "doble" | "suite";
  name: Localized;
  short: Localized;
  description: Localized;
  size: string;
  beds: Localized;
  capacity: number;
  prices: { label: Localized; amount: number }[];
  image: ImageMetadata;
  gallery: ImageMetadata[];
  amenities: AmenityKey[];
};

export const roomTypes: RoomType[] = [
  {
    slug: "single",
    name: { es: "Single", en: "Single" },
    short: {
      es: "Confort y tranquilidad para tu viaje.",
      en: "Comfort and quiet for your trip.",
    },
    description: {
      es: "Una habitación confortable con una cama de dos plazas, pensada para descansar sin preocupaciones. Incluye desayuno.",
      en: "A comfortable room with a double bed, designed for an easy rest. Breakfast included.",
    },
    size: "24 m²",
    beds: { es: "1 cama de 2 plazas", en: "1 double bed" },
    capacity: 2,
    prices: [
      { label: { es: "Valor por persona", en: "Rate per person" }, amount: 72000 },
      { label: { es: "Valor matrimonial", en: "Double occupancy" }, amount: 75000 },
    ],
    image: roomSingle1,
    gallery: [roomSingle1, roomSingle2],
    amenities: ["breakfast", "tv", "wifi", "heating", "bathroom", "phone", "parking", "commonAreas"],
  },
  {
    slug: "doble",
    name: { es: "Doble", en: "Double" },
    short: {
      es: "Ideal para el descanso y la conversación.",
      en: "Ideal for rest and conversation.",
    },
    description: {
      es: "Amplia habitación equipada con dos camas de dos plazas. Incluye desayuno para dos personas.",
      en: "A spacious room with two double beds. Breakfast for two included.",
    },
    size: "36 m²",
    beds: { es: "2 camas de 2 plazas", en: "2 double beds" },
    capacity: 2,
    prices: [
      { label: { es: "Valor por dos personas", en: "Rate for two guests" }, amount: 80000 },
    ],
    image: roomDouble1,
    gallery: [roomDouble1, roomDouble2],
    amenities: ["breakfast", "tv", "wifi", "heating", "bathroom", "phone", "parking", "commonAreas"],
  },
  {
    slug: "suite",
    name: { es: "Suite", en: "Suite" },
    short: {
      es: "Una pausa con todo lo necesario para una buena noche.",
      en: "A pause with everything you need for a good night.",
    },
    description: {
      es: "Hermosa habitación de dos ambientes con dos camas King. Incluye desayuno para dos personas.",
      en: "A beautiful two-room suite with two King beds. Breakfast for two included.",
    },
    size: "50 m²",
    beds: { es: "2 camas King", en: "2 King beds" },
    capacity: 2,
    prices: [{ label: { es: "Valor", en: "Rate" }, amount: 90000 }],
    image: roomSuite1,
    gallery: [roomSuite1, roomSuite2, roomSuite3],
    amenities: ["breakfast", "tv", "wifi", "heating", "bathroom", "phone", "parking", "commonAreas"],
  },
];

export type Salon = {
  slug: "silver" | "blanco" | "london";
  name: string;
  capacity: number;
  description: Localized;
  image: ImageMetadata;
  gallery: ImageMetadata[];
};

export const salons: Salon[] = [
  {
    slug: "silver",
    name: "Silver",
    capacity: 40,
    description: {
      es: "Un salón versátil para reuniones de empresa, capacitaciones y celebraciones íntimas.",
      en: "A versatile room for business meetings, training sessions and intimate celebrations.",
    },
    image: salonSilver1,
    gallery: [salonSilver1, salonSilver2, salonSilver3],
  },
  {
    slug: "blanco",
    name: "Blanco",
    capacity: 100,
    description: {
      es: "Nuestro salón más amplio, ideal para matrimonios, graduaciones y eventos de mayor escala.",
      en: "Our largest room, ideal for weddings, graduations and larger events.",
    },
    image: salonBlanco1,
    gallery: [salonBlanco1, salonBlanco2, salonBlanco3],
  },
  {
    slug: "london",
    name: "London",
    capacity: 50,
    description: {
      es: "Un espacio acogedor para aniversarios, cumpleaños y encuentros con personalidad.",
      en: "A welcoming space for anniversaries, birthdays and gatherings with character.",
    },
    image: salonLondon1,
    gallery: [salonLondon1, salonLondon2, salonLondon3],
  },
];

export const amenityKeys: AmenityKey[] = [
  "attention",
  "breakfast",
  "parking",
  "wifi",
  "tv",
  "heating",
  "bathroom",
  "phone",
  "commonAreas",
  "whiteboard",
  "projector",
  "catering",
];

export const gallery = [
  {
    src: heroEntrance,
    caption: { es: "Entrada del hotel", en: "Hotel entrance" },
    alt: { es: "Entrada de Hotel Boston en Quillota", en: "Entrance of Hotel Boston in Quillota" },
  },
  {
    src: galleryAttention,
    caption: { es: "Atención cercana", en: "Warm service" },
    alt: { es: "Espacio de atención del Hotel Boston", en: "Guest service area at Hotel Boston" },
  },
  {
    src: roomSuite1,
    caption: { es: "Suite", en: "Suite" },
    alt: { es: "Habitación Suite del Hotel Boston", en: "Suite room at Hotel Boston" },
  },
  {
    src: roomDouble1,
    caption: { es: "Habitación Doble", en: "Double room" },
    alt: { es: "Habitación Doble del Hotel Boston", en: "Double room at Hotel Boston" },
  },
  {
    src: roomSingle1,
    caption: { es: "Habitación Single", en: "Single room" },
    alt: { es: "Habitación Single del Hotel Boston", en: "Single room at Hotel Boston" },
  },
  {
    src: gallerySpaces1,
    caption: { es: "Espacios acogedores", en: "Welcoming spaces" },
    alt: { es: "Espacio común del Hotel Boston", en: "Common area at Hotel Boston" },
  },
  {
    src: gallerySpaces2,
    caption: { es: "Salones", en: "Event rooms" },
    alt: { es: "Salón de eventos del Hotel Boston", en: "Event room at Hotel Boston" },
  },
  {
    src: salonBlanco1,
    caption: { es: "Salón Blanco", en: "Blanco room" },
    alt: { es: "Salón Blanco del Hotel Boston", en: "Blanco event room at Hotel Boston" },
  },
  {
    src: salonLondon1,
    caption: { es: "Salón London", en: "London room" },
    alt: { es: "Salón London del Hotel Boston", en: "London event room at Hotel Boston" },
  },
  {
    src: gallerySpaces3,
    caption: { es: "Ambientes relajantes", en: "Relaxing ambience" },
    alt: { es: "Ambiente del Hotel Boston", en: "Hotel Boston ambience" },
  },
];

export const reviews = [
  {
    name: "Claudio",
    source: "Booking.com",
    logo: logoBooking,
    text: "Por la hora que llegué, la atención fue muy buena, y el desayuno confortable y la limpieza. Realmente lo recomendaría.",
  },
  {
    name: "Alejandrina Espinoza Verdugo",
    source: "Google",
    logo: logoGoogle,
    text: "Excelente atención, una vez me hospedé en ese lugar, muy bueno y buenos precios, desayuno americano.",
  },
  {
    name: "Carlitos Serena",
    source: "Tripadvisor",
    logo: logoTripadvisor,
    text: "Si pasas por Quillota una excelente opción es este hotel, precios accesibles, excelente atención, lindas habitaciones, cómodas y limpias. Desayuno rico, una torta de yoghurt deliciosa. Amplio y seguro estacionamiento. ¿Volveríamos? Claro que sí.",
  },
];
