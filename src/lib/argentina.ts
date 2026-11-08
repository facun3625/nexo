// Las 24 provincias de Argentina (23 provincias + CABA), para el select de
// provincia en el alta de tienda y en configuración — así nadie escribe
// "Bs As" de mil formas distintas.
export const ARGENTINA_PROVINCES = [
  "Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Ciudad Autónoma de Buenos Aires",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

// Rubros del negocio — orientado a lo que la plataforma ya sirve mejor
// (gastronomía, cercanía), con una salida genérica para el resto.
export const BUSINESS_CATEGORIES = ["Inmobiliaria", "Corredor/a inmobiliario/a", "Administración de alquileres", "Administración de consorcios", "Desarrolladora inmobiliaria", "Otro"] as const;

// Cómo llegó a registrarse — dato de crecimiento, no algo que se le muestre
// a nadie más. Coincide con lo que ya existe: si vino con un código de
// revendedor no hace falta preguntarle (se detecta solo), esto es para
// cuando NO usó un código pero igual sabe cómo llegó.
export const REFERRAL_SOURCES = [
  "Instagram",
  "Google",
  "Un revendedor",
  "Me lo recomendó alguien",
  "Ya tenía otra inmobiliaria con Urbi",
  "Otro",
] as const;
