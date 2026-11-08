"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoreSettings } from "@/lib/settings";
import { updateSocial } from "./actions";

export function SocialForm({ settings }: { settings: StoreSettings }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            const actionResult = await updateSocial(formData);
            if ("error" in actionResult) {
              toast.error(actionResult.error);
              return;
            }
            toast.success("Redes guardadas");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al guardar");
          }
        })
      }
      className="flex flex-col gap-5 rounded-lg border p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            placeholder="Número o link de wa.me"
            defaultValue={settings.whatsapp ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            name="instagram"
            placeholder="@usuario o link"
            defaultValue={settings.instagram ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="facebook">Facebook</Label>
          <Input
            id="facebook"
            name="facebook"
            placeholder="@página o link"
            defaultValue={settings.facebook ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="youtube">YouTube</Label>
          <Input
            id="youtube"
            name="youtube"
            placeholder="@canal o link"
            defaultValue={settings.youtube ?? ""}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        La que dejes vacía no aparece en el sitio.
      </p>

      <Button type="submit" disabled={pending} className="self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
