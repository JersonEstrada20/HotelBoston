import type { Lang } from "../data/site";

export type RouteKey =
  | "home"
  | "rooms"
  | "salons"
  | "gallery"
  | "bookings"
  | "location"
  | "faq"
  | "terms"
  | "privacy";

export const routes: Record<RouteKey, Record<Lang, string>> = {
  home: { es: "/", en: "/en/" },
  rooms: { es: "/habitaciones", en: "/en/rooms" },
  salons: { es: "/salones", en: "/en/event-rooms" },
  gallery: { es: "/galeria", en: "/en/gallery" },
  bookings: { es: "/reservas", en: "/en/bookings" },
  location: { es: "/ubicacion", en: "/en/location" },
  faq: { es: "/preguntas-frecuentes", en: "/en/faq" },
  terms: { es: "/terminos-y-condiciones", en: "/en/terms" },
  privacy: { es: "/politica-de-privacidad", en: "/en/privacy" },
};

export const defaultLang: Lang = "es";

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split("/");
  return first === "en" ? "en" : "es";
}

export function route(lang: Lang, key: RouteKey): string {
  return routes[key][lang];
}

export function otherLang(lang: Lang): Lang {
  return lang === "es" ? "en" : "es";
}

export function formatClp(amount: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "es" ? "es-CL" : "en-US", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const ui = {
  es: {
    locale: "es_CL",
    meta: {
      home: {
        title: "Hotel Boston | Hotel en Quillota, Región de Valparaíso",
        description:
          "Hotel Boston en Quillota: habitaciones cómodas, desayuno, estacionamiento y salones de eventos. A pasos del centro y cerca de las principales rutas.",
      },
      rooms: {
        title: "Habitaciones | Hotel Boston Quillota",
        description:
          "Habitaciones Single, Doble y Suite en Hotel Boston Quillota. Desayuno incluido, WiFi, calefacción, baño privado y estacionamiento.",
      },
      salons: {
        title: "Salones de eventos | Hotel Boston Quillota",
        description:
          "Salones Silver, Blanco y London para empresas, matrimonios, graduaciones y celebraciones en Quillota. Capacidad para 40, 50 y 100 personas.",
      },
      gallery: {
        title: "Galería | Hotel Boston Quillota",
        description:
          "Conoce las habitaciones, espacios comunes y salones de Hotel Boston en Quillota.",
      },
      bookings: {
        title: "Reservas | Hotel Boston Quillota",
        description:
          "Solicita tu estadía en Hotel Boston Quillota. Envía tus fechas y datos; confirmaremos disponibilidad y reserva.",
      },
      location: {
        title: "Ubicación y contacto | Hotel Boston Quillota",
        description:
          "Hotel Boston está en 21 de Mayo 468, Quillota, a pasos del centro. Teléfonos, correo, WhatsApp y cómo llegar.",
      },
      faq: {
        title: "Preguntas frecuentes | Hotel Boston Quillota",
        description:
          "Check-in, desayuno, estacionamiento, cancelaciones, pagos, mascotas y salones de eventos en Hotel Boston Quillota.",
      },
      terms: {
        title: "Términos y condiciones | Hotel Boston Quillota",
        description:
          "Condiciones de reserva, check-in, cancelaciones, pagos y políticas de Hotel Boston Quillota.",
      },
      privacy: {
        title: "Política de privacidad | Hotel Boston Quillota",
        description:
          "Cómo Hotel Boston Quillota trata y protege los datos personales de sus huéspedes y visitantes.",
      },
    },
    nav: {
      home: "Inicio",
      rooms: "Habitaciones",
      salons: "Salones",
      gallery: "Galería",
      location: "Ubicación",
      faq: "Preguntas frecuentes",
      book: "Reservar",
    },
    common: {
      skip: "Saltar al contenido",
      menuOpen: "Abrir menú",
      menuClose: "Cerrar menú",
      language: "English",
      languageLabel: "Cambiar a inglés",
      call: "Llamar",
      whatsapp: "WhatsApp",
      email: "Escribir",
      map: "Ver en Google Maps",
      waze: "Abrir en Waze",
      directions: "Cómo llegar",
      home: "Inicio",
      bookStay: "Reservar estadía",
      checkAvailability: "Consultar disponibilidad",
      requestBooking: "Solicitar reserva",
      quoteEvent: "Cotizar un evento",
      seeRooms: "Ver habitaciones",
      seeGallery: "Ver galería",
      contactUs: "Contactarnos",
      viewAll: "Ver todo",
      from: "Desde",
      inclVat: "IVA incluido",
      capacity: "Capacidad",
      people: "personas",
      size: "Tamaño",
      beds: "Camas",
      amenities: "Incluye",
      night: "noche",
      perNight: "por noche",
      photo: "Fotografía",
      openPhoto: "Ampliar fotografía",
      close: "Cerrar",
      previous: "Anterior",
      next: "Siguiente",
      loading: "Cargando",
      updated: "Última actualización",
      source: "Fuente",
      verified: "Publicada en",
      ratesNote:
        "Tarifas publicadas con IVA incluido. La disponibilidad y el valor final se confirman al gestionar la reserva.",
    },
    header: {
      tagline: "Quillota · Región de Valparaíso",
      book: "Reservar estadía",
    },
    footer: {
      tagline: "Una estadía acogedora en el corazón de Quillota.",
      explore: "Explorar",
      contact: "Contacto",
      legal: "Información legal",
      certifications: "Certificaciones",
      rights: "Todos los derechos reservados.",
      reviewCta: "Déjanos tu opinión",
      built: "Sitio oficial de Hotel Boston.",
    },
    home: {
      eyebrow: "Quillota · Región de Valparaíso",
      title: "Descansa como en casa.",
      copy: "Un lugar cálido, tranquilo y pensado para que tu viaje se sienta especial.",
      cta: "Consulta tu estadía",
      since: "Desde 1997, recibiendo historias",
      introEyebrow: "Bienvenidos a Hotel Boston",
      introTitle: "Hospitalidad que se siente cercana.",
      introText:
        "Creemos que una buena estadía se construye en los detalles: una bienvenida amable, espacios cómodos y la tranquilidad de saber que todo está resuelto.",
      introText2:
        "Estamos a pasos del centro de Quillota y cerca de las principales rutas, para que llegues, descanses y disfrutes tu destino. También nos orientamos a ser un hotel consciente con el medio ambiente.",
      certification: "Hotel con certificación de calidad turística",
      locationLink: "Conoce nuestra ubicación",
      roomsEyebrow: "Nuestras habitaciones",
      roomsTitle: "Tu pausa empieza aquí.",
      roomsCopy:
        "Espacios acogedores y funcionales para descansar, trabajar o compartir con quien más quieres.",
      promoEyebrow: "Promoción especial",
      promoTitle: "Noche Romántica.",
      promoCopy:
        "Una noche para celebrar a quien quieres. Ya sea una noche de bodas, aniversario u otra ocasión especial, preparamos el ambiente para que sea inolvidable.",
      promoIncludes: "Incluye espumante, bombones y desayuno para dos personas.",
      promoValue: "Valor",
      promoNote: "Consulta disponibilidad y condiciones al reservar.",
      promoRequest: "Solicitar reserva",
      eventsEyebrow: "Salones de eventos",
      eventsTitle: "Momentos que merecen un lugar.",
      eventsCopy:
        "Reuniones, celebraciones y encuentros con un ambiente acogedor. Cuéntanos qué imaginas y coordinemos cada detalle.",
      eventsCta: "Cotizar un evento",
      historyEyebrow: "Nuestra historia",
      historyTitle: "Una idea nacida en Quillota.",
      historyText:
        "Las mejores ideas nacen cuando existe una necesidad. Para Mariana Silva, un hotel en Quillota era una verdadera necesidad; hoy, Hotel Boston sigue recibiendo a quienes buscan descanso y buena atención.",
      historyQuote:
        "Con calor de hogar, a un precio razonable; un lugar que invite a los pasajeros a quedarse en esta ciudad amigable.",
      historySignature: "Mariana Silva",
      quote: "Es estar en casa, pero con la comodidad de un hotel.",
      quoteCaption: "Una experiencia que nuestros pasajeros valoran",
      reviewsEyebrow: "Opiniones e ideas",
      reviewsTitle: "Nos encanta recibirte bien.",
      reviewsNote:
        "Opiniones publicadas por huéspedes en plataformas de viaje. Se mantienen en su idioma original.",
      reviewsCta: "¿Ya nos visitaste? Déjanos tu opinión",
      contactEyebrow: "Reservas y contacto",
      contactTitle: "Te esperamos en Quillota.",
      contactCopy:
        "Escríbenos o llámanos para consultar disponibilidad, tarifas y opciones para tu estadía.",
      finalTitle: "Tu estadía empieza con una conversación.",
      finalCopy:
        "Cuéntanos tus fechas y te ayudamos a encontrar la mejor opción para tu viaje.",
    },
    amenities: {
      attention: "Atención personalizada",
      breakfast: "Desayuno buffet",
      parking: "Estacionamiento privado",
      wifi: "Internet WiFi",
      tv: "TV por cable",
      heating: "Calefacción",
      bathroom: "Baño privado",
      phone: "Teléfono",
      commonAreas: "Espacios comunes",
      whiteboard: "Pizarra",
      projector: "Datashow",
      catering: "Alimentación opcional",
    },
    rooms: {
      eyebrow: "Habitaciones",
      title: "Descanso a tu medida.",
      copy:
        "Todas nuestras habitaciones están equipadas para que tu estadía sea cómoda: desayuno incluido, WiFi, calefacción, baño privado y estacionamiento.",
      introTitle: "Bien equipadas, pensadas para descansar.",
      introText:
        "Elige entre Single, Doble y Suite. Si necesitas ayuda para escoger, escríbenos y te orientamos según tus fechas y cantidad de huéspedes.",
      amenitiesTitle: "Nuestras habitaciones cuentan con",
      priceNote: "Tarifas publicadas con IVA incluido. Consulta disponibilidad.",
      cta: "Consultar esta habitación",
      detailTitle: "Detalle de la habitación",
      back: "Volver a habitaciones",
    },
    salons: {
      eyebrow: "Salones de eventos",
      title: "Un lugar para cada ocasión.",
      copy:
        "Nuestros salones están completamente equipados para empresas, capacitaciones, matrimonios, cumpleaños, graduaciones, aniversarios y ocasiones especiales.",
      equipmentTitle: "Nuestros salones cuentan con",
      usesTitle: "Ideales para",
      uses: [
        "Reuniones de empresa",
        "Capacitaciones",
        "Matrimonios",
        "Cumpleaños",
        "Graduaciones",
        "Aniversarios",
        "Ocasiones especiales",
      ],
      capacity: "Capacidad",
      cta: "Consultar este salón",
      note:
        "La alimentación es opcional y se coordina según el evento. Escríbenos para revisar disponibilidad y condiciones.",
    },
    gallery: {
      eyebrow: "Galería",
      title: "Conoce el hotel.",
      copy:
        "Habitaciones, espacios comunes y salones. Las fotografías se actualizarán a medida que tengamos nuevos registros del hotel.",
      note: "Haz clic en una fotografía para ampliarla.",
    },
    bookings: {
      eyebrow: "Reservas",
      title: "Solicita tu estadía.",
      copy:
        "Completa el formulario con tus fechas y datos. Te contactaremos para confirmar disponibilidad y coordinar el pago.",
      noticeTitle: "Importante",
      notice:
        "Esta solicitud no garantiza la reserva. La confirmaremos previo acuerdo y pago convenido.",
      formTitle: "Solicitud de habitación",
      formCopy:
        "Envía tu solicitud por correo o WhatsApp. Te responderemos a la brevedad posible.",
      name: "Nombre completo",
      email: "Correo electrónico",
      phone: "Teléfono",
      arrival: "Fecha de llegada",
      departure: "Fecha de salida",
      room: "Habitación o salón",
      roomPlaceholder: "Selecciona una opción",
      roomsGroup: "Habitaciones",
      salonsGroup: "Salones de eventos",
      validationDates: "La fecha de salida debe ser posterior a la fecha de llegada.",
      openingEmail: "Se abrirá tu aplicación de correo con la solicitud preparada.",
      openingWhatsapp: "Se abrirá WhatsApp con la solicitud preparada.",
      emailSubject: "Solicitud de reserva — Hotel Boston",
      requestIntro: "Solicitud de reserva — Hotel Boston",
      guests: "Cantidad de huéspedes",
      message: "Mensaje o requerimientos especiales",
      consent:
        "Autorizo el tratamiento de mis datos para gestionar esta solicitud, según la política de privacidad.",
      submitEmail: "Enviar por correo",
      submitWhatsapp: "Enviar por WhatsApp",
      formNote:
        "Al enviar, se abrirá tu aplicación de correo o WhatsApp con el mensaje preparado. No se guarda información en este sitio todavía.",
      eventTitle: "¿Buscas un salón para un evento?",
      eventCopy:
        "Cuéntanos el tipo de evento, la fecha aproximada y la cantidad de personas. Te enviaremos una cotización.",
      eventCta: "Solicitar cotización",
      policiesTitle: "Antes de reservar",
      policies: [
        "Check-in desde las 13:00 y check-out hasta las 12:00.",
        "Las tarifas publicadas incluyen 19% de IVA, salvo reservas por Booking.com.",
        "Cancelación sin costo hasta 24 horas antes de la llegada, salvo tarifas promocionales no reembolsables.",
        "No se permiten mascotas, excepto animales de asistencia certificados.",
        "No está permitido fumar al interior del hotel.",
      ],
      policiesLink: "Leer términos y condiciones",
    },
    location: {
      eyebrow: "Ubicación y contacto",
      title: "A pasos del centro de Quillota.",
      copy:
        "Nos encontramos en una excelente ubicación, con locomoción a la puerta y cerca de bancos, supermercados, farmacias y centros comerciales.",
      addressTitle: "Dirección",
      phonesTitle: "Teléfonos",
      emailTitle: "Correo",
      whatsappTitle: "WhatsApp",
      mapTitle: "Mapa",
      howTitle: "Cómo llegar",
      howCopy:
        "Puedes llegar en auto o transporte público. Usa Google Maps o Waze para trazar tu ruta desde tu ubicación.",
      parkingTitle: "Estacionamiento",
      parkingCopy:
        "El hotel cuenta con estacionamiento privado para sus huéspedes.",
      ctaTitle: "¿Necesitas ayuda con tu llegada?",
      ctaCopy: "Escríbenos y te orientamos.",
    },
    faq: {
      eyebrow: "Preguntas frecuentes",
      title: "Todo lo que necesitas saber.",
      copy:
        "Si tu pregunta no aparece aquí, escríbenos por WhatsApp o correo y te responderemos.",
      items: [
        {
          q: "¿A qué hora es el check-in y el check-out?",
          a: "El check-in es desde las 13:00 y el check-out hasta las 12:00. Si necesitas otro horario, contáctanos y revisaremos disponibilidad.",
        },
        {
          q: "¿El desayuno está incluido?",
          a: "Sí. Las habitaciones incluyen desayuno buffet.",
        },
        {
          q: "¿Tienen estacionamiento?",
          a: "Sí, el hotel cuenta con estacionamiento privado para sus huéspedes.",
        },
        {
          q: "¿Cómo puedo reservar?",
          a: "Puedes enviar una solicitud desde la página de reservas, escribirnos por WhatsApp o llamarnos. La solicitud se confirma previo acuerdo y pago convenido.",
        },
        {
          q: "¿Qué formas de pago aceptan?",
          a: "Aceptamos tarjeta de crédito (sin cuotas), tarjeta de débito, efectivo y transferencias.",
        },
        {
          q: "¿Puedo cancelar o modificar mi reserva?",
          a: "Puedes cancelar o cambiar sin costo hasta 24 horas antes de la llegada, siempre que no hayas optado por una tarifa promocional no reembolsable. Si reservaste por un portal externo, gestiona el cambio por ese mismo canal.",
        },
        {
          q: "¿Las tarifas incluyen impuestos?",
          a: "Sí, las tarifas publicadas incluyen 19% de IVA, excepto las reservas efectuadas a través de Booking.com.",
        },
        {
          q: "¿Aceptan mascotas?",
          a: "No se permiten mascotas, con excepción de animales de asistencia que cuenten con su certificación.",
        },
        {
          q: "¿Se puede fumar en el hotel?",
          a: "No está permitido fumar al interior del hotel. Consulta los sectores habilitados para fumadores.",
        },
        {
          q: "¿Cuántas personas pueden dormir por habitación?",
          a: "La capacidad máxima es de 2 personas por habitación, según el tipo informado. Si viajas con más personas, escríbenos para revisar alternativas.",
        },
        {
          q: "¿Tienen salones para eventos?",
          a: "Sí. Contamos con los salones Silver (40 personas), Blanco (100 personas) y London (50 personas), con pizarra, datashow, WiFi, calefacción y alimentación opcional.",
        },
        {
          q: "¿Dónde están ubicados?",
          a: "En 21 de Mayo 468, Quillota, a pasos del centro y cerca de bancos, supermercados, farmacias y centros comerciales.",
        },
      ],
      cta: "Hacer una consulta",
    },
    terms: {
      eyebrow: "Información legal",
      title: "Términos y condiciones",
      updated: "Última actualización: octubre de 2026",
      intro:
        "Estos términos regulan las solicitudes y reservas de alojamiento y salones en Hotel Boston. Si necesitas ayuda, contáctanos antes de reservar.",
      sections: [
        {
          title: "Solicitudes y reservas",
          body: [
            "Una solicitud enviada por el sitio web, correo o WhatsApp no garantiza la reserva. La reserva queda confirmada una vez que Hotel Boston verifica la disponibilidad y acuerda el pago con el huésped.",
          ],
        },
        {
          title: "Check-in y check-out",
          body: [
            "El check-in es desde las 13:00 y el check-out hasta las 12:00. Si necesitas un horario especial, contáctanos con anticipación; la disponibilidad depende de la operación del hotel.",
          ],
        },
        {
          title: "Tarifas e impuestos",
          body: [
            "Las tarifas publicadas incluyen 19% de IVA, excepto las reservas efectuadas a través de Booking.com. Las tarifas pueden variar según disponibilidad, temporada y tipo de habitación. El valor final se confirma al gestionar la reserva.",
          ],
        },
        {
          title: "Capacidad",
          body: [
            "Cada habitación tiene una capacidad máxima informada. El número de huéspedes permitido no puede excederse sin autorización del hotel.",
          ],
        },
        {
          title: "Cancelaciones y modificaciones",
          body: [
            "Puedes cancelar o cambiar una reserva sin costo hasta 24 horas antes de la llegada, siempre que no hayas optado por una tarifa promocional no reembolsable. Fuera de ese plazo se podrá retener el valor de la primera noche.",
            "Si reservaste directamente con Hotel Boston, contáctanos por correo o teléfono. Si reservaste a través de un sitio de terceros, los cambios deben gestionarse por ese mismo canal.",
          ],
        },
        {
          title: "Salida anticipada",
          body: [
            "Si necesitas dejar el hotel antes de la fecha prevista, avísanos por correo al menos 24 horas antes de tu nueva fecha de salida para no cobrar una noche adicional. La solicitud quedará documentada por escrito.",
          ],
        },
        {
          title: "No presentación",
          body: [
            "Si no te presentas y no cancelas la reserva, se cobrará el valor de la primera noche más impuestos.",
          ],
        },
        {
          title: "Formas de pago",
          body: [
            "Aceptamos tarjeta de crédito (sin cuotas), tarjeta de débito, efectivo y transferencias.",
          ],
        },
        {
          title: "Mascotas y tabaco",
          body: [
            "No se permiten mascotas, con excepción de animales de asistencia que cuenten con su certificación. No está permitido fumar al interior del hotel; consulta los sectores habilitados.",
          ],
        },
        {
          title: "Salones de eventos",
          body: [
            "La disponibilidad de salones, capacidades, equipamiento, alimentación y tarifas se confirma caso a caso según el tipo de evento y la fecha solicitada.",
          ],
        },
      ],
      contactTitle: "Consultas sobre estos términos",
      contactCopy:
        "Escríbenos a hotelbostonreservas@gmail.com o llámanos al (33) 225 3197.",
    },
    privacy: {
      eyebrow: "Información legal",
      title: "Política de privacidad",
      updated: "Última actualización: octubre de 2026",
      intro:
        "En Hotel Boston tratamos los datos personales de huéspedes y visitantes con confidencialidad y solo para las finalidades necesarias para atender solicitudes y reservas.",
      sections: [
        {
          title: "Responsable del tratamiento",
          body: [
            "Hotel Boston, ubicado en 21 de Mayo 468, Quillota, Chile. Para consultas sobre datos personales puedes escribir a hotelbostonreservas@gmail.com.",
          ],
        },
        {
          title: "Datos que recopilamos",
          body: [
            "Podemos recopilar nombre, correo electrónico, teléfono, fechas de estadía, tipo de habitación, cantidad de huéspedes y los requerimientos que nos entregues voluntariamente al enviar una solicitud o contactarnos.",
            "También podemos recibir datos técnicos básicos de navegación, como el tipo de navegador, el dispositivo y la página visitada, cuando utilizamos herramientas de medición agregada.",
          ],
        },
        {
          title: "Finalidades",
          body: [
            "Usamos los datos para responder consultas, gestionar solicitudes y reservas, coordinar pagos, entregar información sobre el servicio y cumplir obligaciones legales.",
            "No vendemos ni cedemos tus datos a terceros para fines publicitarios.",
          ],
        },
        {
          title: "Base legal y derechos",
          body: [
            "El tratamiento se basa en tu consentimiento y en la ejecución de la relación de reserva, conforme a la Ley N° 19.628 y a la Ley N° 21.719 sobre protección de datos personales.",
            "Puedes solicitar acceso, rectificación, cancelación, oposición o portabilidad de tus datos escribiendo a hotelbostonreservas@gmail.com. Responderemos dentro de los plazos legales.",
          ],
        },
        {
          title: "Conservación",
          body: [
            "Conservamos los datos durante el tiempo necesario para gestionar la solicitud o reserva y para cumplir obligaciones legales, tributarias o de seguridad.",
          ],
        },
        {
          title: "Proveedores",
          body: [
            "Para operar el sitio y las comunicaciones podemos utilizar proveedores tecnológicos de alojamiento web, base de datos, correo transaccional y mensajería. Estos proveedores tratan los datos por cuenta de Hotel Boston y con medidas de seguridad adecuadas.",
          ],
        },
        {
          title: "Cookies y analítica",
          body: [
            "El sitio puede utilizar medición agregada y sin cookies para conocer el rendimiento de las páginas. Si en el futuro se incorporan cookies analíticas o publicitarias, se solicitará el consentimiento correspondiente.",
          ],
        },
        {
          title: "Seguridad",
          body: [
            "Aplicamos medidas razonables de seguridad para proteger la información. Ningún sistema es completamente infalible; si ocurre un incidente relevante, actuaremos conforme a la normativa aplicable.",
          ],
        },
      ],
      contactTitle: "Ejercicio de derechos",
      contactCopy:
        "Para acceder, corregir o eliminar tus datos, escríbenos a hotelbostonreservas@gmail.com.",
    },
    notFound: {
      eyebrow: "Error 404",
      title: "No encontramos esta página.",
      copy: "Puede que el enlace haya cambiado o que la página ya no exista. Te invitamos a volver al inicio.",
      cta: "Volver al inicio",
    },
  },
  en: {
    locale: "en_US",
    meta: {
      home: {
        title: "Hotel Boston | Hotel in Quillota, Valparaíso Region",
        description:
          "Hotel Boston in Quillota: comfortable rooms, breakfast, parking and event rooms. Steps from downtown and close to the main routes.",
      },
      rooms: {
        title: "Rooms | Hotel Boston Quillota",
        description:
          "Single, Double and Suite rooms at Hotel Boston Quillota. Breakfast included, WiFi, heating, private bathroom and parking.",
      },
      salons: {
        title: "Event rooms | Hotel Boston Quillota",
        description:
          "Silver, Blanco and London event rooms for companies, weddings, graduations and celebrations in Quillota. Capacity for 40, 50 and 100 guests.",
      },
      gallery: {
        title: "Gallery | Hotel Boston Quillota",
        description:
          "Explore the rooms, common areas and event rooms of Hotel Boston in Quillota.",
      },
      bookings: {
        title: "Bookings | Hotel Boston Quillota",
        description:
          "Request your stay at Hotel Boston Quillota. Send your dates and details; we will confirm availability and your booking.",
      },
      location: {
        title: "Location and contact | Hotel Boston Quillota",
        description:
          "Hotel Boston is located at 21 de Mayo 468, Quillota, steps from downtown. Phone numbers, email, WhatsApp and directions.",
      },
      faq: {
        title: "Frequently asked questions | Hotel Boston Quillota",
        description:
          "Check-in, breakfast, parking, cancellations, payments, pets and event rooms at Hotel Boston Quillota.",
      },
      terms: {
        title: "Terms and conditions | Hotel Boston Quillota",
        description:
          "Booking conditions, check-in, cancellations, payments and policies at Hotel Boston Quillota.",
      },
      privacy: {
        title: "Privacy policy | Hotel Boston Quillota",
        description:
          "How Hotel Boston Quillota handles and protects the personal data of guests and visitors.",
      },
    },
    nav: {
      home: "Home",
      rooms: "Rooms",
      salons: "Event rooms",
      gallery: "Gallery",
      location: "Location",
      faq: "FAQ",
      book: "Book",
    },
    common: {
      skip: "Skip to content",
      menuOpen: "Open menu",
      menuClose: "Close menu",
      language: "Español",
      languageLabel: "Switch to Spanish",
      call: "Call",
      whatsapp: "WhatsApp",
      email: "Email",
      map: "View on Google Maps",
      waze: "Open in Waze",
      directions: "Directions",
      home: "Home",
      bookStay: "Book your stay",
      checkAvailability: "Check availability",
      requestBooking: "Request a booking",
      quoteEvent: "Request an event quote",
      seeRooms: "View rooms",
      seeGallery: "View gallery",
      contactUs: "Contact us",
      viewAll: "View all",
      from: "From",
      inclVat: "VAT included",
      capacity: "Capacity",
      people: "guests",
      size: "Size",
      beds: "Beds",
      amenities: "Includes",
      night: "night",
      perNight: "per night",
      photo: "Photo",
      openPhoto: "Enlarge photo",
      close: "Close",
      previous: "Previous",
      next: "Next",
      loading: "Loading",
      updated: "Last updated",
      source: "Source",
      verified: "Published on",
      ratesNote:
        "Published rates include VAT. Availability and the final price are confirmed when the booking is processed.",
    },
    header: {
      tagline: "Quillota · Valparaíso Region",
      book: "Book your stay",
    },
    footer: {
      tagline: "A welcoming stay in the heart of Quillota.",
      explore: "Explore",
      contact: "Contact",
      legal: "Legal information",
      certifications: "Certifications",
      rights: "All rights reserved.",
      reviewCta: "Leave a review",
      built: "Official Hotel Boston website.",
    },
    home: {
      eyebrow: "Quillota · Valparaíso Region",
      title: "Rest like you are at home.",
      copy: "A warm, quiet place designed to make your trip feel special.",
      cta: "Check your stay",
      since: "Welcoming stories since 1997",
      introEyebrow: "Welcome to Hotel Boston",
      introTitle: "Hospitality that feels close.",
      introText:
        "We believe a good stay is built on details: a friendly welcome, comfortable spaces and the peace of mind of knowing everything is taken care of.",
      introText2:
        "We are steps from downtown Quillota and close to the main routes, so you can arrive, rest and enjoy your destination. We also aim to be an environmentally conscious hotel.",
      certification: "Hotel with tourism quality certification",
      locationLink: "See our location",
      roomsEyebrow: "Our rooms",
      roomsTitle: "Your pause starts here.",
      roomsCopy:
        "Welcoming, functional spaces to rest, work or share with the people you love.",
      promoEyebrow: "Special promotion",
      promoTitle: "Romantic Night.",
      promoCopy:
        "A night to celebrate the person you love. Whether it is a wedding night, an anniversary or another special occasion, we set the scene to make it unforgettable.",
      promoIncludes: "Includes sparkling wine, chocolates and breakfast for two.",
      promoValue: "Price",
      promoNote: "Ask about availability and conditions when booking.",
      promoRequest: "Request this stay",
      eventsEyebrow: "Event rooms",
      eventsTitle: "Moments that deserve a place.",
      eventsCopy:
        "Meetings, celebrations and gatherings in a welcoming setting. Tell us what you have in mind and we will coordinate every detail.",
      eventsCta: "Request an event quote",
      historyEyebrow: "Our story",
      historyTitle: "An idea born in Quillota.",
      historyText:
        "The best ideas are born from a need. For Mariana Silva, a hotel in Quillota was a real need; today, Hotel Boston continues to welcome those looking for rest and good service.",
      historyQuote:
        "The warmth of home at a reasonable price; a place that invites travellers to stay in this friendly city.",
      historySignature: "Mariana Silva",
      quote: "It feels like home, with the comfort of a hotel.",
      quoteCaption: "An experience our guests value",
      reviewsEyebrow: "Reviews and ideas",
      reviewsTitle: "We love welcoming you well.",
      reviewsNote:
        "Reviews published by guests on travel platforms. They are shown in their original language.",
      reviewsCta: "Have you stayed with us? Leave a review",
      contactEyebrow: "Bookings and contact",
      contactTitle: "We are waiting for you in Quillota.",
      contactCopy:
        "Write or call us to ask about availability, rates and options for your stay.",
      finalTitle: "Your stay starts with a conversation.",
      finalCopy:
        "Tell us your dates and we will help you find the best option for your trip.",
    },
    amenities: {
      attention: "Personal service",
      breakfast: "Buffet breakfast",
      parking: "Private parking",
      wifi: "WiFi internet",
      tv: "Cable TV",
      heating: "Heating",
      bathroom: "Private bathroom",
      phone: "Telephone",
      commonAreas: "Common areas",
      whiteboard: "Whiteboard",
      projector: "Projector",
      catering: "Optional catering",
    },
    rooms: {
      eyebrow: "Rooms",
      title: "Rest on your terms.",
      copy:
        "All our rooms are equipped for a comfortable stay: breakfast included, WiFi, heating, private bathroom and parking.",
      introTitle: "Well equipped, designed for rest.",
      introText:
        "Choose between Single, Double and Suite. If you need help deciding, write to us and we will guide you based on your dates and group size.",
      amenitiesTitle: "Our rooms include",
      priceNote: "Published rates include VAT. Ask about availability.",
      cta: "Ask about this room",
      detailTitle: "Room details",
      back: "Back to rooms",
    },
    salons: {
      eyebrow: "Event rooms",
      title: "A place for every occasion.",
      copy:
        "Our event rooms are fully equipped for companies, training sessions, weddings, birthdays, graduations, anniversaries and special occasions.",
      equipmentTitle: "Our event rooms include",
      usesTitle: "Ideal for",
      uses: [
        "Company meetings",
        "Training sessions",
        "Weddings",
        "Birthdays",
        "Graduations",
        "Anniversaries",
        "Special occasions",
      ],
      capacity: "Capacity",
      cta: "Ask about this room",
      note:
        "Catering is optional and coordinated for each event. Write to us to check availability and conditions.",
    },
    gallery: {
      eyebrow: "Gallery",
      title: "Get to know the hotel.",
      copy:
        "Rooms, common areas and event rooms. Photos will be updated as new images of the hotel become available.",
      note: "Click a photo to enlarge it.",
    },
    bookings: {
      eyebrow: "Bookings",
      title: "Request your stay.",
      copy:
        "Fill in the form with your dates and details. We will contact you to confirm availability and arrange payment.",
      noticeTitle: "Important",
      notice:
        "This request does not guarantee a booking. We will confirm it after agreement and payment.",
      formTitle: "Room request",
      formCopy:
        "Send your request by email or WhatsApp. We will reply as soon as possible.",
      name: "Full name",
      email: "Email address",
      phone: "Phone number",
      arrival: "Arrival date",
      departure: "Departure date",
      room: "Room or event space",
      roomPlaceholder: "Select an option",
      roomsGroup: "Rooms",
      salonsGroup: "Event rooms",
      validationDates: "The departure date must be after the arrival date.",
      openingEmail: "Your email app will open with the request prepared.",
      openingWhatsapp: "WhatsApp will open with the request prepared.",
      emailSubject: "Booking request — Hotel Boston",
      requestIntro: "Booking request — Hotel Boston",
      guests: "Number of guests",
      message: "Message or special requests",
      consent:
        "I consent to the processing of my data to manage this request, according to the privacy policy.",
      submitEmail: "Send by email",
      submitWhatsapp: "Send by WhatsApp",
      formNote:
        "When you submit, your email app or WhatsApp will open with a prepared message. No information is stored on this site yet.",
      eventTitle: "Looking for an event room?",
      eventCopy:
        "Tell us the type of event, the approximate date and the number of guests. We will send you a quote.",
      eventCta: "Request a quote",
      policiesTitle: "Before you book",
      policies: [
        "Check-in from 1:00 pm and check-out until 12:00 pm.",
        "Published rates include 19% VAT, except bookings made through Booking.com.",
        "Free cancellation up to 24 hours before arrival, except non-refundable promotional rates.",
        "Pets are not allowed, except certified assistance animals.",
        "Smoking is not allowed inside the hotel.",
      ],
      policiesLink: "Read the terms and conditions",
    },
    location: {
      eyebrow: "Location and contact",
      title: "Steps from downtown Quillota.",
      copy:
        "We are in an excellent location, with public transport at the door and close to banks, supermarkets, pharmacies and shopping centres.",
      addressTitle: "Address",
      phonesTitle: "Phone numbers",
      emailTitle: "Email",
      whatsappTitle: "WhatsApp",
      mapTitle: "Map",
      howTitle: "Getting here",
      howCopy:
        "You can arrive by car or public transport. Use Google Maps or Waze to plan your route from your location.",
      parkingTitle: "Parking",
      parkingCopy: "The hotel offers private parking for its guests.",
      ctaTitle: "Need help with your arrival?",
      ctaCopy: "Write to us and we will guide you.",
    },
    faq: {
      eyebrow: "Frequently asked questions",
      title: "Everything you need to know.",
      copy:
        "If your question is not here, write to us on WhatsApp or by email and we will reply.",
      items: [
        {
          q: "What are the check-in and check-out times?",
          a: "Check-in is from 1:00 pm and check-out is until 12:00 pm. If you need another time, contact us and we will check availability.",
        },
        {
          q: "Is breakfast included?",
          a: "Yes. Rooms include a buffet breakfast.",
        },
        {
          q: "Do you have parking?",
          a: "Yes, the hotel has private parking for its guests.",
        },
        {
          q: "How can I book?",
          a: "You can send a request from the bookings page, write to us on WhatsApp or call us. The booking is confirmed after agreement and payment.",
        },
        {
          q: "Which payment methods do you accept?",
          a: "We accept credit cards (no instalments), debit cards, cash and bank transfers.",
        },
        {
          q: "Can I cancel or change my booking?",
          a: "You can cancel or change at no cost up to 24 hours before arrival, provided you did not choose a non-refundable promotional rate. If you booked through an external platform, manage the change through that same channel.",
        },
        {
          q: "Do rates include taxes?",
          a: "Yes, published rates include 19% VAT, except bookings made through Booking.com.",
        },
        {
          q: "Are pets allowed?",
          a: "Pets are not allowed, except assistance animals with their certification.",
        },
        {
          q: "Is smoking allowed?",
          a: "Smoking is not allowed inside the hotel. Ask about the designated smoking areas.",
        },
        {
          q: "How many guests can stay in a room?",
          a: "The maximum capacity is 2 guests per room, depending on the room type. If you are travelling with more people, write to us to review options.",
        },
        {
          q: "Do you have event rooms?",
          a: "Yes. We have the Silver (40 guests), Blanco (100 guests) and London (50 guests) rooms, with whiteboard, projector, WiFi, heating and optional catering.",
        },
        {
          q: "Where are you located?",
          a: "At 21 de Mayo 468, Quillota, steps from downtown and close to banks, supermarkets, pharmacies and shopping centres.",
        },
      ],
      cta: "Ask a question",
    },
    terms: {
      eyebrow: "Legal information",
      title: "Terms and conditions",
      updated: "Last updated: October 2026",
      intro:
        "These terms govern requests and bookings for rooms and event spaces at Hotel Boston. If you need help, contact us before booking.",
      sections: [
        {
          title: "Requests and bookings",
          body: [
            "A request sent through the website, email or WhatsApp does not guarantee a booking. The booking is confirmed once Hotel Boston verifies availability and agrees on payment with the guest.",
          ],
        },
        {
          title: "Check-in and check-out",
          body: [
            "Check-in is from 1:00 pm and check-out is until 12:00 pm. If you need a special time, contact us in advance; availability depends on the hotel's operation.",
          ],
        },
        {
          title: "Rates and taxes",
          body: [
            "Published rates include 19% VAT, except bookings made through Booking.com. Rates may vary depending on availability, season and room type. The final price is confirmed when the booking is processed.",
          ],
        },
        {
          title: "Capacity",
          body: [
            "Each room has a stated maximum capacity. The number of guests may not exceed it without the hotel's authorization.",
          ],
        },
        {
          title: "Cancellations and changes",
          body: [
            "You can cancel or change a booking at no cost up to 24 hours before arrival, provided you did not choose a non-refundable promotional rate. Outside that period, the first night may be retained.",
            "If you booked directly with Hotel Boston, contact us by email or phone. If you booked through a third-party site, changes must be handled through that same channel.",
          ],
        },
        {
          title: "Early departure",
          body: [
            "If you need to leave before your scheduled date, notify us by email at least 24 hours before your new departure date so that no extra night is charged. The request will be documented in writing.",
          ],
        },
        {
          title: "No-show",
          body: [
            "If you do not arrive and do not cancel the booking, the first night plus taxes will be charged.",
          ],
        },
        {
          title: "Payment methods",
          body: [
            "We accept credit cards (no instalments), debit cards, cash and bank transfers.",
          ],
        },
        {
          title: "Pets and smoking",
          body: [
            "Pets are not allowed, except assistance animals with their certification. Smoking is not allowed inside the hotel; ask about designated areas.",
          ],
        },
        {
          title: "Event rooms",
          body: [
            "Availability of event rooms, capacities, equipment, catering and rates is confirmed case by case according to the type of event and the requested date.",
          ],
        },
      ],
      contactTitle: "Questions about these terms",
      contactCopy:
        "Write to hotelbostonreservas@gmail.com or call (33) 225 3197.",
    },
    privacy: {
      eyebrow: "Legal information",
      title: "Privacy policy",
      updated: "Last updated: October 2026",
      intro:
        "At Hotel Boston we handle the personal data of guests and visitors confidentially and only for the purposes necessary to respond to requests and bookings.",
      sections: [
        {
          title: "Data controller",
          body: [
            "Hotel Boston, located at 21 de Mayo 468, Quillota, Chile. For questions about personal data, write to hotelbostonreservas@gmail.com.",
          ],
        },
        {
          title: "Data we collect",
          body: [
            "We may collect your name, email address, phone number, stay dates, room type, number of guests and any requirements you voluntarily provide when submitting a request or contacting us.",
            "We may also receive basic technical browsing data, such as browser type, device and page visited, when we use aggregate measurement tools.",
          ],
        },
        {
          title: "Purposes",
          body: [
            "We use the data to answer enquiries, manage requests and bookings, coordinate payments, provide information about the service and comply with legal obligations.",
            "We do not sell or transfer your data to third parties for advertising purposes.",
          ],
        },
        {
          title: "Legal basis and rights",
          body: [
            "Processing is based on your consent and on the performance of the booking relationship, in accordance with Law No. 19,628 and Law No. 21,719 on personal data protection.",
            "You may request access, rectification, cancellation, objection or portability of your data by writing to hotelbostonreservas@gmail.com. We will respond within the legal deadlines.",
          ],
        },
        {
          title: "Retention",
          body: [
            "We retain data for the time necessary to manage the request or booking and to comply with legal, tax or security obligations.",
          ],
        },
        {
          title: "Service providers",
          body: [
            "To operate the site and communications, we may use technology providers for web hosting, databases, transactional email and messaging. These providers process data on behalf of Hotel Boston and with appropriate security measures.",
          ],
        },
        {
          title: "Cookies and analytics",
          body: [
            "The site may use aggregate, cookie-free measurement to understand page performance. If analytical or advertising cookies are introduced in the future, the corresponding consent will be requested.",
          ],
        },
        {
          title: "Security",
          body: [
            "We apply reasonable security measures to protect information. No system is completely infallible; if a relevant incident occurs, we will act in accordance with applicable law.",
          ],
        },
      ],
      contactTitle: "Exercising your rights",
      contactCopy:
        "To access, correct or delete your data, write to hotelbostonreservas@gmail.com.",
    },
    notFound: {
      eyebrow: "Error 404",
      title: "We could not find this page.",
      copy: "The link may have changed or the page may no longer exist. You can return to the home page.",
      cta: "Back to home",
    },
  },
} as const;

export type UI = (typeof ui)["es"];
