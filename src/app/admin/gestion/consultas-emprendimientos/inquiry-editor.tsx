"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ServiceInquiryStatus } from "@/generated/prisma/client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INQUIRY_STATUS_LABELS } from "@/lib/inquiry-status";
import { updateDevelopmentInquiry } from "./actions";

const statuses = Object.keys(INQUIRY_STATUS_LABELS) as ServiceInquiryStatus[];
export function DevelopmentInquiryEditor({
  id,
  initialStatus,
  internalNotes,
}: {
  id: string;
  initialStatus: ServiceInquiryStatus;
  internalNotes: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();
  function submit(data: FormData) {
    data.set("status", status);
    startTransition(async () => {
      try {
        await updateDevelopmentInquiry(id, data);
        toast.success("Consulta actualizada");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "No se pudo guardar",
        );
      }
    });
  }
  return (
    <form action={submit} className="flex flex-col gap-4 rounded-xl border p-5">
      <h2 className="font-semibold">Seguimiento</h2>
      <div className="flex flex-col gap-2">
        <Label>Estado</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            value && setStatus(value as ServiceInquiryStatus)
          }
          items={statuses.map((value) => ({
            value,
            label: INQUIRY_STATUS_LABELS[value],
          }))}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((value) => (
              <SelectItem key={value} value={value}>
                {INQUIRY_STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="internalNotes">Notas internas</Label>
        <Textarea
          id="internalNotes"
          name="internalNotes"
          rows={8}
          defaultValue={internalNotes}
          placeholder="Contacto, próximos pasos y observaciones…"
        />
      </div>
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando…" : "Guardar seguimiento"}
      </Button>
    </form>
  );
}
