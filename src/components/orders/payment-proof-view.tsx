"use client";

import { useState } from "react";
import Image from "next/image";
import { FileTextIcon, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function isPdf(url: string) {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

// Comprobante de transferencia sin salir de la página: si es PDF se abre en
// una pestaña nueva (el navegador ya lo sabe mostrar bien), si es imagen se
// ve en un modal acá mismo. Lo usan tanto la lista de pedidos del admin
// (ícono suelto) como el pedido del comprador (link de texto) — el trigger
// es customizable, así que variant/size/className y el contenido del botón
// se pueden pisar.
export function PaymentProofView({
  url,
  children,
  variant = "ghost",
  size = "icon-xs",
  className,
}: {
  url: string;
  children?: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  if (isPdf(url)) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        aria-label="Ver comprobante (PDF)"
        render={<a href={url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} />}
      >
        {children ?? <FileTextIcon className="size-4" />}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        aria-label="Ver comprobante"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children ?? <ImageIcon className="size-4" />}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-fit max-w-[90vw] p-2">
          <DialogTitle className="sr-only">Comprobante de transferencia</DialogTitle>
          <div className="relative max-h-[85vh] w-full overflow-auto">
            <Image
              src={url}
              alt="Comprobante de transferencia"
              width={800}
              height={1000}
              className="h-auto max-h-[85vh] w-auto max-w-full rounded-md object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
