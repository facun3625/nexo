"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { DEFAULT_MAINTENANCE_HTML, type MaintenanceConfig } from "@/lib/maintenance-shared";
import { updateMaintenanceConfig, uploadRichTextImage } from "./actions";

async function handleUploadImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  const result = await uploadRichTextImage(formData);
  if (typeof result !== "string") throw new Error(result.error);
  return result;
}

export function MaintenanceForm({ config }: { config: MaintenanceConfig }) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [html, setHtml] = useState(config.html ?? DEFAULT_MAINTENANCE_HTML);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("enabled", String(enabled));
        formData.set("html", html);
        const result = await updateMaintenanceConfig(formData);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success(enabled ? "Sitio en mantenimiento" : "Sitio publicado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Poner el sitio en mantenimiento</span>
          <span className="text-xs text-muted-foreground">
            Los visitantes ven solo el logo y este mensaje. Vos y tu equipo, logueados, siguen viendo el sitio
            normal y el panel.
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
          placeholder="Ej: Estamos haciendo mejoras, volvemos pronto."
          minHeight="min-h-40"
        />
      </div>

      <Button type="button" size="sm" onClick={save} disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}
