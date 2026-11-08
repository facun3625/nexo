import Link from "next/link";
import { LayoutGrid, Map as MapIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function ViewToggle({ active, query }: { active: "list" | "map"; query: string }) {
  const qs = query ? `?${query}` : "";
  return (
    <div className="inline-flex shrink-0 items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
      <Link
        href={`/propiedades${qs}`}
        aria-current={active === "list" ? "page" : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
          active === "list"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-4" />
        Lista
      </Link>
      <Link
        href={`/mapa${qs}`}
        aria-current={active === "map" ? "page" : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
          active === "map"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <MapIcon className="size-4" />
        Mapa
      </Link>
    </div>
  );
}

// Se usa para pasarle a la otra vista (lista <-> mapa) los mismos filtros
// activos — "page" se excluye a propósito: cambiar de vista arranca en la
// primera página/el mapa completo, no en la página en la que te quedaste.
export function toResultsQueryString(search: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (key === "page" || !value) continue;
    params.set(key, value);
  }
  return params.toString();
}
