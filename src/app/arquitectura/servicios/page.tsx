import Image from "next/image";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { ArquitecturaHeader } from "@/components/arquitectura/arquitectura-header";
import { ArquitecturaContact } from "@/components/arquitectura/arquitectura-contact";
import { ArqEditButton } from "@/components/arquitectura/arq-edit-button";
import { serviceIcon } from "@/components/arquitectura/arq-icons";
import { parseServiceBody } from "@/lib/arquitectura";
import { getArqContent } from "@/lib/arquitectura-content";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

export const metadata = {
  title: "Servicios · Arquitectura",
  description:
    "Asesoramiento, anteproyecto, proyecto ejecutivo y dirección de obra.",
  alternates: { canonical: "/arquitectura/servicios" },
};

export default async function ArquitecturaServiciosPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const [{ phone, whatsapp, email }, content] = await Promise.all([
    getStoreSettings(tenant.id),
    getArqContent(tenant.id),
  ]);
  const c = content.servicios;

  return (
    <div className="public-inner-page public-content-page flex flex-1 flex-col">
      <StoreHero />
      <ArquitecturaHeader active="/arquitectura/servicios" title="Servicios" subtitle={c.subtitle} image={c.heroImage} />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
        <div className="flex flex-col gap-16 px-4 py-12 sm:px-6 lg:gap-20 lg:px-8 lg:py-16">
          <div className="-mb-8 flex justify-end empty:hidden lg:-mb-12">
            <ArqEditButton tenantId={tenant.id} href="/admin/pagina?tab=arquitectura" label="Editar página" />
          </div>
          <ol className="grid gap-5 md:grid-cols-2">
            {c.services.map((s, i) => {
              const Icon = serviceIcon(i);
              return (
                <li key={`${i}-${s.title}`} className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm sm:p-7">
                  <div className="flex items-center gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold tracking-widest text-primary">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className="text-lg font-semibold leading-tight">{s.title}</h2>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground">
                    {parseServiceBody(s.body).map((block, j) =>
                      block.kind === "p" ? (
                        <p key={j}>{block.text}</p>
                      ) : (
                        <ul key={j} className="flex flex-col gap-2">
                          {block.items.map((item, k) => (
                            <li key={k} className="flex gap-2.5">
                              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      ),
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Collage de obras: se muestra entero (es una grilla de fotos,
              recortarlo corta las filas). */}
          {c.collageImage && (
            <div className="relative mx-auto aspect-[1024/667] w-full max-w-4xl overflow-hidden rounded-2xl">
              <Image
                src={c.collageImage}
                alt="Obras realizadas por el estudio"
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-contain"
              />
            </div>
          )}

          <ArquitecturaContact phone={phone} whatsapp={whatsapp} email={email} />
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
