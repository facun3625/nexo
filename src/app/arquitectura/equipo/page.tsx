import Image from "next/image";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { AboutGallery } from "@/components/catalog/about-gallery";
import { ArquitecturaHeader } from "@/components/arquitectura/arquitectura-header";
import { ArquitecturaContact } from "@/components/arquitectura/arquitectura-contact";
import { ArqEditButton } from "@/components/arquitectura/arq-edit-button";
import { pillarIcon } from "@/components/arquitectura/arq-icons";
import { getArqContent } from "@/lib/arquitectura-content";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

export const metadata = {
  title: "Equipo · Arquitectura",
  description:
    "Equipo interdisciplinario que integra inmobiliaria y estudio de arquitectura.",
  alternates: { canonical: "/arquitectura/equipo" },
};

export default async function ArquitecturaEquipoPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const [{ phone, whatsapp }, content] = await Promise.all([
    getStoreSettings(tenant.id),
    getArqContent(tenant.id),
  ]);
  const c = content.equipo;

  return (
    <div className="public-inner-page public-content-page flex flex-1 flex-col">
      <StoreHero />
      <ArquitecturaHeader active="/arquitectura/equipo" title="Equipo" subtitle={c.subtitle} image={c.heroImage} />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
        <div className="flex flex-col gap-16 px-4 py-12 sm:px-6 lg:gap-20 lg:px-8 lg:py-16">
          <div className="-mb-8 flex justify-end empty:hidden lg:-mb-12">
            <ArqEditButton tenantId={tenant.id} href="/admin/pagina?tab=arquitectura" label="Editar página" />
          </div>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div>
              {c.introTitle && <h2 className="text-2xl font-semibold sm:text-3xl">{c.introTitle}</h2>}
              {c.introText.split(/\n\s*\n/).filter(Boolean).map((p) => (
                <p key={p} className="mt-4 text-base leading-relaxed text-muted-foreground lg:text-lg">
                  {p}
                </p>
              ))}
              {c.traits.length > 0 && (
                <>
                  {c.traitsTitle && (
                    <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-foreground">
                      {c.traitsTitle}
                    </h3>
                  )}
                  <ul className="mt-4 flex flex-col gap-3">
                    {c.traits.map((t) => (
                      <li key={t} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Check className="size-3.5" />
                        </span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            {c.coverImage && (
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src={c.coverImage}
                  alt="Equipo de Gerelli Correnti"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {c.pillars.length > 0 && (
            <div className="grid gap-5 md:grid-cols-3">
              {c.pillars.map((p, i) => {
                const Icon = pillarIcon(i);
                return (
                  <div
                    key={`${i}-${p.title}`}
                    className="rounded-2xl border bg-muted/30 p-6 transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/30 hover:bg-card hover:shadow-sm"
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
                  </div>
                );
              })}
            </div>
          )}

          {c.gallery.length > 0 && (
            <div className="flex flex-col gap-4">
              {c.galleryTitle && (
                <h2 className="text-center text-lg font-semibold lg:text-left">{c.galleryTitle}</h2>
              )}
              <AboutGallery media={c.gallery.map((url, i) => ({ id: `equipo-${i}`, type: "IMAGE" as const, url }))} />
            </div>
          )}

          <ArquitecturaContact phone={phone} whatsapp={whatsapp} />
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
