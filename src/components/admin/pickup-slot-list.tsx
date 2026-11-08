"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Slot = { id: string; label: string };

export function PickupSlotList({
  slots,
  onAdd,
  onDelete,
}: {
  slots: Slot[];
  onAdd: (label: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2">
      {slots.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
          <span className="text-sm">{s.label}</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await onDelete(s.id);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Error al borrar");
                }
              })
            }
          >
            Borrar
          </Button>
        </div>
      ))}
      {slots.length === 0 && (
        <p className="text-sm text-muted-foreground">Todavía no cargaste franjas horarias.</p>
      )}

      <form
        action={(formData) => {
          const label = String(formData.get("label") ?? "").trim();
          if (!label) return;
          startTransition(async () => {
            try {
              await onAdd(label);
              if (inputRef.current) inputRef.current.value = "";
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Error al agregar");
            }
          });
        }}
        className="flex items-center gap-2 pt-1"
      >
        <Input ref={inputRef} name="label" placeholder="Ej: 12:00 - 13:00" className="flex-1" />
        <Button type="submit" size="sm" disabled={pending}>
          Agregar
        </Button>
      </form>
    </div>
  );
}
