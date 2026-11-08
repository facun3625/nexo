// Textos de WhatsApp del panel, editables en Configuración → WhatsApp. Sin
// imports de servidor: el formulario del panel también los usa.
export const WHATSAPP_TEMPLATES = {
  matches: {
    key: "whatsapp_template_matches",
    label: "Búsquedas guardadas: coincidencias",
    description: "Se usa en el botón de WhatsApp de cada búsqueda guardada.",
    tokens: {
      "{nombre}": "Nombre de la persona",
      "{inmobiliaria}": "Nombre de la inmobiliaria",
      "{busqueda}": "Lo que pidió en la búsqueda",
      "{propiedades}": "Las propiedades con precio y link (o el aviso de que todavía no hay)",
    },
    default:
      "Hola {nombre}! Te escribo de {inmobiliaria} por la búsqueda que dejaste en la web ({busqueda}).\n\n{propiedades}\n\n¿Te interesa coordinar una visita?",
  },
  priceDrop: {
    key: "whatsapp_template_price_drop",
    label: "Avisarme si baja el precio",
    description: "Se usa en el botón de WhatsApp de la lista de avisos de precio.",
    tokens: {
      "{nombre}": "Nombre de la persona",
      "{inmobiliaria}": "Nombre de la inmobiliaria",
      "{propiedad}": "Título de la propiedad",
      "{precio_anterior}": "Precio cuando pidió el aviso",
      "{precio}": "Precio actual",
      "{link}": "Link a la propiedad",
    },
    default:
      "Hola {nombre}! Te escribo de {inmobiliaria}. Bajó el precio de la propiedad que te interesaba:\n\n{propiedad}\nAntes: {precio_anterior}\nAhora: {precio}\n{link}\n\n¿Te interesa coordinar una visita?",
  },
  qrVisit: {
    key: "whatsapp_template_qr_visit",
    label: "Aperturas de QR",
    description: "Se usa en el botón de WhatsApp de la lista de aperturas de QR.",
    tokens: {
      "{nombre}": "Nombre de la persona",
      "{inmobiliaria}": "Nombre de la inmobiliaria",
      "{propiedad}": "Título de la propiedad",
      "{link}": "Link a la propiedad",
    },
    default:
      "Hola {nombre}! Te escribo de {inmobiliaria}. Vimos que escaneaste el QR de esta propiedad:\n\n{propiedad}\n{link}\n\n¿Querés que te cuente más o coordinamos una visita?",
  },
  aiConversation: {
    key: "whatsapp_template_ai_conversation",
    label: "Conversaciones del asistente IA",
    description: "Se usa en el botón de WhatsApp de las conversaciones del chat.",
    tokens: {
      "{nombre}": "Nombre de la persona (si lo dejó)",
      "{inmobiliaria}": "Nombre de la inmobiliaria",
    },
    default: "Hola {nombre}! Te escribimos por la consulta que hiciste en el chat.",
  },
} as const;

export type WhatsappTemplateId = keyof typeof WHATSAPP_TEMPLATES;
export type WhatsappTemplates = Record<WhatsappTemplateId, string>;
export const WHATSAPP_TEMPLATE_IDS = Object.keys(WHATSAPP_TEMPLATES) as WhatsappTemplateId[];

export function renderWhatsappTemplate(template: string, values: Record<string, string>) {
  return template
    .replace(/\{[a-z_]+\}/g, (token) => values[token.slice(1, -1)] ?? token)
    // Sin nombre cargado queda «Hola !»: se limpia el espacio suelto.
    .replace(/ +([!,.?])/g, "$1");
}
