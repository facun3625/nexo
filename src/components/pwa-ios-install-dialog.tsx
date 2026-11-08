"use client";

import { Share2Icon, PlusSquareIcon, CompassIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// iOS no permite disparar el instalador por código (todo navegador ahí
// corre sobre WebKit) — es el único camino real, hay que explicarlo.
// Compartido entre el panel admin y el storefront de cada tienda: cada uno
// pasa su propio title/description.
export function PwaIosInstallDialog({
  open,
  onOpenChange,
  title = "Instalar el panel",
  description = "Agregalo a tu pantalla de inicio en dos pasos.",
  needsSafari = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  // true cuando se detectó Chrome/Firefox/Edge en iOS: ninguno de esos
  // navegadores puede instalar la PWA (esa capacidad no existe fuera de
  // Safari en iOS), así que en vez de las instrucciones de "Compartir" se
  // muestra un aviso para que reabran el sitio en Safari.
  needsSafari?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{needsSafari ? "Abrí esta página en Safari" : title}</DialogTitle>
          <DialogDescription>
            {needsSafari
              ? "En iPhone/iPad, instalar la app solo funciona desde Safari — es una limitación de iOS, no de este navegador."
              : description}
          </DialogDescription>
        </DialogHeader>
        {needsSafari ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
            <CompassIcon className="size-4 shrink-0 text-muted-foreground" />
            <span>Copiá el link de arriba y abrilo en Safari para poder instalarla</span>
          </div>
        ) : (
          <ol className="grid gap-3 text-sm">
            <li className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
              <Share2Icon className="size-4 shrink-0 text-muted-foreground" />
              <span>Tocá el ícono de Compartir en la barra de Safari</span>
            </li>
            <li className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
              <PlusSquareIcon className="size-4 shrink-0 text-muted-foreground" />
              <span>Elegí &quot;Agregar a inicio&quot;</span>
            </li>
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
