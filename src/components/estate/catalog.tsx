import Link from "next/link";
import { ArrowRight, Building2, MapPin, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getStoreSettings } from "@/lib/settings";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { PropertyCard } from "@/components/estate/property-card";
import { PropertySearchForm } from "@/components/estate/property-search-form";
import { CoverMedia } from "@/components/catalog/cover-media";
import { estatePropertyFilterOptions } from "@/lib/estate/data";
import { getPublicCatalogFilters, getCatalogFilterLabels } from "@/lib/estate/catalog-filter-settings";
import { contrastText } from "@/lib/contrast-color";

const FEATURED_TAKE = 8;

// La home es la vidriera: hero + buscador + una selección de propiedades.
// Buscar te manda a /propiedades, que es la página de resultados real (con
// grilla completa y paginación) — así siempre hay resultados visibles sin
// scrollear de más, en vez de mezclar hero y resultados en una sola página.
export async function EstateCatalog({ tenantId }: { tenantId: string }) {
  const session = await auth();
  const [enabledFilters, filterLabels, filterOptions, settings, properties, favoriteIds] =
    await Promise.all([
    getPublicCatalogFilters(tenantId),
    getCatalogFilterLabels(tenantId),
    estatePropertyFilterOptions(tenantId, { publishedOnly: true }),
    getStoreSettings(tenantId),
    prisma.estateProperty.findMany({
      where: { tenantId, published: true, listings: { some: { status: "AVAILABLE" } } },
      include: {
        media: { orderBy: { position: "asc" }, take: 1 },
        listings: { where: { status: "AVAILABLE" } },
      },
      orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { createdAt: "desc" }],
      take: FEATURED_TAKE,
    }),
    session?.user
      ? prisma.estatePropertyFavorite.findMany({
          where: { tenantId, userId: session.user.id },
          select: { propertyId: true },
        })
      : Promise.resolve([]),
  ]);
  const favoritedSet = new Set(favoriteIds.map((f) => f.propertyId));
  const hasContactInfo = Boolean(settings.address || settings.phone);
  const searchValues = {
    q: "",
    operation: "",
    propertyType: "",
    city: "",
    neighborhood: "",
    bedrooms: "",
    bathrooms: "",
    garages: "",
    orientation: "",
    petsPolicy: "",
    creditEligible: "",
  };
  const searchForm = (
    <PropertySearchForm
      action="/propiedades"
      enabledKeys={enabledFilters}
      labels={filterLabels}
      values={searchValues}
      propertyTypes={filterOptions.propertyTypes}
      cities={filterOptions.cities}
      neighborhoods={filterOptions.neighborhoods}
    />
  );
  const propertyCards = properties.map((p) => (
    <PropertyCard
      key={p.id}
      property={p}
      favorited={favoritedSet.has(p.id)}
      badgeColor={settings.badgeColor}
    />
  ));

  if (settings.template === "moderno") {
    return (
      <div className="flex flex-1 flex-col bg-[#f3f1ec]">
        <StoreHero />
        <section>
          <div className="relative h-[clamp(16rem,42vw,34rem)] overflow-hidden bg-neutral-200">
            {settings.coverUrl || settings.coverVideoUrl ? (
              <CoverMedia videoUrl={settings.coverVideoUrl} imageUrl={settings.coverUrl} />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--primary),#111)]" />
            )}
          </div>
          {/* El texto va en una raya de color debajo de la foto, sin oscurecerla. */}
          <div style={{ backgroundColor: settings.menuBgColor, color: contrastText(settings.menuBgColor) }}>
            <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
              <div className="public-enter max-w-4xl">
                <p className="text-xs font-semibold uppercase tracking-[.28em] opacity-75">Propiedades para tu próxima etapa</p>
                <h1 className="mt-3 max-w-3xl text-[clamp(2.2rem,5vw,4.5rem)] font-bold leading-[.95] tracking-[-.04em]">
                  Encontrá tu lugar.
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed opacity-85 sm:text-lg">
                  Venta, alquiler y oportunidades elegidas para acompañar la forma en la que querés vivir.
                </p>
              </div>
              <div className="public-enter public-enter-delay-1 mt-7 max-w-6xl rounded-[1.75rem] bg-white/95 p-2 text-neutral-950 shadow-2xl backdrop-blur-md">
                {searchForm}
              </div>
              {hasContactInfo && (
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm opacity-85">
                  {settings.address && <span className="flex items-center gap-2"><MapPin className="size-4" />{settings.address}</span>}
                  {settings.phone && <span className="flex items-center gap-2"><Phone className="size-4" />{settings.phone}</span>}
                </div>
              )}
            </div>
          </div>
        </section>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.24em] text-primary">Selección destacada</p>
              <h2 className="mt-3 text-[clamp(2.1rem,5vw,4.5rem)] font-bold leading-none tracking-[-.04em]">Espacios que inspiran</h2>
              <p className="mt-4 text-muted-foreground">{properties.length ? `${properties.length} propiedades disponibles` : "Explorá nuestra selección actualizada"}</p>
            </div>
            <Link href="/propiedades" className="group inline-flex items-center gap-2 font-semibold text-primary">
              Ver todas <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{propertyCards}</div>
          {!properties.length && <EmptyProperties />}
          {settings.hasDevelopments && (
            <Link
              href="/arquitectura/obras"
              className="group mt-16 grid overflow-hidden rounded-[2rem] px-7 py-10 shadow-xl sm:px-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-14 lg:py-14"
              style={{ backgroundColor: settings.buttonColor, color: contrastText(settings.buttonColor) }}
            >
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[.25em] opacity-65">Arquitectura</p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Obras del estudio.</h2>
                <p className="mt-4 max-w-xl opacity-75">Proyectos diseñados y dirigidos por nuestro estudio de arquitectura.</p>
              </div>
              <span className="mt-8 inline-flex items-center gap-2 border-b border-current pb-1 font-semibold lg:mt-0">Explorar obras <ArrowRight className="size-4" /></span>
            </Link>
          )}
        </main>
        <StoreFooter />
      </div>
    );
  }

  if (settings.template === "minimal") {
    return (
      <div className="flex flex-1 flex-col bg-white text-neutral-900">
        <StoreHero />
        <main className="flex-1">
          <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-16 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
            <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(340px,4fr)]">
              <div className="public-enter max-w-4xl">
                <p className="text-xs font-medium uppercase tracking-[.3em] text-neutral-500">Inmuebles seleccionados</p>
                <h1 className="mt-7 text-[clamp(3rem,7vw,7rem)] font-medium leading-[.94] tracking-[-.065em]">Tu próximo espacio empieza acá.</h1>
              </div>
              <div className="public-enter public-enter-delay-1 pb-2 text-base leading-7 text-neutral-500">
                <p>Descubrí propiedades en venta y alquiler, elegidas para que encuentres con claridad el lugar que estás buscando.</p>
                {hasContactInfo && (
                  <div className="mt-6 flex flex-col gap-2 text-sm text-neutral-700">
                    {settings.address && <span>{settings.address}</span>}
                    {settings.phone && <span>{settings.phone}</span>}
                  </div>
                )}
              </div>
            </div>
            {(settings.coverUrl || settings.coverVideoUrl) && (
              <div className="public-enter-side-right relative mt-14 aspect-[16/7] min-h-[280px] overflow-hidden bg-neutral-100">
                <CoverMedia videoUrl={settings.coverVideoUrl} imageUrl={settings.coverUrl} />
              </div>
            )}
            <div className="mt-10 border-y border-neutral-200 py-5">{searchForm}</div>
          </section>

          <section className="mx-auto w-full max-w-[1440px] px-4 pb-20 sm:px-6 lg:px-8 lg:pb-32">
            <div className="mb-10 flex items-end justify-between border-b border-neutral-200 pb-5">
              <div>
                <p className="text-xs uppercase tracking-[.26em] text-neutral-500">Catálogo</p>
                <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-5xl">Propiedades destacadas</h2>
              </div>
              <Link href="/propiedades" className="hidden text-sm text-neutral-600 underline underline-offset-8 sm:block">Ver todas</Link>
            </div>
            <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{propertyCards}</div>
            {!properties.length && <EmptyProperties />}
            {settings.hasDevelopments && (
              <Link href="/arquitectura/obras" className="group mt-20 flex flex-col justify-between gap-8 border-y border-neutral-900 py-10 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs uppercase tracking-[.25em] text-neutral-500">Arquitectura</p>
                  <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-5xl">Nuestras obras</h2>
                  <p className="mt-4 text-neutral-500">Proyectos diseñados y dirigidos por nuestro estudio.</p>
                </div>
                <span className="inline-flex items-center gap-3 text-sm font-medium">Ver obras <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            )}
          </section>
        </main>
        <StoreFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <StoreHero />
      <section className="grid overflow-hidden border-b lg:min-h-[300px] lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)]">
        <div className="public-enter-side flex min-w-0 flex-col justify-center gap-5 bg-muted/50 px-4 py-8 sm:px-6 lg:px-10 lg:py-10 xl:px-12">
          <div>
            <h1 className="text-[clamp(1.8rem,4vw,2.5rem)] font-bold tracking-tight">
              Buscar propiedades
            </h1>
            <p className="mt-2 text-muted-foreground">
              Encontrá la propiedad que estás buscando
            </p>
          </div>
          <PropertySearchForm
            action="/propiedades"
            enabledKeys={enabledFilters}
            labels={filterLabels}
            values={{
              q: "",
              operation: "",
              propertyType: "",
              city: "",
              neighborhood: "",
              bedrooms: "",
              bathrooms: "",
              garages: "",
              orientation: "",
              petsPolicy: "",
              creditEligible: "",
            }}
            propertyTypes={filterOptions.propertyTypes}
            cities={filterOptions.cities}
            neighborhoods={filterOptions.neighborhoods}
          />
          {hasContactInfo && (
            <div className="grid min-w-0 gap-3 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-5">
              {settings.address && (
                <span className="flex min-w-0 items-start gap-2">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span className="min-w-0 break-words">{settings.address}</span>
                </span>
              )}
              {settings.phone && (
                <span className="flex min-w-0 items-center gap-2">
                  <Phone className="size-4 shrink-0 text-primary" />
                  {settings.phone}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="public-enter-side-right public-enter-delay-1 relative hidden overflow-hidden bg-primary/10 lg:block">
          {settings.coverUrl || settings.coverVideoUrl ? (
            <CoverMedia videoUrl={settings.coverVideoUrl} imageUrl={settings.coverUrl} sizes="50vw" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Building2 className="size-20 text-primary/30" />
            </div>
          )}
        </div>
      </section>
      <main className="mx-auto w-full max-w-[1440px] flex-1 bg-background">
        <div className="flex flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div>
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Nuestra selección
                </p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                  Propiedades destacadas
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {properties.length
                    ? `${properties.length} propiedades disponibles`
                    : "Explorá nuestra selección actualizada"}
                </p>
              </div>
              <Link href="/propiedades" className="w-fit text-sm font-medium text-primary underline underline-offset-4">
                Ver todas las propiedades
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  favorited={favoritedSet.has(p.id)}
                  badgeColor={settings.badgeColor}
                />
              ))}
            </div>
            {!properties.length && (
              <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
                <Building2 className="mx-auto size-10 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  Todavía no hay propiedades publicadas
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Volvé a visitarnos pronto o consultanos por lo que estás buscando.
                </p>
              </div>
            )}
          </div>
          {settings.hasDevelopments && (
            <Link
              href="/arquitectura/obras"
              className="public-enter public-enter-delay-2 group flex flex-col gap-6 overflow-hidden rounded-2xl px-6 py-7 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10 lg:py-9"
              style={{
                backgroundColor: settings.buttonColor,
                color: contrastText(settings.buttonColor),
              }}
            >
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[.2em] opacity-70">
                  Arquitectura
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Conocé nuestras obras
                </h2>
                <p className="mt-2 text-sm leading-relaxed opacity-80 sm:text-base">
                  Proyectos diseñados y dirigidos por nuestro estudio de arquitectura.
                </p>
              </div>
              <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-current/30 px-5 py-3 text-sm font-semibold transition-colors group-hover:bg-white/15">
                Ver obras
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          )}
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}

function EmptyProperties() {
  return (
    <div className="mt-8 border border-dashed px-6 py-16 text-center">
      <Building2 className="mx-auto size-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Todavía no hay propiedades publicadas</h3>
      <p className="mt-2 text-sm text-muted-foreground">Volvé a visitarnos pronto o consultanos por lo que estás buscando.</p>
    </div>
  );
}
