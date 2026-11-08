// Plantillas de email marketing. Sin "server-only": el editor del panel usa
// el mismo render para la vista previa en vivo, así lo que se ve es
// exactamente lo que llega.

export type MailItem = {
  kind: "property" | "development";
  id: string;
  title: string;
  url: string;
  imageUrl: string | null;
  price: string | null;
  operation: string | null;
  location: string;
  features: string[];
  excerpt: string;
  code?: string;
};

export type MailTemplateId = "cliente" | "novedades" | "destacada" | "oportunidades" | "obras";

export type MailContent = {
  template: MailTemplateId;
  subject: string;
  heading: string;
  intro: string;
  items: MailItem[];
  ctaLabel: string;
  ctaUrl: string;
  signature: string;
};

export type MailBrand = {
  storeName: string;
  logoUrl: string | null;
  color: string;
  siteUrl: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  instagram: string | null;
};

type TemplateDef = {
  id: MailTemplateId;
  name: string;
  description: string;
  itemKind: "property" | "development";
  layout: "featured" | "cards";
  badge: string | null;
  defaults: (storeName: string) => { subject: string; heading: string; intro: string; ctaLabel: string };
};

export const MAIL_TEMPLATES: TemplateDef[] = [
  {
    id: "cliente",
    name: "Para un cliente",
    description: "Le mandás una o varias propiedades a una persona, con saludo personal.",
    itemKind: "property",
    layout: "featured",
    badge: null,
    defaults: () => ({
      subject: "Te comparto esta propiedad",
      heading: "Una propiedad que puede interesarte",
      intro: "Hola {{nombre}}, te paso la información de esta propiedad que creemos que puede interesarte. Cualquier consulta, respondé este mail o escribinos por WhatsApp.",
      ctaLabel: "Ver más propiedades",
    }),
  },
  {
    id: "novedades",
    name: "Novedades",
    description: "Las últimas propiedades que ingresaron.",
    itemKind: "property",
    layout: "cards",
    badge: "Nueva",
    defaults: (storeName) => ({
      subject: `Novedades de ${storeName}`,
      heading: "Nuevas propiedades para vos",
      intro: "Hola {{nombre}}, estas son las últimas propiedades que sumamos. Si alguna te interesa, respondé este mail y te contactamos.",
      ctaLabel: "Ver todas las propiedades",
    }),
  },
  {
    id: "destacada",
    name: "Propiedad destacada",
    description: "Una propiedad en grande, con todos sus datos.",
    itemKind: "property",
    layout: "featured",
    badge: "Destacada",
    defaults: () => ({
      subject: "Una propiedad que tenés que ver",
      heading: "Propiedad destacada",
      intro: "Hola {{nombre}}, queremos mostrarte esta propiedad que acaba de llegar.",
      ctaLabel: "Ver más propiedades",
    }),
  },
  {
    id: "oportunidades",
    name: "Oportunidades",
    description: "Precios para aprovechar, con el precio bien visible.",
    itemKind: "property",
    layout: "cards",
    badge: "Oportunidad",
    defaults: () => ({
      subject: "Oportunidades de la semana",
      heading: "Oportunidades que no te podés perder",
      intro: "Hola {{nombre}}, seleccionamos estas propiedades con precios para aprovechar.",
      ctaLabel: "Ver todas las oportunidades",
    }),
  },
  {
    id: "obras",
    name: "Obras / emprendimientos",
    description: "Proyectos y obras, con su avance y ubicación.",
    itemKind: "development",
    layout: "cards",
    badge: null,
    defaults: () => ({
      subject: "Conocé nuestras obras",
      heading: "Nuestras obras",
      intro: "Hola {{nombre}}, te contamos en qué estamos trabajando.",
      ctaLabel: "Ver todas las obras",
    }),
  },
];

export function templateDef(id: string) {
  return MAIL_TEMPLATES.find((t) => t.id === id) ?? MAIL_TEMPLATES[0];
}

export const MAX_MAIL_ITEMS = 12;

export const CAMPAIGN_STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  SENDING: { label: "Enviando…", variant: "outline" },
  SENT: { label: "Enviado", variant: "default" },
  FAILED: { label: "Falló", variant: "destructive" },
};

function esc(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function paragraphs(text: string, style: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="${style}">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// "Hola {{nombre}}," sin nombre queda "Hola,".
export function applyNameToken(text: string, name: string | null | undefined) {
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  return text
    .replaceAll("{{nombre}}", first)
    .replace(/ +([,.!?])/g, "$1")
    .replace(/ {2,}/g, " ");
}

function safeUrl(url: string, fallback: string) {
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : fallback;
}

const FONT = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
const INK = "#1f2933";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

function button(label: string, url: string, color: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:10px;background:${color};">
<a href="${esc(url)}" target="_blank" style="display:inline-block;padding:12px 22px;${FONT}font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${esc(label)}</a>
</td></tr></table>`;
}

function featureLine(item: MailItem) {
  if (item.features.length === 0) return "";
  return `<p style="margin:8px 0 0;${FONT}font-size:13px;color:${MUTED};">${item.features.map(esc).join(" &nbsp;·&nbsp; ")}</p>`;
}

function badgeHtml(text: string, color: string) {
  return `<span style="display:inline-block;margin-bottom:8px;padding:3px 9px;border-radius:999px;background:${color};${FONT}font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#ffffff;">${esc(text)}</span>`;
}

function itemCard(item: MailItem, brand: MailBrand, opts: { large: boolean; badge: string | null }) {
  const image = item.imageUrl
    ? `<a href="${esc(item.url)}" target="_blank"><img src="${esc(item.imageUrl)}" alt="${esc(item.title)}" width="${opts.large ? 600 : 536}" style="display:block;width:100%;max-width:100%;height:auto;border:0;${opts.large ? "" : "border-radius:12px 12px 0 0;"}"></a>`
    : "";
  const price = item.price
    ? `<p style="margin:10px 0 0;${FONT}font-size:${opts.large ? 22 : 18}px;font-weight:700;color:${brand.color};">${esc(item.price)}${item.operation ? `<span style="font-size:13px;font-weight:500;color:${MUTED};"> &nbsp;${esc(item.operation)}</span>` : ""}</p>`
    : item.operation
      ? `<p style="margin:10px 0 0;${FONT}font-size:13px;color:${MUTED};">${esc(item.operation)}</p>`
      : "";
  const body = `
${opts.badge ? badgeHtml(opts.badge, brand.color) : ""}
<p style="margin:0;${FONT}font-size:${opts.large ? 22 : 17}px;line-height:1.3;font-weight:700;color:${INK};"><a href="${esc(item.url)}" target="_blank" style="color:${INK};text-decoration:none;">${esc(item.title)}</a></p>
${item.location ? `<p style="margin:4px 0 0;${FONT}font-size:13px;color:${MUTED};">${esc(item.location)}${item.code ? ` · Cód. ${esc(item.code)}` : ""}</p>` : ""}
${price}
${featureLine(item)}
${item.excerpt ? `<p style="margin:12px 0 0;${FONT}font-size:14px;line-height:1.6;color:#374151;">${esc(item.excerpt)}</p>` : ""}
<div style="margin-top:16px;">${button(item.kind === "property" ? "Ver la propiedad" : "Ver la obra", item.url, brand.color)}</div>`;

  if (opts.large) {
    return `<tr><td style="padding:0;">${image}</td></tr><tr><td style="padding:24px 32px 8px;">${body}</td></tr>`;
  }
  return `<tr><td style="padding:12px 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${BORDER};border-radius:12px;">
<tr><td style="padding:0;">${image}</td></tr>
<tr><td style="padding:18px 20px 20px;">${body}</td></tr>
</table></td></tr>`;
}

export function renderMarketingEmail(
  content: MailContent,
  brand: MailBrand,
  opts: { recipientName?: string | null; unsubscribeUrl?: string | null } = {},
) {
  const def = templateDef(content.template);
  const intro = applyNameToken(content.intro, opts.recipientName);
  const heading = applyNameToken(content.heading, opts.recipientName);
  const items = content.items.slice(0, MAX_MAIL_ITEMS);
  const ctaUrl = safeUrl(content.ctaUrl, brand.siteUrl);

  const header = brand.logoUrl
    ? `<img src="${esc(brand.logoUrl)}" alt="${esc(brand.storeName)}" height="44" style="display:block;height:44px;width:auto;border:0;">`
    : `<span style="${FONT}font-size:20px;font-weight:700;color:${INK};">${esc(brand.storeName)}</span>`;

  const rows = items
    .map((item, i) =>
      itemCard(item, brand, {
        large: def.layout === "featured" && i === 0,
        badge: def.layout === "featured" ? (i === 0 ? def.badge : null) : def.badge,
      }),
    )
    .join("");

  const contact = [
    brand.phone ? esc(brand.phone) : null,
    brand.whatsapp ? `<a href="https://wa.me/${esc(brand.whatsapp.replace(/[^\d]/g, ""))}" style="color:${MUTED};">WhatsApp</a>` : null,
    brand.email ? `<a href="mailto:${esc(brand.email)}" style="color:${MUTED};">${esc(brand.email)}</a>` : null,
    brand.instagram ? `<a href="https://instagram.com/${esc(brand.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, ""))}" style="color:${MUTED};">Instagram</a>` : null,
  ].filter(Boolean);

  const signature = content.signature.trim()
    ? paragraphs(content.signature, `margin:0 0 4px;${FONT}font-size:14px;line-height:1.6;color:#374151;`)
    : "";

  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(content.subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(intro.slice(0, 140))}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f4f6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="padding:22px 32px;border-bottom:3px solid ${brand.color};"><a href="${esc(brand.siteUrl)}" target="_blank" style="text-decoration:none;">${header}</a></td></tr>
<tr><td style="padding:28px 32px 8px;">
${heading.trim() ? `<h1 style="margin:0 0 12px;${FONT}font-size:26px;line-height:1.25;color:${INK};">${esc(heading)}</h1>` : ""}
${paragraphs(intro, `margin:0 0 12px;${FONT}font-size:15px;line-height:1.65;color:#374151;`)}
</td></tr>
${rows}
${content.ctaLabel.trim() ? `<tr><td align="center" style="padding:20px 32px 8px;">${button(content.ctaLabel, ctaUrl, brand.color)}</td></tr>` : ""}
${signature ? `<tr><td style="padding:20px 32px 4px;">${signature}</td></tr>` : ""}
<tr><td style="padding:24px 32px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${BORDER};padding-top:18px;${FONT}font-size:12px;line-height:1.6;color:${MUTED};">
<strong style="color:${INK};">${esc(brand.storeName)}</strong>${brand.address ? `<br>${esc(brand.address)}` : ""}
${contact.length ? `<br>${contact.join(" &nbsp;·&nbsp; ")}` : ""}
${opts.unsubscribeUrl ? `<br><br>Recibís este mail porque te suscribiste o consultaste en ${esc(brand.storeName)}. <a href="${esc(opts.unsubscribeUrl)}" style="color:${MUTED};">Darme de baja</a>` : ""}
</td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}
