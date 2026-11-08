"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { SuggestInput } from "@/components/search/suggest-input";

// Lupa del encabezado: el buscador predictivo disponible en todo el sitio.
export function SiteSearchButton({ iconOnly = false }: { iconOnly?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Buscar propiedades"
        onClick={() => setOpen(true)}
        className={cn(
          "flex shrink-0 items-center gap-1.5 text-sm font-medium text-current opacity-85 transition-opacity hover:opacity-100",
          iconOnly && "size-9 justify-center rounded-full border border-current/20 p-0",
        )}
      >
        <Search className="size-4" />
        {!iconOnly && "Buscar"}
      </button>
      {open &&
        createPortal(
          <div role="dialog" aria-label="Buscar propiedades" className="fixed inset-0 z-[60] bg-black/40 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
            <div className="mx-auto flex w-full max-w-2xl items-center gap-3 rounded-2xl bg-background px-4 py-2 text-foreground shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <Search className="size-5 shrink-0 text-muted-foreground" />
              <SuggestInput
                endpoint="/api/search/suggest"
                ariaLabel="Ciudad, barrio o propiedad"
                placeholder="Ciudad, barrio, tipo o propiedad"
                autoFocus
                freeTextHref={(query) => `/propiedades?q=${encodeURIComponent(query)}`}
                onNavigate={() => setOpen(false)}
                className="min-w-0 flex-1 bg-transparent py-2 pr-6 text-base outline-none placeholder:text-muted-foreground"
              />
              <button type="button" aria-label="Cerrar" onClick={() => setOpen(false)} className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
