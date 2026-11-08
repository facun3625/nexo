import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { getStoreSettings } from "@/lib/settings";
import { labels, money } from "@/lib/estate/modules";
import type { MailBrand, MailItem } from "@/lib/email-marketing/templates";

import { SITE_URL } from "@/lib/site-url";

export { SITE_URL };

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// ---------- Baja (link firmado, sin tabla de tokens) ----------

function unsubscribeSignature(tenantId: string, email: string) {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "dev-secret")
    .update(`unsubscribe:${tenantId}:${normalizeEmail(email)}`)
    .digest("base64url")
    .slice(0, 32);
}

export function unsubscribeUrl(tenantId: string, email: string) {
  const e = normalizeEmail(email);
  return `${SITE_URL}/baja?e=${encodeURIComponent(e)}&t=${unsubscribeSignature(tenantId, e)}`;
}

export function verifyUnsubscribe(tenantId: string, email: string, token: string) {
  const expected = Buffer.from(unsubscribeSignature(tenantId, email));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

// ---------- Marca ----------

export async function getMailBrand(tenantId: string): Promise<MailBrand> {
  const s = await getStoreSettings(tenantId);
  return {
    storeName: s.storeName,
    // Los clientes de mail (Gmail, Outlook) no muestran SVG ni siempre
    // WEBP: el logo pasa por una ruta que lo entrega en PNG.
    logoUrl: s.logoUrl ? `${SITE_URL}/api/email/logo` : null,
    color: s.buttonColor,
    siteUrl: SITE_URL,
    address: [s.address, s.city].filter(Boolean).join(", ") || null,
    phone: s.phone,
    whatsapp: s.whatsapp,
    email: s.email,
    instagram: s.instagram,
  };
}

// ---------- Propiedades y obras para el armado ----------

function plain(html: string, max: number) {
  const text = html
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text;
}

const area = (v: { toString(): string } | null) => (v != null && Number(v.toString()) > 0 ? Number(v.toString()) : null);

const STAGE_LABELS: Record<string, string> = { PROJECT: "En proyecto", CONSTRUCTION: "En construcción", FINISHED: "Terminada" };

export async function getMailCatalog(tenantId: string): Promise<{ properties: MailItem[]; developments: MailItem[] }> {
  const [properties, developments] = await Promise.all([
    prisma.estateProperty.findMany({
      where: { tenantId, published: true },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        media: { orderBy: { position: "asc" }, take: 1, select: { id: true } },
        listings: { where: { status: "AVAILABLE" }, orderBy: { operation: "desc" } },
      },
    }),
    prisma.estateDevelopment.findMany({
      where: { tenantId, published: true },
      orderBy: { createdAt: "desc" },
      include: { images: { orderBy: { order: "asc" }, take: 1, select: { id: true } } },
    }),
  ]);

  return {
    properties: properties.map((p) => {
      const listing = p.listings[0];
      const covered = area(p.coveredArea);
      const total = area(p.totalArea);
      const features = [
        p.propertyType,
        p.bedrooms ? `${p.bedrooms} dorm.` : null,
        p.bathrooms ? `${p.bathrooms} ${p.bathrooms === 1 ? "baño" : "baños"}` : null,
        covered ? `${covered} m² cub.` : total ? `${total} m²` : null,
        p.garages ? `${p.garages} cochera${p.garages === 1 ? "" : "s"}` : null,
      ].filter((f): f is string => Boolean(f));
      return {
        kind: "property" as const,
        id: p.id,
        title: p.title,
        code: p.code,
        url: `${SITE_URL}/propiedades/${p.id}`,
        imageUrl: p.media[0] ? `${SITE_URL}/api/email/picture/${p.media[0].id}` : null,
        price: listing?.price && listing.showPrice ? money(listing.price, listing.currency) : listing ? "Consultar precio" : null,
        operation: listing
          ? `${listing.temporary ? "Alquiler temporario" : (labels[listing.operation] ?? listing.operation)}${p.listings.length > 1 ? " · también en " + (labels[p.listings[1].operation] ?? "").toLowerCase() : ""}`
          : null,
        location: [p.neighborhood, p.city].filter(Boolean).join(", "),
        features,
        excerpt: plain(p.description, 220),
      };
    }),
    developments: developments.map((d) => ({
      kind: "development" as const,
      id: d.id,
      title: d.name,
      url: `${SITE_URL}/arquitectura/obras/${d.id}`,
      imageUrl: d.images[0] ? `${SITE_URL}/api/email/picture/${d.images[0].id}` : null,
      price: null,
      operation: STAGE_LABELS[d.stage] ?? null,
      location: d.city,
      features: [d.progress != null ? `${d.progress}% de avance` : null, d.estimatedDelivery ? `Entrega: ${d.estimatedDelivery}` : null].filter(
        (f): f is string => Boolean(f),
      ),
      excerpt: plain(d.description, 220),
    })),
  };
}

// ---------- Destinatarios ----------

export type Recipient = { email: string; name: string };

// Suscriptores activos + (opcional) contactos del CRM con mail, sin
// repetidos y sin nadie que se haya dado de baja.
export async function getAudience(tenantId: string, includeContacts: boolean): Promise<Recipient[]> {
  const [subscribers, contacts] = await Promise.all([
    prisma.emailSubscriber.findMany({ where: { tenantId }, select: { email: true, name: true, unsubscribedAt: true } }),
    includeContacts
      ? prisma.estateContact.findMany({
          where: { tenantId, archived: false, email: { not: null } },
          select: { email: true, name: true },
        })
      : Promise.resolve([]),
  ]);
  const optedOut = new Set(subscribers.filter((s) => s.unsubscribedAt).map((s) => normalizeEmail(s.email)));
  const byEmail = new Map<string, Recipient>();
  for (const s of subscribers) {
    const email = normalizeEmail(s.email);
    if (!s.unsubscribedAt) byEmail.set(email, { email, name: s.name });
  }
  for (const c of contacts) {
    const email = normalizeEmail(c.email ?? "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || optedOut.has(email)) continue;
    const existing = byEmail.get(email);
    if (!existing) byEmail.set(email, { email, name: c.name });
    else if (!existing.name) existing.name = c.name;
  }
  return [...byEmail.values()];
}
