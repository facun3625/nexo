import Link from "next/link";

import { cn } from "@/lib/utils";
import { ARQ_R2, ARQ_SECTIONS } from "@/lib/arquitectura";
import { PhotoBanner } from "@/components/catalog/photo-banner";

// Portada + solapas compartidas por /arquitectura/equipo, /servicios y /obras.
export function ArquitecturaHeader({
  active,
  title,
  subtitle,
  image = `${ARQ_R2}/equipo-2.webp`,
}: {
  active: (typeof ARQ_SECTIONS)[number]["href"];
  title: string;
  subtitle: string;
  image?: string;
}) {
  return (
    <>
      <PhotoBanner image={image} eyebrow="Arquitectura" title={title} subtitle={subtitle} />

      <nav aria-label="Secciones de arquitectura" className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-[1440px] gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {ARQ_SECTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              aria-current={s.href === active ? "page" : undefined}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-4 py-3.5 text-sm font-medium transition-colors",
                s.href === active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
