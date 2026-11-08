import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { PropertyCard } from "@/components/estate/property-card";
import { LocalFavoritesList } from "@/components/estate/local-favorites-list";

export const metadata = { title: "Tus favoritos" };

export default async function FavoritosPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  const [session, storeSettings] = await Promise.all([auth(), getStoreSettings(tenant.id)]);

  const favorites = session?.user
    ? await prisma.estatePropertyFavorite.findMany({
        where: { tenantId: tenant.id, userId: session.user.id },
        include: {
          property: {
            include: {
              media: { orderBy: { position: "asc" }, take: 1 },
              listings: { where: { status: "AVAILABLE" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="public-inner-page public-collection-page flex flex-1 flex-col">
      <StoreHero />
      <main className="mx-auto w-full max-w-[1440px] flex-1 bg-background">
        <div className="flex flex-col gap-8 px-4 py-10 sm:px-6 lg:gap-10 lg:px-8 lg:py-14">
          <div className="public-page-heading">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Tu selección
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Favoritos
            </h1>
          </div>

          {!session?.user ? (
            <LocalFavoritesList />
          ) : favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
              <Heart className="mx-auto size-10 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">
                Todavía no guardaste ninguna propiedad
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tocá el corazón en cualquier propiedad para guardarla acá.
              </p>
              <Link href="/" className="mt-4 inline-block text-sm underline">
                Ver propiedades
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favorites.map((f) => (
                <PropertyCard
                  key={f.propertyId}
                  property={f.property}
                  favorited
                  badgeColor={storeSettings.badgeColor}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
