import Link from "next/link";
import { PhotoBanner } from "@/components/catalog/photo-banner";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  Handshake,
  Eye,
  Users,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { RichText } from "@/components/catalog/rich-text";
import { AboutGallery } from "@/components/catalog/about-gallery";
import { WhatsAppIcon } from "@/components/catalog/social-icons";
import { getCurrentTenant } from "@/lib/tenant";
import { getAboutContent } from "@/lib/about";
import { getStoreSettings } from "@/lib/settings";
import { toWhatsAppLink } from "@/lib/social-links";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Confianza",
    description:
      "Operaciones claras, con toda la información disponible desde el primer contacto.",
  },
  {
    icon: Handshake,
    title: "Atención personalizada",
    description:
      "Te acompañamos en cada paso, desde la búsqueda hasta la firma.",
  },
  {
    icon: Eye,
    title: "Transparencia",
    description: "Sin letra chica: precios, estados y condiciones a la vista.",
  },
  {
    icon: Users,
    title: "Acompañamiento",
    description:
      "Seguimos disponibles después de la operación, para lo que necesites.",
  },
] as const;

export const metadata = {
  title: "Sobre nosotros",
  description: "Conocé a la inmobiliaria: quiénes somos, cómo trabajamos y dónde encontrarnos.",
  alternates: { canonical: "/sobre-nosotros" },
};

export default async function SobreNosotrosPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();

  const [content, settings, properties] = await Promise.all([
    getAboutContent(tenant.id),
    getStoreSettings(tenant.id),
    prisma.estateProperty.findMany({
      where: { tenantId: tenant.id, published: true },
      select: {
        city: true,
        neighborhood: true,
        listings: {
          where: { status: "AVAILABLE" },
          select: { operation: true },
        },
      },
    }),
  ]);
  const { storeName, coverUrl, address, phone, whatsapp } = settings;

  const publishedCount = properties.length;
  const saleCount = properties.filter((p) =>
    p.listings.some((l) => l.operation === "SALE"),
  ).length;
  const rentCount = properties.filter((p) =>
    p.listings.some((l) => l.operation === "RENT"),
  ).length;
  const zonesCount = new Set(
    properties.map((p) => p.neighborhood || p.city).filter(Boolean),
  ).size;
  const hasContactCta = Boolean(phone || whatsapp);

  return (
    <div className="public-inner-page public-content-page flex flex-1 flex-col">
      <StoreHero />

      <PhotoBanner image={coverUrl} eyebrow="Nuestra historia" title={`Sobre ${storeName}`} />

      {(publishedCount > 0 || saleCount > 0 || rentCount > 0) && (
        <section className="bg-primary">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-3 px-2 sm:px-6 lg:px-8">
            {[
              { value: publishedCount, label: "Propiedades publicadas" },
              { value: saleCount, label: "En venta" },
              { value: rentCount, label: "En alquiler" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-1 px-1 py-5 text-center sm:px-3 sm:py-6",
                  i < 2 && "border-r border-white/20",
                )}
              >
                <span className="text-2xl font-bold text-white sm:text-3xl">
                  {stat.value}
                </span>
                <span className="text-[9px] font-medium uppercase leading-4 tracking-wide text-white/70 sm:text-[11px] sm:tracking-widest">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
        <div className="flex flex-col gap-14 px-4 py-12 sm:px-6 lg:gap-16 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              {content.text ? (
                <div
                  className={cn(
                    "text-sm leading-relaxed text-muted-foreground lg:text-base",
                    content.columns && "columns-1 sm:columns-2 sm:gap-8",
                  )}
                >
                  <RichText html={content.text} columns={false} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Todavía no cargamos esta sección.
                </p>
              )}
            </div>

            <div className="relative">
              {coverUrl ? (
                <div className="relative h-72 w-full overflow-hidden rounded-2xl shadow-xl sm:h-96">
                  <Image
                    src={coverUrl}
                    alt={storeName}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-primary/10 sm:h-96">
                  <Building2 className="size-16 text-primary/30" />
                </div>
              )}
              {zonesCount > 0 && (
                <div className="absolute -bottom-5 left-4 max-w-[calc(100%-2rem)] rounded-xl bg-primary px-5 py-3 text-white shadow-lg sm:-left-6 sm:px-6 sm:py-4">
                  <div className="text-2xl font-bold sm:text-3xl">
                    {zonesCount}
                  </div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-widest text-white/70">
                    Zonas donde operamos
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-10 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Por qué elegirnos
              </p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Nuestros valores
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="rounded-2xl border bg-muted/30 p-6 transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/30 hover:bg-card hover:shadow-sm"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <v.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {content.media.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-center text-lg font-semibold text-foreground lg:text-left">
                Momentos {storeName}
              </h2>
              <AboutGallery media={content.media} />
            </div>
          )}

          {hasContactCta && (
            <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Hablemos
                </p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                  ¿Querés conocernos mejor?
                </h2>
              </div>
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                {phone && (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    <Phone className="size-4" />
                    {phone}
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={toWhatsAppLink(whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white transition hover:brightness-105"
                  >
                    <WhatsAppIcon className="size-4" />
                    WhatsApp
                  </a>
                )}
                {!phone && !whatsapp && (
                  <Link
                    href="#hablemos-hoy"
                    className="rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    Contactanos
                  </Link>
                )}
              </div>
              {address && (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4 text-primary" />
                  {address}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
