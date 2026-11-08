"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { updateTemplate } from "./actions";
import { STORE_TEMPLATES } from "./templates";

const TEMPLATE_INFO: Record<(typeof STORE_TEMPLATES)[number], { label: string; description: string }> = {
  clasico: { label: "Clásico", description: "Header sólido, catálogo en grilla. El diseño actual de tu sitio." },
  moderno: { label: "Moderno", description: "Portada inmersiva, buscador flotante y tarjetas con mayor impacto." },
  minimal: { label: "Minimal", description: "Mucho aire, líneas sutiles y protagonismo absoluto de las fotos." },
};

function TemplatePreview({ id }: { id: (typeof STORE_TEMPLATES)[number] }) {
  if (id === "moderno") {
    return (
      <div className="relative h-20 overflow-hidden rounded-lg bg-primary/25">
        <div className="absolute inset-x-0 top-0 flex h-4 items-center justify-between bg-foreground/80 px-2">
          <span className="h-1.5 w-5 rounded-full bg-background/90" />
          <span className="h-1 w-12 rounded-full bg-background/50" />
        </div>
        <div className="absolute left-3 top-7 h-2 w-20 rounded-full bg-foreground/70" />
        <div className="absolute bottom-2 left-3 right-3 flex h-5 items-center gap-1 rounded-full bg-background p-1 shadow-sm">
          <span className="h-full flex-1 rounded-full bg-muted" />
          <span className="size-3.5 rounded-full bg-primary" />
        </div>
      </div>
    );
  }

  if (id === "minimal") {
    return (
      <div className="h-20 rounded-lg border bg-background p-2.5">
        <div className="flex items-center justify-between border-b pb-1.5">
          <span className="h-1.5 w-6 bg-foreground/70" />
          <span className="h-1 w-12 bg-foreground/20" />
        </div>
        <div className="mt-2.5 h-2 w-2/3 bg-foreground/70" />
        <div className="mt-1 h-1 w-1/2 bg-foreground/20" />
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <span className="h-5 bg-foreground/10" />
          <span className="h-5 bg-foreground/10" />
          <span className="h-5 bg-foreground/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-md border bg-muted/40 p-2">
      <div className="h-3 rounded-sm bg-primary" />
      <div className="grid grid-cols-3 gap-1">
        <div className="h-6 rounded-sm bg-foreground/10" />
        <div className="h-6 rounded-sm bg-foreground/10" />
        <div className="h-6 rounded-sm bg-foreground/10" />
      </div>
    </div>
  );
}

export function TemplateSelectorForm({ template }: { template: string }) {
  const [selected, setSelected] = useState(template);
  const [pending, startTransition] = useTransition();

  function handleSelect(id: string) {
    if (id === selected) return;
    const previous = selected;
    setSelected(id);
    startTransition(async () => {
      const actionResult = await updateTemplate(id);
      if ("error" in actionResult) {
        toast.error(actionResult.error);
        setSelected(previous);
        return;
      }
      toast.success("Plantilla guardada");
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        Elegí la experiencia visual de tu sitio. El contenido y todas las funciones se mantienen;
        cambia por completo la forma de presentarlos.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STORE_TEMPLATES.map((id) => {
          const info = TEMPLATE_INFO[id];
          const active = selected === id;
          return (
            <button
              key={id}
              type="button"
              disabled={pending}
              onClick={() => handleSelect(id)}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-3 text-left transition disabled:opacity-60",
                active ? "border-primary ring-1 ring-primary" : "hover:border-foreground/30",
              )}
            >
              <TemplatePreview id={id} />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{info.label}</p>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
                </div>
                {active && (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-3" />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
