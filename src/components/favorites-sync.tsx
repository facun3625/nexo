"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

import { mergeLocalFavorites } from "@/app/propiedades/actions";
import { getLocalFavorites, clearLocalFavorites } from "@/lib/local-favorites";

// Sin UI — solo vuelca los favoritos que un visitante guardó antes de
// registrarse (ver local-favorites.ts) apenas detecta sesión iniciada.
export function FavoritesSync() {
  const { status } = useSession();
  const done = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || done.current) return;
    done.current = true;
    const ids = getLocalFavorites();
    if (!ids.length) return;
    mergeLocalFavorites(ids).then((result) => {
      if (!("error" in result)) clearLocalFavorites();
    });
  }, [status]);

  return null;
}
