import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin, BedDouble, Bath, Scan } from "lucide-react";

import { money, labels } from "@/lib/estate/modules";
import { contrastText } from "@/lib/contrast-color";
import { FavoriteButton } from "./favorite-button";

// Mismo valor por defecto que DEFAULT_BADGE_COLOR en @/lib/settings — no se
// importa de ahí para no arrastrar "@/lib/prisma" al bundle del cliente
// (este componente lo renderiza también local-favorites-list.tsx, que es
// "use client").
const FALLBACK_BADGE_COLOR = "#1e658c";

export type CardProperty = {
  id: string;
  title: string;
  propertyType: string;
  neighborhood: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  totalArea: { toString(): string } | null;
  media: { url: string }[];
  listings: {
    id: string;
    operation: string;
    price: { toString(): string } | number | null;
    currency: string;
    temporary: boolean;
    showPrice: boolean;
  }[];
};

export function PropertyCard({
  property: p,
  favorited,
  badgeColor = FALLBACK_BADGE_COLOR,
}: {
  property: CardProperty;
  favorited: boolean;
  badgeColor?: string;
}) {
  return (
    <Link
      href={`/propiedades/${p.id}`}
      className="estate-property-card public-scroll-reveal group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/25 hover:shadow-[0_14px_34px_-22px_rgba(15,23,42,0.38)]"
    >
      <div className="estate-property-card-media relative aspect-[4/3] overflow-hidden bg-muted">
        {p.media[0] ? (
          <Image
            src={p.media[0].url}
            alt={p.title}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, (max-width:1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.085]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Building2 className="size-10" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {p.listings.map((l) => (
            <span
              key={l.id}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm"
              style={{ backgroundColor: badgeColor, color: contrastText(badgeColor) }}
            >
              {l.temporary ? "Alquiler temporario" : labels[l.operation]}
            </span>
          ))}
        </div>
        <FavoriteButton
          propertyId={p.id}
          initialFavorited={favorited}
          className="absolute right-3 top-3"
        />
      </div>
      <div className="estate-property-card-body flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {p.propertyType}
        </p>
        <h3 className="mt-1.5 line-clamp-2 min-h-12 text-base font-semibold leading-6 transition-colors duration-300 ease-out group-hover:text-primary">{p.title}</h3>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {[p.neighborhood, p.city].filter(Boolean).join(", ")}
          </span>
        </p>
        <div className="my-3 flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BedDouble className="size-3.5" />
            {p.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" />
            {p.bathrooms}
          </span>
          {p.totalArea && (
            <span className="flex items-center gap-1">
              <Scan className="size-3.5" />
              {p.totalArea.toString()} m²
            </span>
          )}
        </div>
        <div className="estate-property-card-price mt-auto border-t pt-3 text-sm">
          <p className="font-semibold">
            {p.listings.map((l) => (
              <span key={l.id} className="block">
                {l.price && l.showPrice ? money(l.price, l.currency) : "Consultar precio"}
                {l.operation === "RENT" && l.price && l.showPrice
                  ? l.temporary
                    ? " / día"
                    : " / mes"
                  : ""}
              </span>
            ))}
          </p>
        </div>
      </div>
    </Link>
  );
}
