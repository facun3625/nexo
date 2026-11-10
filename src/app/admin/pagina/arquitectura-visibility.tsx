"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setArqEnabled } from "./actions";

// Prende/apaga la sección Arquitectura en el sitio público. Se guarda al
// tocar el switch, aparte del contenido (que tiene su propio "Guardar").
export function ArquitecturaVisibility({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const result = await setArqEnabled(next);
      if ("error" in result) {
        setChecked(!next);
        toast.error(result.error);
        return;
      }
      toast.success(next ? "Sección visible en el sitio" : "Sección oculta");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex items-start justify-between gap-4 rounded-2xl border p-5">
      <div className="flex flex-col gap-1">
        <Label htmlFor="arq-enabled" className="text-base font-semibold">
          Mostrar la sección en el sitio
        </Label>
        <p className="text-sm text-muted-foreground">
          {checked
            ? "Visible: aparece en el menú y en el Inicio (si hay obras publicadas)."
            : "Oculta: no aparece en el menú ni en el Inicio, y sus páginas no se pueden abrir. Vos, como admin, las seguís viendo para armarlas."}
        </p>
      </div>
      <Switch id="arq-enabled" checked={checked} onCheckedChange={toggle} disabled={pending} />
    </div>
  );
}
