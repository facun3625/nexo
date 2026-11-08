"use client";

import type { ReactNode } from "react";
import { QrCodeIcon } from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function PropertyQrButton({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex w-full items-center justify-center gap-2 rounded-xl border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted">
        <QrCodeIcon className="size-4" />
        QR de la propiedad
      </DialogTrigger>
      <DialogContent className="p-6 sm:max-w-2xl">
        <DialogTitle className="sr-only">QR de la propiedad</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
