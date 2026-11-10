import Link from "next/link";
import { notFound } from "next/navigation";

import { cn } from "@/lib/utils";
import { arqSections, type ArqSectionHref } from "@/lib/arquitectura";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { PhotoBanner } from "@/components/catalog/photo-banner";

// Portada + solapas compartidas por /arquitectura/equipo, /servicios y /obras.
// El texto chico de arriba es el nombre de la sección (Arquitectura,
// Emprendimientos...); las solapas son solo las páginas prendidas, y si queda
// una sola no se muestran.
export async function ArquitecturaHeader({
  active,
  title,
  subtitle,
  image,
}: {
  active: ArqSectionHref;
  title: string;
  subtitle: string;
  image?: string | null;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const { arq } = await getStoreSettings(tenant.id);
  const sections = arqSections(arq);
  const eyebrow = title.toLowerCase() === arq.label.toLowerCase() ? "" : arq.label;

  return (
    <>
      <PhotoBanner image={image || null} eyebrow={eyebrow} title={title} subtitle={subtitle} />

      {sections.length > 1 && (
        <nav aria-label={`Secciones de ${arq.label}`} className="border-b bg-background">
          <div className="mx-auto flex w-full max-w-[1440px] gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {sections.map((s) => (
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
      )}
    </>
  );
}
