import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

export const DEVELOPMENT_STAGES: Record<string, string> = {
  PROJECT: "Proyecto",
  PRE_SALE: "Preventa",
  UNDER_CONSTRUCTION: "En obra",
  CONSTRUCTION: "En obra",
  READY: "Entrega inmediata",
  DELIVERED: "Entregado",
};

export type DevelopmentCardData = {
  id: string;
  name: string;
  developer: string | null;
  city: string;
  stage: string;
  description: string;
  images: { url: string }[];
  category?: { name: string } | null;
};

// Card de obra (EstateDevelopment) para /arquitectura/obras.
export function DevelopmentCard({
  development,
  fallbackLabel = "Obra",
  ctaLabel = "Ver obra",
}: {
  development: DevelopmentCardData;
  fallbackLabel?: string;
  ctaLabel?: string;
}) {
  const summary = DOMPurify.sanitize(development.description, { ALLOWED_TAGS: [] })
    .replace(/\s+/g, " ")
    .trim();

  return (
    <Link
      href={`/arquitectura/obras/${development.id}`}
      className="estate-development-card public-scroll-reveal group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-[box-shadow,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/25 hover:shadow-[0_14px_34px_-22px_rgba(15,23,42,0.38)]"
    >
      <div className="estate-development-card-media relative aspect-[4/3] overflow-hidden bg-muted">
        {development.images[0] ? (
          <Image
            src={development.images[0].url}
            alt={development.name}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, (max-width:1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.085]"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Building2 className="size-12 text-muted-foreground/40" />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur">
          {DEVELOPMENT_STAGES[development.stage] ?? development.stage}
        </span>
      </div>
      <div className="estate-development-card-body flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {development.category?.name || development.developer || fallbackLabel}
        </p>
        <h2 className="mt-1.5 line-clamp-2 min-h-12 text-base font-semibold leading-6 transition-colors duration-300 group-hover:text-primary">
          {development.name}
        </h2>
        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{development.city}</span>
        </p>
        <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
          {summary}
        </p>
        <span className="mt-3 inline-flex items-center gap-2 border-t pt-3 text-sm font-semibold text-primary">
          {ctaLabel}{" "}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
