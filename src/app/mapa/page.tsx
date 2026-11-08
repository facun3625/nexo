import { notFound } from "next/navigation";
import { MapPinOff } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { MapLoader } from "@/components/estate/map-loader";
import { PropertySearchForm } from "@/components/estate/property-search-form";
import { ViewToggle, toResultsQueryString } from "@/components/estate/view-toggle";
import { estatePropertyFilterOptions } from "@/lib/estate/data";
import { parseCatalogFilters, buildPublishedPropertyWhere } from "@/lib/estate/catalog-filters";
import { getPublicCatalogFilters, getCatalogFilterLabels } from "@/lib/estate/catalog-filter-settings";

export const metadata = {
  title: "Propiedades en el mapa",
  description: "Buscá casas, departamentos y terrenos en venta y alquiler sobre el mapa.",
  alternates: { canonical: "/mapa" },
};

export default async function MapaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const search = await searchParams;

  const [enabledFilters, filterOptions, filterLabels] = await Promise.all([
    getPublicCatalogFilters(tenant.id),
    estatePropertyFilterOptions(tenant.id, { publishedOnly: true }),
    getCatalogFilterLabels(tenant.id),
  ]);
  const filters = parseCatalogFilters(search, enabledFilters, {
    propertyTypes: filterOptions.propertyTypes,
    cities: filterOptions.cities,
    neighborhoods: filterOptions.neighborhoods,
  });

  const properties = await prisma.estateProperty.findMany({
    where: buildPublishedPropertyWhere(tenant.id, filters),
    select: {
      id: true,
      title: true,
      city: true,
      neighborhood: true,
      latitude: true,
      longitude: true,
      media: { orderBy: { position: "asc" }, take: 1 },
      listings: {
        where: { status: "AVAILABLE", ...(filters.operation ? { operation: filters.operation } : {}) },
      },
    },
    orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { createdAt: "desc" }],
    take: 200,
  });

  const withCoords = properties
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      ...p,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      listings: p.listings.map((l) => ({
        ...l,
        price: l.price ? Number(l.price) : null,
      })),
    }));
  const withoutCoords = properties.length - withCoords.length;

  return (
    <div className="public-inner-page public-map-page flex flex-1 flex-col">
      <StoreHero />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col bg-background">
        <div className="public-page-intro mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-4 py-7 text-center sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Zona de cobertura
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Propiedades en el mapa
            </h1>
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

          <div className="flex flex-wrap items-center justify-center gap-3">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {withCoords.length === 0
                ? "Sin propiedades con ubicación cargada"
                : `${withCoords.length} propiedad${withCoords.length === 1 ? "" : "es"} en el mapa`}
              {withoutCoords > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                  <MapPinOff className="size-3.5" />
                  {withoutCoords} sin coordenadas
                </span>
              )}
            </p>
            <ViewToggle active="map" query={toResultsQueryString(search)} />
          </div>
        </div>

        <div className="h-[min(70dvh,760px)] min-h-[360px] w-full px-4 pb-8 sm:min-h-[440px] sm:px-6 lg:px-10">
          <div className="size-full overflow-hidden rounded-2xl border">
            <MapLoader properties={withCoords} />
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
