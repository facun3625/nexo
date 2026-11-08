import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { CatalogList } from "@/components/estate/catalog-list";

export default async function CategoriasPage() {
  const { tenant } = await requireTenantAdmin();
  const [propertyTypes, cities, neighborhoods] = await Promise.all([
    prisma.estatePropertyType.findMany({
      where: { tenantId: tenant.id },
      orderBy: { order: "asc" },
    }),
    prisma.estateCity.findMany({
      where: { tenantId: tenant.id },
      orderBy: { order: "asc" },
    }),
    prisma.estateNeighborhood.findMany({
      where: { tenantId: tenant.id },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/gestion/propiedades"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Propiedades
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Categorías</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Los tipos, ciudades y barrios que aparecen para elegir al cargar una propiedad. Borrar
          uno de acá no afecta a las propiedades que ya lo usan.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <CatalogList
          kind="propertyTypes"
          title="Tipo de propiedad"
          description="Casa, Departamento, Terreno…"
          items={propertyTypes}
        />
        <CatalogList
          kind="cities"
          title="Ciudad"
          description="Ciudades donde tenés propiedades."
          items={cities}
        />
        <CatalogList
          kind="neighborhoods"
          title="Barrio"
          description="Barrios o zonas dentro de esas ciudades."
          items={neighborhoods}
        />
      </div>
    </div>
  );
}
