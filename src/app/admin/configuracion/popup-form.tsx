"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import type { PopupConfig, PopupFrequency } from "@/lib/popup";
import { updatePopupConfig, uploadRichTextImage } from "./actions";

async function handleUploadImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  const result = await uploadRichTextImage(formData);
  if (typeof result !== "string") throw new Error(result.error);
  return result;
}

const FREQUENCY_LABELS: Record<PopupFrequency, string> = {
  ONCE: "Una vez (no vuelve a aparecer)",
  SESSION: "Una vez por visita/sesión",
  ALWAYS: "Siempre que entren a la tienda",
};

export function PopupForm({ config }: { config: PopupConfig }) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [html, setHtml] = useState(config.html ?? "");
  const [frequency, setFrequency] = useState<PopupFrequency>(config.frequency);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("enabled", String(enabled));
        formData.set("frequency", frequency);
        formData.set("html", html);
        const actionResult = await updatePopupConfig(formData);
        if ("error" in actionResult) {
          toast.error(actionResult.error);
          return;
        }
        toast.success("Guardado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Mostrar pop-up de bienvenida</span>
          <span className="text-xs text-muted-foreground">
            Aparece apenas alguien entra a la tienda, antes de ver el catálogo.
          </span>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Mensaje</Label>
        <RichTextEditor
          html={html}
          onChangeHtml={setHtml}
          onUploadImage={handleUploadImage}
          placeholder="Escribí el anuncio…"
          minHeight="min-h-40"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Frecuencia</Label>
        <Select value={frequency} onValueChange={(v) => v && setFrequency(v as PopupFrequency)}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue>{FREQUENCY_LABELS[frequency]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(FREQUENCY_LABELS) as PopupFrequency[]).map((f) => (
              <SelectItem key={f} value={f}>
                {FREQUENCY_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="button" size="sm" onClick={save} disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}
