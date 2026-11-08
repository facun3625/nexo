"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SeoSettings } from "@/lib/settings";
import { removeSeoImage, updateSeoSettings } from "./actions";

export function SeoSettingsForm({
  settings,
  storeName,
}: {
  settings: SeoSettings;
  storeName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [ogImagePreview, setOgImagePreview] = useState<string | null>(settings.ogImageUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const [removePending, startRemoveTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setOgImagePreview(URL.createObjectURL(file));
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            const actionResult = await updateSeoSettings(formData);
            if ("error" in actionResult) {
              toast.error(actionResult.error);
              return;
            }
            toast.success("SEO guardado");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al guardar");
          }
        })
      }
      className="flex flex-col gap-5 rounded-lg border p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="seo-title">Título</Label>
        <Input id="seo-title" name="title" placeholder={storeName} defaultValue={settings.title ?? ""} />
        <p className="text-xs text-muted-foreground">
          Lo que aparece en la pestaña del navegador y en los resultados de Google. Vacío usa el nombre de la
          tienda.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="seo-description">Descripción</Label>
        <Textarea
          id="seo-description"
          name="description"
          rows={3}
          placeholder={`Encargá tu comida en ${storeName}`}
          defaultValue={settings.description ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          El resumen corto que se muestra debajo del título en Google y al compartir el link.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Imagen para compartir en redes</Label>
        <p className="text-xs text-muted-foreground">
          Se muestra cuando alguien comparte el link de tu tienda en WhatsApp, Instagram, etc.
        </p>
        <div className="flex aspect-[16/7] h-[200px] w-auto max-w-full items-center justify-center overflow-hidden rounded-xl bg-muted">
          {ogImagePreview && (
            <Image
              src={ogImagePreview}
              alt="Imagen para compartir"
              width={400}
              height={175}
              className="size-full object-cover"
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
            {ogImagePreview ? "Cambiar" : "Subir"}
          </Button>
          {settings.ogImageUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removePending}
              onClick={() =>
                startRemoveTransition(async () => {
                  const actionResult = await removeSeoImage();
                  if ("error" in actionResult) {
                    toast.error(actionResult.error);
                    return;
                  }
                  setOgImagePreview(null);
                  toast.success("Imagen eliminada");
                })
              }
            >
              Quitar
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          name="ogImage"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
