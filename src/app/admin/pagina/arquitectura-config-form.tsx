"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ArqConfig } from "@/lib/arquitectura";
import { saveArqConfig } from "./actions";

const SUGGESTIONS = ["Arquitectura", "Emprendimientos", "Desarrollos", "Proyectos"];

function PageToggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id} className="font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// Nombre y páginas de la sección. Se guarda con su propio botón.
export function ArquitecturaConfigForm({ config }: { config: ArqConfig }) {
  const router = useRouter();
  const [data, setData] = useState<ArqConfig>(config);
  const [saving, startSaving] = useTransition();
  const set = (patch: Partial<ArqConfig>) => setData((d) => ({ ...d, ...patch }));

  function save() {
    startSaving(async () => {
      const result = await saveArqConfig(JSON.stringify(data));
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Guardado");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-6 rounded-2xl border p-5">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold">Nombre y páginas</span>
        <p className="text-sm text-muted-foreground">
          Cómo se llama la sección en el menú y en el sitio, y qué páginas tiene.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="arq-label">Nombre de la sección</Label>
          <Input id="arq-label" value={data.label} maxLength={40} onChange={(e) => set({ label: e.target.value })} />
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.filter((s) => s !== data.label).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set({ label: s })}
                className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="arq-obras-label">Nombre de la página de obras</Label>
          <Input
            id="arq-obras-label"
            value={data.obrasLabel}
            maxLength={40}
            onChange={(e) => set({ obrasLabel: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Por ejemplo &quot;Obras&quot;, &quot;Emprendimientos&quot; o &quot;Proyectos&quot;.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Páginas de la sección</Label>
        <PageToggle
          id="arq-equipo"
          label="Equipo"
          description="Presentación del estudio, con fotos y galería."
          checked={data.equipo}
          onChange={(equipo) => set({ equipo })}
        />
        <PageToggle
          id="arq-servicios"
          label="Servicios"
          description="Lista de servicios que ofrecen."
          checked={data.servicios}
          onChange={(servicios) => set({ servicios })}
        />
        <p className="text-sm text-muted-foreground">
          La página de {data.obrasLabel.toLowerCase() || "obras"} siempre se muestra. Si apagás Equipo y
          Servicios, el menú lleva directo a esa página, sin desplegable.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-t pt-5">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Bloque en el Inicio</span>
          <p className="text-sm text-muted-foreground">
            Aparece debajo de las propiedades destacadas cuando hay obras publicadas.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="arq-home-title">Título</Label>
          <Input
            id="arq-home-title"
            value={data.homeTitle}
            maxLength={120}
            onChange={(e) => set({ homeTitle: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="arq-home-text">Texto</Label>
          <Textarea
            id="arq-home-text"
            rows={2}
            value={data.homeText}
            maxLength={300}
            onChange={(e) => set({ homeText: e.target.value })}
          />
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        onClick={save}
        disabled={saving || !data.label.trim() || !data.obrasLabel.trim()}
        className="self-start"
      >
        {saving ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}
