import { z } from "zod";

// Bloques editables de /sobre-nosotros debajo del texto principal: las
// tarjetas de "Nuestros valores" y los títulos del cierre "Hablemos" (los
// botones salen del teléfono/WhatsApp/dirección de Contacto). Se guardan en
// Settings ("about_values"). Este archivo no toca la base: lo usa también
// el formulario del panel.
export const ABOUT_VALUES_KEY = "about_values";

// Íconos disponibles para las tarjetas (ver about-value-icon.tsx).
export const ABOUT_VALUE_ICONS = [
  { key: "shield", label: "Escudo" },
  { key: "handshake", label: "Apretón de manos" },
  { key: "eye", label: "Ojo" },
  { key: "users", label: "Personas" },
  { key: "house", label: "Casa" },
  { key: "key", label: "Llave" },
  { key: "building", label: "Edificio" },
  { key: "star", label: "Estrella" },
  { key: "heart", label: "Corazón" },
  { key: "award", label: "Premio" },
  { key: "badge", label: "Sello" },
  { key: "clock", label: "Reloj" },
  { key: "map", label: "Ubicación" },
  { key: "thumbs", label: "Pulgar arriba" },
  { key: "briefcase", label: "Maletín" },
  { key: "chat", label: "Mensaje" },
] as const;
export type AboutValueIcon = (typeof ABOUT_VALUE_ICONS)[number]["key"];
const iconKeys = ABOUT_VALUE_ICONS.map((i) => i.key) as [AboutValueIcon, ...AboutValueIcon[]];

const text = (max: number) => z.string().trim().max(max);

export const aboutValuesSchema = z.object({
  show: z.boolean(),
  eyebrow: text(60),
  title: text(120),
  items: z
    .array(z.object({ icon: z.enum(iconKeys), title: text(80), text: text(400) }))
    .max(8),
  ctaEyebrow: text(60),
  ctaTitle: text(120),
});
export type AboutValues = z.infer<typeof aboutValuesSchema>;

export const ABOUT_VALUES_DEFAULT: AboutValues = {
  show: true,
  eyebrow: "Por qué elegirnos",
  title: "Nuestros valores",
  items: [
    {
      icon: "shield",
      title: "Confianza",
      text: "Operaciones claras, con toda la información disponible desde el primer contacto.",
    },
    {
      icon: "handshake",
      title: "Atención personalizada",
      text: "Te acompañamos en cada paso, desde la búsqueda hasta la firma.",
    },
    {
      icon: "eye",
      title: "Transparencia",
      text: "Sin letra chica: precios, estados y condiciones a la vista.",
    },
    {
      icon: "users",
      title: "Acompañamiento",
      text: "Seguimos disponibles después de la operación, para lo que necesites.",
    },
  ],
  ctaEyebrow: "Hablemos",
  ctaTitle: "¿Querés conocernos mejor?",
};

// Lo guardado pisa a los valores por defecto campo por campo; si algo no
// valida (p. ej. un ícono que ya no existe) se usa el default entero.
export function mergeAboutValues(stored: unknown): AboutValues {
  const raw = stored && typeof stored === "object" ? stored : {};
  const parsed = aboutValuesSchema.safeParse({ ...ABOUT_VALUES_DEFAULT, ...raw });
  return parsed.success ? parsed.data : ABOUT_VALUES_DEFAULT;
}
