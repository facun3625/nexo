import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { PropertyCard } from "@/components/estate/property-card";
import { PropertySearchForm } from "@/components/estate/property-search-form";
import { ViewToggle, toResultsQueryString } from "@/components/estate/view-toggle";
import { estatePropertyFilterOptions } from "@/lib/estate/data";
import { parseCatalogFilters, buildPublishedPropertyWhere } from "@/lib/estate/catalog-filters";
import { getPublicCatalogFilters, getCatalogFilterLabels } from "@/lib/estate/catalog-filter-settings";

// Con filtros en la URL igual apunta a /propiedades: así Google no indexa
// cada combinación de filtros como una página distinta.
export const metadata = {
  title: "Propiedades en venta y alquiler",
  description: "Casas, departamentos, terrenos y locales en venta y alquiler. Filtrá por zona, tipo, precio y dormitorios.",
  alternates: { canonical: "/propiedades" },
};

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const search = await searchParams;

  const page = Math.max(1, Math.min(10000, Math.floor(Number(search.page)) || 1));
  const [enabledFilters, filterLabels, filterOptions, storeSettings] = await Promise.all([
    getPublicCatalogFilters(tenant.id),
    getCatalogFilterLabels(tenant.id),
    estatePropertyFilterOptions(tenant.id, { publishedOnly: true }),
    getStoreSettings(tenant.id),
  ]);
  const filters = parseCatalogFilters(search, enabledFilters, {
    propertyTypes: filterOptions.propertyTypes,
    cities: filterOptions.cities,
    neighborhoods: filterOptions.neighborhoods,
  });
  const hasFilters = Object.values(filters).some((value) => value !== undefined && value !== "");
  const session = await auth();
  const propertyWhere = buildPublishedPropertyWhere(tenant.id, filters);
  const [properties, totalCount, favoriteIds] = await Promise.all([
    prisma.estateProperty.findMany({
      where: propertyWhere,
      include: {
        media: { orderBy: { position: "asc" }, take: 1 },
        listings: {
          where: { status: "AVAILABLE", ...(filters.operation ? { operation: filters.operation } : {}) },
        },
      },
      orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { createdAt: "desc" }],
      take: 13,
      skip: (page - 1) * 12,
    }),
    prisma.estateProperty.count({ where: propertyWhere }),
    session?.user
      ? prisma.estatePropertyFavorite.findMany({
          where: { tenantId: tenant.id, userId: session.user.id },
          select: { propertyId: true },
        })
      : Promise.resolve([]),
  ]);
  const favoritedSet = new Set(favoriteIds.map((f) => f.propertyId));
  const hasNext = properties.length > 12;
  function pageHref(n: number) {
    return `/propiedades?${new URLSearchParams({
      q: search.q ?? "",
      operation: search.operation ?? "",
      propertyType: search.propertyType ?? "",
      city: search.city ?? "",
      neighborhood: search.neighborhood ?? "",
      bedrooms: search.bedrooms ?? "",
      bathrooms: search.bathrooms ?? "",
      garages: search.garages ?? "",
      orientation: search.orientation ?? "",
      petsPolicy: search.petsPolicy ?? "",
      creditEligible: search.creditEligible ?? "",
      page: String(n),
    })}`;
  }

  return (
    <div className="public-inner-page flex flex-1 flex-col">
      <StoreHero />
      <div className="public-page-intro border-b bg-muted/50">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-4 py-7 text-center sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Catálogo</p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{hasFilters ? "Resultados de búsqueda" : "Todas las propiedades"}</h1>
          </div>
          <PropertySearchForm
            enabledKeys={enabledFilters}
            labels={filterLabels}
            values={{
              q: search.q ?? "",
              operation: search.operation ?? "",
              propertyType: search.propertyType ?? "",
              city: search.city ?? "",
              neighborhood: search.neighborhood ?? "",
              bedrooms: search.bedrooms ?? "",
              bathrooms: search.bathrooms ?? "",
              garages: search.garages ?? "",
              orientation: search.orientation ?? "",
              petsPolicy: search.petsPolicy ?? "",
              creditEligible: search.creditEligible ?? "",
            }}
            propertyTypes={filterOptions.propertyTypes}
            cities={filterOptions.cities}
            neighborhoods={filterOptions.neighborhoods}
          />
        </div>
      </div>
      <main className="mx-auto w-full max-w-[1440px] flex-1 bg-background">
        <div className="flex flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {totalCount
                ? `${totalCount} propiedad${totalCount === 1 ? "" : "es"} encontrada${totalCount === 1 ? "" : "s"}`
                : "Explorá nuestra selección actualizada"}
            </p>
            <ViewToggle active="list" query={toResultsQueryString(search)} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {properties.slice(0, 12).map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                favorited={favoritedSet.has(p.id)}
                badgeColor={storeSettings.badgeColor}
              />
            ))}
          </div>
          {!properties.length && (
            <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
              <Building2 className="mx-auto size-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No hay propiedades para esta búsqueda</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Probá con otra zona o consultanos por lo que estás buscando.
              </p>
              <Link href="/propiedades" className="mt-4 inline-block text-sm underline">
                Ver todas las propiedades
              </Link>
            </div>
          )}
          <nav aria-label="Paginación" className="mt-2 grid grid-cols-3 items-center gap-2 text-sm">
            {page > 1 ? <Link href={pageHref(page - 1)} className="justify-self-start rounded-lg px-2 py-2 transition-colors hover:bg-muted">← Anterior</Link> : <span />}
            <span className="text-muted-foreground">Página {page}</span>
            {hasNext ? <Link href={pageHref(page + 1)} className="justify-self-end rounded-lg px-2 py-2 transition-colors hover:bg-muted">Siguiente →</Link> : <span />}
          </nav>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
