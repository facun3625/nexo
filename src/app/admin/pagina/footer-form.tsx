"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { StoreSettings } from "@/lib/settings";
import { updateFooter } from "./actions";

export function FooterForm({ settings }: { settings: StoreSettings }) {
  const [pending, startTransition] = useTransition();
  const [tagline, setTagline] = useState(settings.footerTagline);
  const [pitchText, setPitchText] = useState(settings.footerPitchText);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            formData.set("footerTagline", tagline);
            formData.set("footerPitchText", pitchText);
            const actionResult = await updateFooter(formData);
            if ("error" in actionResult) {
              toast.error(actionResult.error);
              return;
            }
            toast.success("Footer guardado");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al guardar");
          }
        })
      }
      className="flex flex-col gap-5 rounded-lg border p-4"
    >
      <p className="text-sm text-muted-foreground">
        El resto del footer (logo, dirección, teléfono, redes) sale de Identidad, Contacto y
        Redes. Acá solo van los textos propios del footer.
      </p>

      <div className="flex flex-col gap-2">
        <Label>Texto debajo del logo</Label>
        <RichTextEditor html={tagline} onChangeHtml={setTagline} minHeight="min-h-16" />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="footerPitchTitle">
          Título de la franja &quot;¿Desea vender o alquilar?&quot;
        </Label>
        <Input
          id="footerPitchTitle"
          name="footerPitchTitle"
          defaultValue={settings.footerPitchTitle}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Texto de esa franja</Label>
        <RichTextEditor html={pitchText} onChangeHtml={setPitchText} minHeight="min-h-20" />
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
