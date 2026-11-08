// URL pública del sitio (sitemap, canonical, datos estructurados, links en
// mails). Sale de ROOT_DOMAIN — en el VPS es el dominio real.
const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3011";
export const SITE_URL = `${ROOT_DOMAIN.startsWith("localhost") ? "http" : "https"}://${ROOT_DOMAIN}`;

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
