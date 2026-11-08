import { z } from "zod";

// Contenido de la sección Arquitectura. Los valores por defecto son los que
// se migraron del sitio anterior (gerellicorrenti.com.ar/about y
// /servicios-arq); desde el panel (Página web → Arquitectura) se pueden
// cambiar textos y fotos, y se guardan en Settings ("arq_content").
// Este archivo no toca la base: lo usa también el formulario del panel.
export const ARQ_R2 = "https://pub-f59926e980074152ab17e8fa8e9ffa0a.r2.dev/arquitectura";
export const ARQ_EMAIL = "sergiogerelli@gmail.com";
export const ARQ_SETTINGS_KEY = "arq_content";

export const ARQ_SECTIONS = [
  { href: "/arquitectura/equipo", label: "Equipo" },
  { href: "/arquitectura/servicios", label: "Servicios" },
  { href: "/arquitectura/obras", label: "Obras" },
] as const;

const text = (max: number) => z.string().trim().max(max);
const url = z.string().trim().max(1000);

export const arqContentSchema = z.object({
  equipo: z.object({
    heroImage: url,
    subtitle: text(300),
    introTitle: text(150),
    introText: text(3000),
    traitsTitle: text(100),
    traits: z.array(text(600)).max(20),
    coverImage: url,
    pillars: z.array(z.object({ title: text(100), text: text(1500) })).max(6),
    galleryTitle: text(100),
    gallery: z.array(url).max(40),
  }),
  servicios: z.object({
    heroImage: url,
    subtitle: text(300),
    // body: párrafos separados por una línea en blanco; las líneas que
    // empiezan con "- " se muestran como lista con tildes.
    services: z.array(z.object({ title: text(100), body: text(5000) })).max(12),
    collageImage: url,
  }),
  obras: z.object({
    heroImage: url,
    subtitle: text(300),
  }),
});
export type ArqContent = z.infer<typeof arqContentSchema>;

export const ARQ_DEFAULT_CONTENT: ArqContent = {
  equipo: {
    heroImage: `${ARQ_R2}/equipo-2.webp`,
    subtitle: "Varias generaciones de profesionales integrando inmobiliaria y estudio de arquitectura.",
    introTitle: "Un equipo interdisciplinario",
    introText:
      "Somos un equipo interdisciplinario de varias generaciones de profesionales que integramos Inmobiliaria y Estudio de Arquitectura. Nos dedicamos al diseño integral de proyectos arquitectónicos, dirección, gestión y desarrollos inmobiliarios.",
    traitsTitle: "Nos caracteriza",
    traits: [
      "Amplia experiencia y trayectoria. Lo realizado hasta hoy lo demuestra: buenos negocios inmobiliarios y alta calidad arquitectónica general y de detalles.",
      "Atención especialmente personalizada.",
      "Honestidad y sinceridad: consideramos fundamental generar un vínculo de confianza mutua.",
      "Procuramos respuestas rápidas con soluciones simples, funcionales, eficientes y bien coordinadas.",
    ],
    coverImage: `${ARQ_R2}/equipo-portada.webp`,
    pillars: [
      {
        title: "Arquitectura",
        text: "Nuestros diseños se enriquecen por la complementariedad de las ideas del equipo. Cada nueva obra la pensamos desde las necesidades particulares y expectativas del cliente, atendiendo sobre todo sus preocupaciones y con una acorde relación calidad-precio. El resultado: inmuebles con mucha riqueza espacial y alto nivel de diseño y calidad.",
      },
      {
        title: "Inmobiliaria",
        text: "Fomentamos la relación personalizada basada en la confianza y la transparencia, acompañando y asesorando profesionalmente para lograr con éxito los acuerdos y la conformidad de todas las partes intervinientes.",
      },
      {
        title: "Integración",
        text: "Nace desde el asesoramiento al momento de adquirir un inmueble: estudiamos su potencial, la inversión estimada a realizar y su valorización antes de ejecutar las mejoras. Cuando se busca retorno financiero, analizamos el negocio antes de la compra.",
      },
    ],
    galleryTitle: "Nuestro espacio",
    gallery: [1, 2, 3].map((n) => `${ARQ_R2}/equipo-${n}.webp`),
  },
  servicios: {
    heroImage: `${ARQ_R2}/equipo-3.webp`,
    subtitle: "Te acompañamos en todo el proceso, desde la primera idea hasta la entrega de la obra.",
    services: [
      {
        title: "Asesoramientos",
        body: "Entrevistas sin costo para quienes necesiten definir un emplazamiento o un terreno donde construir.\n\nAnálisis de posibles desarrollos de negocios inmobiliarios, con análisis de inversión y retorno.",
      },
      {
        title: "Anteproyecto",
        body: "El diseño preliminar se fundamenta en entrevistas con el comitente, donde escuchamos lo que necesita y percibimos lo que quiere transmitirnos: sus preocupaciones, que a veces no se verbalizan.\n\nLa propuesta resultante, en gráfica digital en esta instancia, será funcional y estética. La interacción con el cliente irá determinando el diseño definitivo, que lo hará único y especial, a su medida.\n\nSobre esa base se estima la inversión con cómputo y presupuesto a valores reales de plaza, y se analizan posibles etapas de obra si es necesario.",
      },
      {
        title: "Proyecto ejecutivo",
        body: "Abarcamos todas las instancias previas a la ejecución de la obra: planimetrías completas, todas las instalaciones de servicios, detalles constructivos, cálculos estructurales, etc.\n\nDesarrollamos los cómputos de materiales y mano de obra para la posterior gestión de construcción, y las planimetrías y gestiones de permisos de edificación municipal, bomberos, EPE, etc.",
      },
      {
        title: "Dirección de obra",
        body: [
          "A través de nuestra asistencia integral permanente abarcamos:",
          "",
          "- La solicitud de presupuestos de mano de obra y materiales de todos los rubros de la obra.",
          "- El asesoramiento en la gestión de los contratos de cada rubro.",
          "- El control permanente de la calidad de los trabajos, para el buen cumplimiento del proyecto y la durabilidad de la obra en el tiempo.",
          "- La coordinación de los rubros y sus tiempos de ejecución según lo planificado, controlando el avance de cada uno con programas específicos.",
          "- La verificación de los pagos a los contratistas de acuerdo al avance de la obra contratada.",
          "- El acompañamiento en la elección de los materiales y la gestión de su provisión en tiempo y forma.",
        ].join("\n"),
      },
    ],
    collageImage: `${ARQ_R2}/servicios-1.webp`,
  },
  obras: {
    heroImage: `${ARQ_R2}/equipo-2.webp`,
    subtitle: "Proyectos diseñados y dirigidos por el estudio.",
  },
};

// Lo guardado pisa a los valores por defecto sección por sección: si en el
// futuro se agrega un campo nuevo, los tenants que ya guardaron igual lo
// ven con su valor por defecto en vez de romperse.
export function mergeArqContent(stored: unknown): ArqContent {
  const raw = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  const merged = {
    equipo: { ...ARQ_DEFAULT_CONTENT.equipo, ...(raw.equipo as object) },
    servicios: { ...ARQ_DEFAULT_CONTENT.servicios, ...(raw.servicios as object) },
    obras: { ...ARQ_DEFAULT_CONTENT.obras, ...(raw.obras as object) },
  };
  const parsed = arqContentSchema.safeParse(merged);
  return parsed.success ? parsed.data : ARQ_DEFAULT_CONTENT;
}

// Texto de un servicio → bloques para mostrar: párrafos y listas.
export type ArqBlock = { kind: "p"; text: string } | { kind: "list"; items: string[] };
export function parseServiceBody(body: string): ArqBlock[] {
  const blocks: ArqBlock[] = [];
  for (const chunk of body.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    let paragraph: string[] = [];
    const flush = () => {
      if (paragraph.length) blocks.push({ kind: "p", text: paragraph.join(" ") });
      paragraph = [];
    };
    for (const line of lines) {
      const bullet = line.match(/^[-•*]\s+(.*)$/);
      if (bullet) {
        flush();
        const last = blocks[blocks.length - 1];
        if (last?.kind === "list") last.items.push(bullet[1]);
        else blocks.push({ kind: "list", items: [bullet[1]] });
      } else {
        paragraph.push(line);
      }
    }
    flush();
  }
  return blocks;
}
