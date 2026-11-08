"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoreSettings } from "@/lib/settings";
import { ARGENTINA_PROVINCES } from "@/lib/argentina";
import { updateContact } from "./actions";

export function ContactForm({ settings }: { settings: StoreSettings }) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            const actionResult = await updateContact(formData);
            if ("error" in actionResult) {
              toast.error(actionResult.error);
              return;
            }
            toast.success("Datos de contacto guardados");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al guardar");
          }
        })
      }
      className="flex flex-col gap-5 rounded-lg border p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" name="address" defaultValue={settings.address ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" name="city" defaultValue={settings.city ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="province">Provincia</Label>
          <select
            id="province"
            name="province"
            defaultValue={settings.province ?? ""}
            className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="">Sin especificar</option>
            {ARGENTINA_PROVINCES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" defaultValue={settings.phone ?? ""} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email de contacto</Label>
          <Input id="email" name="email" type="email" defaultValue={settings.email ?? ""} />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
