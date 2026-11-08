import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireTenantAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { CatalogList } from "@/components/estate/catalog-list";

export default async function ContratosCategoriasPage() {
  const { tenant } = await requireTenantAdmin();
  const [contractTypes, propertyDestinations] = await Promise.all([
    prisma.estateContractType.findMany({
      where: { tenantId: tenant.id },
      orderBy: { order: "asc" },
    }),
    prisma.estatePropertyDestination.findMany({
      where: { tenantId: tenant.id },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/gestion/contratos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Contratos
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Categorías</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          El tipo de contrato y el destino del inmueble que aparecen para elegir al cargar un
          contrato. Borrar uno de acá no afecta a los contratos que ya lo usan.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CatalogList
          kind="contractTypes"
          title="Tipo de contrato"
          description="Residencial, Comercial, Cochera, Temporario…"
          items={contractTypes}
        />
        <CatalogList
          kind="propertyDestinations"
          title="Destino del inmueble"
          description="Vivienda, Comercio, Oficina, Depósito…"
          items={propertyDestinations}
        />
      </div>
    </div>
  );
}
