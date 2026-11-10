import { cache } from "react";
import { mergeArqConfig, type ArqConfig } from "@/lib/arquitectura";
import { prisma } from "@/lib/prisma";
import { WHATSAPP_TEMPLATE_IDS, WHATSAPP_TEMPLATES, type WhatsappTemplates } from "@/lib/whatsapp-templates";

export type StoreSettings = {
  storeName: string;
  logoUrl: string | null;
  footerLogoUrl: string | null;
  coverUrl: string | null;
  // Video de la portada del Inicio (MP4). Si hay, reemplaza a la foto, que
  // queda como imagen de espera mientras carga.
  coverVideoUrl: string | null;
  faviconUrl: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  addToCartLabel: string;
  footerTagline: string;
  footerPitchTitle: string;
  footerPitchText: string;
  template: string;
  hasServices: boolean;
  // Sección Arquitectura (Equipo / Servicios / Obras): se prende y apaga
  // desde Página web → Arquitectura. Apagada, no aparece en el menú ni en
  // el Inicio y sus páginas dan 404 al público.
  showArquitectura: boolean;
  // Nombre de la sección, páginas visibles y bloque del Inicio.
  arq: ArqConfig;
  // Hay obras publicadas Y la sección Arquitectura está visible.
  hasDevelopments: boolean;
  headerBgColor: string;
  menuBgColor: string;
  footerBgColor: string;
  buttonColor: string;
  badgeColor: string;
  showNameInHeader: boolean;
  logoHeight: number;
  footerLogoHeight: number;
  // Formulario "Recibí novedades por mail" arriba del pie del sitio.
  newsletterSignup: boolean;
};

const DEFAULT_STORE_NAME = "Pedidos";
const DEFAULT_ADD_TO_CART_LABEL = "Agregar";
// HTML, no texto plano: estos dos se editan con RichTextEditor (ver
// footer-form.tsx) y se muestran con RichText, que ya sanitiza el HTML.
const DEFAULT_FOOTER_TAGLINE =
  "<p>Gestionamos tu búsqueda, venta o alquiler con seriedad, confianza y resultados reales.</p>";
const DEFAULT_FOOTER_PITCH_TITLE = "¿Desea vender o alquilar?";
const DEFAULT_FOOTER_PITCH_TEXT =
  "<p>Contamos con un equipo especializado y amplio conocimiento del mercado, listo para ayudarte a vender, alquilar o encontrar tu próxima propiedad.</p>";
export const DEFAULT_STORE_TEMPLATE = "clasico";
// Mismos valores que ya estaban hardcodeados en el sitio (--foreground y
// --primary de globals.css) — así un tenant que nunca toca "Identidad" ve
// exactamente el mismo look de siempre.
export const DEFAULT_HEADER_BG_COLOR = "#3d3d3d";
export const DEFAULT_MENU_BG_COLOR = "#1e658c";
export const DEFAULT_FOOTER_BG_COLOR = "#3d3d3d";
export const DEFAULT_BUTTON_COLOR = "#1e658c";
export const DEFAULT_BADGE_COLOR = "#1e658c";
export const DEFAULT_LOGO_HEIGHT = 64;
export const MIN_LOGO_HEIGHT = 32;
export const MAX_LOGO_HEIGHT = 120;
export const DEFAULT_FOOTER_LOGO_HEIGHT = 56;

const SETTINGS_KEYS = [
  "store_name",
  "store_logo_url",
  "store_footer_logo_url",
  "store_cover_url",
  "store_cover_video_url",
  "store_favicon_url",
  "store_address",
  "store_city",
  "store_province",
  "store_phone",
  "store_email",
  "store_whatsapp",
  "store_instagram",
  "store_facebook",
  "store_youtube",
  "store_add_to_cart_label",
  "store_footer_tagline",
  "store_footer_pitch_title",
  "store_footer_pitch_text",
  "store_template",
  "store_header_bg_color",
  "store_menu_bg_color",
  "store_footer_bg_color",
  "store_button_color",
  "store_badge_color",
  "store_show_name_in_header",
  "store_logo_height",
  "store_footer_logo_height",
  "newsletter_signup",
  "arq_enabled",
  "arq_config",
] as const;

function parseArqConfig(value: string | undefined): ArqConfig {
  try {
    return mergeArqConfig(value ? JSON.parse(value) : null);
  } catch {
    return mergeArqConfig(null);
  }
}

export const getStoreSettings = cache(
  async (tenantId: string): Promise<StoreSettings> => {
    const [rows, developmentCount] = await Promise.all([
      prisma.settings.findMany({
        where: { tenantId, key: { in: [...SETTINGS_KEYS] } },
      }),
      prisma.estateDevelopment.count({ where: { tenantId, published: true } }),
    ]);
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      storeName: map.store_name || DEFAULT_STORE_NAME,
      logoUrl: map.store_logo_url || null,
      footerLogoUrl: map.store_footer_logo_url || null,
      coverUrl: map.store_cover_url || null,
      coverVideoUrl: map.store_cover_video_url || null,
      faviconUrl: map.store_favicon_url || null,
      address: map.store_address || null,
      city: map.store_city || null,
      province: map.store_province || null,
      phone: map.store_phone || null,
      email: map.store_email || null,
      whatsapp: map.store_whatsapp || null,
      instagram: map.store_instagram || null,
      facebook: map.store_facebook || null,
      youtube: map.store_youtube || null,
      addToCartLabel: map.store_add_to_cart_label || DEFAULT_ADD_TO_CART_LABEL,
      footerTagline: map.store_footer_tagline || DEFAULT_FOOTER_TAGLINE,
      footerPitchTitle:
        map.store_footer_pitch_title || DEFAULT_FOOTER_PITCH_TITLE,
      footerPitchText: map.store_footer_pitch_text || DEFAULT_FOOTER_PITCH_TEXT,
      template: map.store_template || DEFAULT_STORE_TEMPLATE,
      hasServices: false,
      showArquitectura: map.arq_enabled === "true",
      arq: parseArqConfig(map.arq_config),
      hasDevelopments: map.arq_enabled === "true" && developmentCount > 0,
      headerBgColor: map.store_header_bg_color || DEFAULT_HEADER_BG_COLOR,
      menuBgColor: map.store_menu_bg_color || DEFAULT_MENU_BG_COLOR,
      footerBgColor: map.store_footer_bg_color || DEFAULT_FOOTER_BG_COLOR,
      buttonColor: map.store_button_color || DEFAULT_BUTTON_COLOR,
      badgeColor: map.store_badge_color || DEFAULT_BADGE_COLOR,
      showNameInHeader: map.store_show_name_in_header !== "false",
      logoHeight: Math.min(
        MAX_LOGO_HEIGHT,
        Math.max(
          MIN_LOGO_HEIGHT,
          Number(map.store_logo_height) || DEFAULT_LOGO_HEIGHT,
        ),
      ),
      footerLogoHeight: Math.min(
        MAX_LOGO_HEIGHT,
        Math.max(
          MIN_LOGO_HEIGHT,
          Number(map.store_footer_logo_height) || DEFAULT_FOOTER_LOGO_HEIGHT,
        ),
      ),
      newsletterSignup: map.newsletter_signup !== "off",
    };
  },
);

// ---------- SEO ----------

export type SeoSettings = {
  title: string | null;
  description: string | null;
  ogImageUrl: string | null;
};

const SEO_SETTINGS_KEYS = [
  "seo_title",
  "seo_description",
  "seo_og_image_url",
] as const;

export const getSeoSettings = cache(
  async (tenantId: string): Promise<SeoSettings> => {
    const rows = await prisma.settings.findMany({
      where: { tenantId, key: { in: [...SEO_SETTINGS_KEYS] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return {
      title: map.seo_title || null,
      description: map.seo_description || null,
      ogImageUrl: map.seo_og_image_url || null,
    };
  },
);

// ---------- Telegram (aviso al equipo) ----------

export type TelegramSettings = {
  configured: boolean;
  botToken: string | null;
  chatId: string | null;
};

const TELEGRAM_SETTINGS_KEYS = [
  "telegram_bot_token",
  "telegram_chat_id",
] as const;

export const getTelegramSettings = cache(
  async (tenantId: string): Promise<TelegramSettings> => {
    const rows = await prisma.settings.findMany({
      where: { tenantId, key: { in: [...TELEGRAM_SETTINGS_KEYS] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const botToken = map.telegram_bot_token || null;
    const chatId = map.telegram_chat_id || null;
    return {
      configured: Boolean(botToken && chatId),
      botToken,
      chatId,
    };
  },
);

// ---------- Agente de ventas IA ----------

export type AiAssistantSettings = {
  enabled: boolean;
  provider: "openai" | "gemini" | null;
  apiKey: string | null;
  model: string | null;
  name: string;
  welcomeMessage: string;
  instructions: string | null;
  humanDays: number[];
  humanStartTime: string;
  humanEndTime: string;
};

export const DEFAULT_AI_ASSISTANT_NAME = "Asistente virtual";
export const DEFAULT_AI_WELCOME_MESSAGE =
  "¡Hola! Contame qué propiedad estás buscando (zona, tipo, presupuesto) y te ayudo a encontrar opciones.";
export const DEFAULT_AI_HUMAN_DAYS = [1, 2, 3, 4, 5, 6];
export const DEFAULT_AI_HUMAN_START_TIME = "09:00";
export const DEFAULT_AI_HUMAN_END_TIME = "18:00";

const AI_SETTINGS_KEYS = [
  "ai_assistant_enabled",
  "ai_provider",
  "ai_api_key",
  "ai_model",
  "ai_assistant_name",
  "ai_welcome_message",
  "ai_instructions",
  "ai_human_days",
  "ai_human_start_time",
  "ai_human_end_time",
] as const;

export const getAiAssistantSettings = cache(
  async (tenantId: string): Promise<AiAssistantSettings> => {
    const rows = await prisma.settings.findMany({
      where: { tenantId, key: { in: [...AI_SETTINGS_KEYS] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const provider = map.ai_provider === "openai" || map.ai_provider === "gemini" ? map.ai_provider : null;
    const humanDays = map.ai_human_days
      ? map.ai_human_days
          .split(",")
          .map((d) => Number(d))
          .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
      : DEFAULT_AI_HUMAN_DAYS;
    return {
      enabled: map.ai_assistant_enabled === "true",
      provider,
      apiKey: map.ai_api_key || null,
      model: map.ai_model || null,
      name: map.ai_assistant_name || DEFAULT_AI_ASSISTANT_NAME,
      welcomeMessage: map.ai_welcome_message || DEFAULT_AI_WELCOME_MESSAGE,
      instructions: map.ai_instructions || null,
      humanDays: humanDays.length ? humanDays : DEFAULT_AI_HUMAN_DAYS,
      humanStartTime: map.ai_human_start_time || DEFAULT_AI_HUMAN_START_TIME,
      humanEndTime: map.ai_human_end_time || DEFAULT_AI_HUMAN_END_TIME,
    };
  },
);

export const getWhatsappTemplates = cache(async (tenantId: string): Promise<WhatsappTemplates> => {
  const rows = await prisma.settings.findMany({
    where: { tenantId, key: { in: WHATSAPP_TEMPLATE_IDS.map((id) => WHATSAPP_TEMPLATES[id].key) } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(
    WHATSAPP_TEMPLATE_IDS.map((id) => [id, map.get(WHATSAPP_TEMPLATES[id].key) || WHATSAPP_TEMPLATES[id].default]),
  ) as WhatsappTemplates;
});
