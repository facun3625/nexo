import { EstateCatalog } from "@/components/estate/catalog";
import { getCurrentTenant } from "@/lib/tenant";

export const metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const tenant = await getCurrentTenant();
  if (!tenant) {
    return (
      <main className="flex min-h-screen items-center justify-center p-12 text-center">
        <p className="text-sm text-muted-foreground">Sitio en configuración.</p>
      </main>
    );
  }
  return <EstateCatalog tenantId={tenant.id} />;
}
