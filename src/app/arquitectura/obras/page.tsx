import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { ArquitecturaHeader } from "@/components/arquitectura/arquitectura-header";
import { ArquitecturaContact } from "@/components/arquitectura/arquitectura-contact";
import { DevelopmentCard } from "@/components/estate/development-card";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { arqMetadata, getArqContent } from "@/lib/arquitectura-content";
import { ArqEditButton } from "@/components/arquitectura/arq-edit-button";

export function generateMetadata() {
  return arqMetadata(null, "Obras diseñadas y dirigidas por el estudio.", "/arquitectura/obras");
}

export default async function ArquitecturaObrasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const { categoria } = await searchParams;

  const [settings, developments, categories, arq] = await Promise.all([
    getStoreSettings(tenant.id),
    prisma.estateDevelopment.findMany({
      where: { tenantId: tenant.id, published: true },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Solo las categorías que tienen al menos una obra publicada: un filtro
    // que siempre da vacío no le sirve al visitante.
    prisma.estateDevelopmentCategory.findMany({
      where: { tenantId: tenant.id, developments: { some: { published: true } } },
      orderBy: { order: "asc" },
      select: { id: true, name: true },
    }),
    getArqContent(tenant.id),
  ]);

  const activeCategory = categories.find((c) => c.id === categoria) ?? null;
  const visible = activeCategory
    ? developments.filter((d) => d.categoryId === activeCategory.id)
    : developments;

  return (
    <div className="public-inner-page public-collection-page flex flex-1 flex-col">
      <StoreHero />
      <ArquitecturaHeader
        active="/arquitectura/obras"
        title={settings.arq.obrasLabel}
        subtitle={arq.obras.subtitle}
        image={arq.obras.heroImage}
      />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
        <div className="flex flex-col gap-16 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="-mb-8 flex justify-end gap-2 empty:hidden lg:-mb-12">
            <ArqEditButton tenantId={tenant.id} href="/admin/pagina?tab=arquitectura" label="Editar portada" />
            <ArqEditButton tenantId={tenant.id} href="/admin/gestion/emprendimientos" label={`Gestionar ${settings.arq.obrasLabel.toLowerCase()}`} />
          </div>
          <div className="flex flex-col gap-8">
            {categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2" aria-label="Filtrar por categoría">
                {[{ id: null, name: "Todas" }, ...categories].map((c) => {
                  const isActive = (activeCategory?.id ?? null) === c.id;
                  return (
                    <Link
                      key={c.id ?? "todas"}
                      href={c.id ? `/arquitectura/obras?categoria=${c.id}` : "/arquitectura/obras"}
                      scroll={false}
                      aria-current={isActive ? "true" : undefined}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {c.name}
                    </Link>
                  );
                })}
              </div>
            )}

            {visible.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((d) => (
                  <DevelopmentCard key={d.id} development={d} />
                ))}
              </div>
            ) : (
              <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
                <Building2 className="size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Muy pronto vas a poder ver acá nuestras obras.
                </p>
              </div>
            )}
          </div>

          <ArquitecturaContact phone={settings.phone} whatsapp={settings.whatsapp} email={settings.email} />
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
