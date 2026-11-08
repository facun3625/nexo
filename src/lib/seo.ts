import { SITE_URL, absoluteUrl } from "@/lib/site-url";
import type { StoreSettings } from "@/lib/settings";
import { toFacebookLink, toInstagramLink, toYoutubeLink } from "@/lib/social-links";

type Listing = { operation: string; price: { toString(): string } | null; currency: string; showPrice: boolean; temporary: boolean };

export type SeoProperty = {
  id: string;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  propertyType: string;
  city: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  coveredArea: { toString(): string } | null;
  totalArea: { toString(): string } | null;
  updatedAt: Date;
  createdAt: Date;
  listings: Listing[];
  media: { id: string; url: string }[];
};

// «USD 90.000» / «ARS 450.000»: más corto que el formato de moneda y es
// como se busca en Google.
function shortPrice(value: { toString(): string }, currency: string) {
  return `${currency} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Number(value))}`;
}

const operationText = (l: Listing) =>
  l.operation === "SALE" ? "venta" : l.temporary ? "alquiler temporario" : "alquiler";

// Texto plano de la descripción (puede venir con HTML del editor).
export function plainText(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

function place(p: Pick<SeoProperty, "neighborhood" | "city">) {
  return [p.neighborhood, p.city].map((s) => s.trim()).filter(Boolean).join(", ");
}

// «Departamento 1 dormitorio en venta en Candioti Norte, Santa Fe · USD 90.000»
// Es lo que la gente escribe en Google, así el título trabaja de palabra clave.
export function propertySeoTitle(p: SeoProperty) {
  if (p.seoTitle.trim()) return p.seoTitle.trim();
  const ops = [...new Set(p.listings.map(operationText))];
  const rooms = p.bedrooms > 0 ? ` ${p.bedrooms} ${p.bedrooms === 1 ? "dormitorio" : "dormitorios"}` : "";
  const where = place(p);
  const priced = p.listings.find((l) => l.showPrice && l.price && Number(l.price) > 0);
  return [
    `${p.propertyType || "Propiedad"}${rooms}`,
    ops.length ? ` en ${ops.join(" y ")}` : "",
    where ? ` en ${where}` : "",
    priced ? ` · ${shortPrice(priced.price!, priced.currency)}` : "",
  ].join("");
}

export function propertySeoDescription(p: SeoProperty, storeName: string) {
  if (p.seoDescription.trim()) return p.seoDescription.trim();
  const text = plainText(p.description);
  if (text.length >= 60) return truncate(text, 160);
  const facts = [
    p.bedrooms ? `${p.bedrooms} dorm.` : "",
    p.bathrooms ? `${p.bathrooms} baño${p.bathrooms === 1 ? "" : "s"}` : "",
    p.coveredArea ? `${Number(p.coveredArea)} m² cubiertos` : p.totalArea ? `${Number(p.totalArea)} m²` : "",
  ].filter(Boolean);
  return truncate(
    [text || p.title, facts.join(", "), `Consultá con ${storeName}.`].filter(Boolean).join(". ").replace(/\.\./g, "."),
    160,
  );
}

// Foto para compartir: JPG 1200×800 (WhatsApp/Facebook no siempre muestran WEBP).
export function shareImageUrl(mediaId: string) {
  return `${SITE_URL}/api/email/picture/${mediaId}`;
}

const SCHEMA_TYPE: Record<string, string> = {
  departamento: "Apartment",
  casa: "House",
  ph: "House",
  duplex: "House",
  dúplex: "House",
};

export function propertyJsonLd(p: SeoProperty, store: StoreSettings) {
  const url = absoluteUrl(`/propiedades/${p.id}`);
  const offers = p.listings.map((l) => ({
    "@type": "Offer",
    url,
    businessFunction: l.operation === "SALE" ? "http://purl.org/goodrelations/v1#Sell" : "http://purl.org/goodrelations/v1#LeaseOut",
    ...(l.showPrice && l.price && Number(l.price) > 0 ? { price: Number(l.price), priceCurrency: l.currency } : {}),
    availability: "https://schema.org/InStock",
    seller: { "@type": "RealEstateAgent", name: store.storeName, url: SITE_URL },
  }));
  const residenceType = SCHEMA_TYPE[p.propertyType.trim().toLowerCase()] ?? "Accommodation";
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    url,
    name: propertySeoTitle(p),
    description: propertySeoDescription(p, store.storeName),
    datePosted: p.createdAt.toISOString(),
    dateModified: p.updatedAt.toISOString(),
    image: p.media.slice(0, 8).map((m) => absoluteUrl(m.url)),
    offers: offers.length === 1 ? offers[0] : offers,
    about: {
      "@type": residenceType,
      name: p.title,
      ...(p.bedrooms ? { numberOfBedrooms: p.bedrooms, numberOfRooms: p.bedrooms + 1 } : {}),
      ...(p.bathrooms ? { numberOfBathroomsTotal: p.bathrooms } : {}),
      ...(p.coveredArea || p.totalArea
        ? { floorSize: { "@type": "QuantitativeValue", value: Number(p.coveredArea ?? p.totalArea), unitCode: "MTK" } }
        : {}),
      address: {
        "@type": "PostalAddress",
        addressLocality: p.city,
        ...(p.neighborhood ? { streetAddress: p.neighborhood } : {}),
        ...(store.province ? { addressRegion: store.province } : {}),
        addressCountry: "AR",
      },
    },
  };
}

export function organizationJsonLd(store: StoreSettings) {
  const sameAs = [
    store.instagram && toInstagramLink(store.instagram),
    store.facebook && toFacebookLink(store.facebook),
    store.youtube && toYoutubeLink(store.youtube),
  ].filter((v): v is string => Boolean(v));
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${SITE_URL}/#organizacion`,
    name: store.storeName,
    url: SITE_URL,
    ...(store.logoUrl ? { logo: absoluteUrl(store.logoUrl), image: absoluteUrl(store.logoUrl) } : {}),
    ...(store.phone ? { telephone: store.phone } : {}),
    ...(store.email ? { email: store.email } : {}),
    ...(store.address || store.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(store.address ? { streetAddress: store.address } : {}),
            ...(store.city ? { addressLocality: store.city } : {}),
            ...(store.province ? { addressRegion: store.province } : {}),
            addressCountry: "AR",
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

// <script type="application/ld+json">: se escapa "<" para que un texto de
// la descripción no pueda cerrar el script.
export function jsonLdScript(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
