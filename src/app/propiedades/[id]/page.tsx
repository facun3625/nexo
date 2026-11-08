import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { MapPin, MessageCircle, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { InquiryForm } from "@/components/estate/inquiry-form";
import { FavoriteButton } from "@/components/estate/favorite-button";
import { PropertyCard } from "@/components/estate/property-card";
import { PropertyShareButtons } from "@/components/estate/property-share-buttons";
import { VideoPlayer } from "@/components/estate/video-player";
import { PropertyGallery } from "@/components/estate/property-gallery";
import { DevelopmentMapLoader } from "@/components/estate/development-map-loader";
import { money, labels } from "@/lib/estate/modules";
import { toWhatsAppMessageLink } from "@/lib/social-links";
import type { Metadata } from "next";
import { PriceAlertButton } from "@/components/estate/price-alert-button";
import { jsonLdScript, propertyJsonLd, propertySeoDescription, propertySeoTitle, shareImageUrl } from "@/lib/seo";
async function getProperty(id: string) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const property = await prisma.estateProperty.findFirst({
    where: {
      id,
      tenantId: tenant.id,
      published: true,
      listings: { some: { status: "AVAILABLE" } },
    },
    include: {
      media: { orderBy: { position: "asc" } },
      listings: { where: { status: "AVAILABLE" } },
      development: { select: { name: true } },
    },
  });
  if (!property) notFound();
  return property;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const p = await getProperty((await params).id);
  const { storeName } = await getStoreSettings(p.tenantId);
  const title = propertySeoTitle(p);
  const description = propertySeoDescription(p, storeName);
  const path = `/propiedades/${p.id}`;
  const images = p.media[0] ? [{ url: shareImageUrl(p.media[0].id), width: 1200, height: 800, alt: p.title }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: storeName,
      locale: "es_AR",
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      ...(images ? { images: [images[0].url] } : {}),
    },
  };
}
export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const p = await getProperty((await params).id);
  const session = await auth();
  const canEdit =
    session?.user.role === "ADMIN" && session.user.tenantId === p.tenantId;
  const [favorited, related, storeSettings, hdrs] = await Promise.all([
    session?.user
      ? prisma.estatePropertyFavorite
          .findUnique({
            where: {
              userId_propertyId: { userId: session.user.id, propertyId: p.id },
            },
          })
          .then(Boolean)
      : Promise.resolve(false),
    prisma.estateProperty.findMany({
      where: {
        tenantId: p.tenantId,
        id: { not: p.id },
        published: true,
        listings: { some: { status: "AVAILABLE" } },
        OR: [{ city: p.city }, { propertyType: p.propertyType }],
      },
      include: {
        media: { orderBy: { position: "asc" }, take: 1 },
        listings: { where: { status: "AVAILABLE" } },
      },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 4,
    }),
    getStoreSettings(p.tenantId),
    headers(),
  ]);
  const relatedFavoriteIds = session?.user
    ? new Set(
        (
          await prisma.estatePropertyFavorite.findMany({
            where: { userId: session.user.id, propertyId: { in: related.map((r) => r.id) } },
            select: { propertyId: true },
          })
        ).map((f) => f.propertyId),
      )
    : new Set<string>();
  const host = hdrs.get("host");
  const protocol = host?.includes("localhost") || host?.includes("127.0.0.1") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/propiedades/${p.id}`;
  // Sin precio publicado no hay contra qué avisar una baja.
  const priceAlertOffers = p.listings
    .filter((l) => l.showPrice && l.price && Number(l.price) > 0)
    .map((l) => ({
      operation: l.operation,
      label: `${l.temporary ? "Alquiler temporario" : labels[l.operation]}: ${money(l.price!, l.currency)}`,
    }));
  return (
    <div className="public-inner-page public-detail-page flex flex-1 flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(propertyJsonLd(p, storeSettings))} />
      <StoreHero />
      <main className="mx-auto w-full max-w-[1440px] flex-1 bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <Link href="/propiedades" className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground">
            ← Volver a propiedades
          </Link>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {p.propertyType} · {p.code}
              </p>
              <h1 className="mt-2 text-[clamp(1.75rem,5vw,2.5rem)] font-semibold leading-tight text-balance">{p.title}</h1>
              <p className="mt-3 flex min-w-0 items-start gap-2 text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 break-words">{[p.neighborhood, p.city].filter(Boolean).join(", ")}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-start">
              {canEdit && (
                <Link
                  href={`/admin/gestion/propiedades/${p.id}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
                >
                  <Pencil className="size-4" />
                  Editar propiedad
                </Link>
              )}
              <FavoriteButton
                propertyId={p.id}
                initialFavorited={favorited}
                className="static border shadow-none"
              />
            </div>
          </div>
          <div className="mt-4">
            <PropertyShareButtons title={p.title} url={shareUrl} />
          </div>
          <div className="mt-6 grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)] xl:gap-10">
            <div className="min-w-0">
              <PropertyGallery images={p.media.map((m) => ({ id: m.id, url: m.url }))} title={p.title} />
              <div className="my-6 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
                {[
                  ["Dormitorios", p.bedrooms],
                  ["Baños", p.bathrooms],
                  ["Cocheras", p.garages],
                  ...(p.orientation ? [["Orientación", p.orientation]] : []),
                  ...(p.petsPolicy ? [["Mascotas", p.petsPolicy]] : []),
                  ...(p.creditEligible != null ? [["Apto crédito", p.creditEligible ? "Sí" : "No"]] : []),
                  [
                    "Superficie total",
                    p.totalArea ? `${p.totalArea} m²` : "Consultar",
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-xl border p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              {p.coveredArea && (
                <p className="mb-4 text-sm">
                  Superficie cubierta: {p.coveredArea.toString()} m²
                </p>
              )}
              <h2 className="text-xl font-semibold">Sobre esta propiedad</h2>
              <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-muted-foreground">
                {p.description ||
                  "Contactanos para conocer todos los detalles."}
              </p>
              {p.floorPlanUrl && (
                <section className="mt-6 space-y-3">
                  <h2 className="text-xl font-semibold">Plano de la propiedad</h2>
                  <a href={p.floorPlanUrl} target="_blank" rel="noreferrer" className="block text-sm font-medium text-primary underline underline-offset-4">
                    {p.floorPlanUrl.endsWith(".pdf") ? "Ver plano en PDF" : (
                      <Image src={p.floorPlanUrl} alt={`Plano de ${p.title}`} width={1200} height={900} className="max-h-[600px] w-full rounded-xl border object-contain" />
                    )}
                  </a>
                </section>
              )}
              {p.videoUrl && (
                <div className="mt-6">
                  <VideoPlayer url={p.videoUrl} />
                </div>
              )}
              {p.latitude && p.longitude && (
                <section className="mt-6 space-y-3">
                  <h2 className="text-xl font-semibold">Ubicación</h2>
                  <div className="relative z-0 isolate h-64 overflow-hidden rounded-xl border">
                    <DevelopmentMapLoader
                      latitude={Number(p.latitude)}
                      longitude={Number(p.longitude)}
                      name={p.title}
                      address={[p.neighborhood, p.city].filter(Boolean).join(", ")}
                    />
                  </div>
                </section>
              )}
              {p.development && (
                <p className="mt-5 text-sm">
                  Obra: {p.development.name}
                </p>
              )}
            </div>
            <aside className="h-fit rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:sticky lg:top-20">
              <div className="mb-6 space-y-4">
                {p.listings.map((l) => (
                  <div key={l.id}>
                    <p className="text-sm text-muted-foreground">
                      {l.temporary ? "Alquiler temporario" : labels[l.operation]}
                    </p>
                    <p className="text-2xl font-semibold">
                      {l.price && l.showPrice
                        ? money(l.price, l.currency)
                        : "Consultar precio"}
                    </p>
                    {l.operation === "RENT" && l.price && l.showPrice && (
                      <p className="text-xs text-muted-foreground">
                        {l.temporary ? "Importe por día" : "Importe mensual"}
                      </p>
                    )}
                    {l.whatsapp && (
                      <a
                        href={toWhatsAppMessageLink(
                          l.whatsapp,
                          `Hola! Te escribo por "${p.title}" (${p.code}) — ${l.temporary ? "alquiler temporario" : labels[l.operation]}.`,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700"
                      >
                        <MessageCircle className="size-3.5" />
                        Consultar por WhatsApp
                      </a>
                    )}
                  </div>
                ))}
              </div>
              {priceAlertOffers.length > 0 && (
                <div className="mb-4">
                  <PriceAlertButton propertyId={p.id} offers={priceAlertOffers} />
                </div>
              )}
              <InquiryForm propertyId={p.id} />
            </aside>
          </div>
          {related.length > 0 && (
            <div className="mt-12 border-t pt-8">
              <h2 className="text-xl font-semibold">Propiedades relacionadas</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((r) => (
                  <PropertyCard
                    key={r.id}
                    property={r}
                    favorited={relatedFavoriteIds.has(r.id)}
                    badgeColor={storeSettings.badgeColor}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
