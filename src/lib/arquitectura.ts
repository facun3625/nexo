import { z } from "zod";

// Contenido de la sección Arquitectura: desde el panel (Página web →
// Arquitectura) se cargan textos y fotos, y se guardan en Settings
// ("arq_content"). Si la sección se muestra o no en el sitio público lo
// decide "arq_enabled" (apagada si no existe).
// Este archivo no toca la base: lo usa también el formulario del panel.
export const ARQ_SETTINGS_KEY = "arq_content";
export const ARQ_ENABLED_KEY = "arq_enabled";

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

// Arranca vacío: el contenido que venía acá era el del estudio de la
// inmobiliaria de la que se hizo el fork. Se completa desde el panel.
export const ARQ_DEFAULT_CONTENT: ArqContent = {
  equipo: {
    heroImage: "",
    subtitle: "",
    introTitle: "",
    introText: "",
    traitsTitle: "",
    traits: [],
    coverImage: "",
    pillars: [],
    galleryTitle: "",
    gallery: [],
  },
  servicios: {
    heroImage: "",
    subtitle: "",
    services: [],
    collageImage: "",
  },
  obras: {
    heroImage: "",
    subtitle: "",
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
