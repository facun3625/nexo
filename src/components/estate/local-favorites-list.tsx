"use client";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";

import { getFavoritePropertiesByIds } from "@/app/propiedades/actions";
import { getLocalFavorites } from "@/lib/local-favorites";
import { useStoreSettings } from "@/lib/store-settings-context";
import { PropertyCard, type CardProperty } from "@/components/estate/property-card";

export function LocalFavoritesList() {
  const { badgeColor } = useStoreSettings();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<CardProperty[]>([]);

  useEffect(() => {
    const ids = getLocalFavorites();
    if (!ids.length) {
      setLoading(false);
      return;
    }
    getFavoritePropertiesByIds(ids).then((rows) => {
      setProperties(rows as unknown as CardProperty[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed px-6 py-16 text-center">
        <Heart className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">
          Todavía no guardaste ninguna propiedad
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tocá el corazón en cualquier propiedad para guardarla acá.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} favorited badgeColor={badgeColor} />
      ))}
    </div>
  );
}
