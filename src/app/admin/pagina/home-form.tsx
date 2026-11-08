"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { StoreSettings } from "@/lib/settings";
import { ImageField } from "./image-field";
import { removeStoreImage, updateHome } from "./actions";

export function HomeForm({ settings }: { settings: StoreSettings }) {
  const [pending, startTransition] = useTransition();
  const [coverPreview, setCoverPreview] = useState<string | null>(settings.coverUrl);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            const actionResult = await updateHome(formData);
            if ("error" in actionResult) {
              toast.error(actionResult.error);
              return;
            }
            toast.success("Inicio guardado");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al guardar");
          }
        })
      }
      className="flex flex-col gap-5 rounded-lg border p-4"
    >
      <ImageField
        label="Foto de portada (se usa en el header y en Sobre nosotros)"
        name="cover"
        shape="wide"
        preview={coverPreview}
        onPreviewChange={setCoverPreview}
        onRemove={
          settings.coverUrl
            ? async () => {
                const actionResult = await removeStoreImage("store_cover_url");
                if ("error" in actionResult) {
                  toast.error(actionResult.error);
                  return;
                }
                setCoverPreview(null);
                toast.success("Portada eliminada");
              }
            : undefined
        }
      />

      <Button type="submit" disabled={pending} className="self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
