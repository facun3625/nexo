// Agrupa el header Referer en fuentes reconocibles — igual de aproximado
// a propósito que user-agent.ts, para no depender de un servicio externo.
const KNOWN_SOURCES: { pattern: RegExp; label: string }[] = [
  { pattern: /google\./i, label: "Google" },
  { pattern: /bing\./i, label: "Bing" },
  { pattern: /instagram\.com/i, label: "Instagram" },
  { pattern: /(facebook\.com|fb\.com|l\.facebook)/i, label: "Facebook" },
  { pattern: /(wa\.me|whatsapp\.com)/i, label: "WhatsApp" },
  { pattern: /(twitter\.com|t\.co|x\.com)/i, label: "Twitter/X" },
  { pattern: /linkedin\.com/i, label: "LinkedIn" },
  { pattern: /tiktok\.com/i, label: "TikTok" },
  { pattern: /urbi\.com\.ar/i, label: "Urbi (interno)" },
];

export function parseTrafficSource(referrer: string | null): string {
  if (!referrer) return "Directo";
  let hostname: string;
  try {
    hostname = new URL(referrer).hostname;
  } catch {
    return "Directo";
  }
  for (const source of KNOWN_SOURCES) {
    if (source.pattern.test(hostname)) return source.label;
  }
  return hostname.replace(/^www\./, "");
}
