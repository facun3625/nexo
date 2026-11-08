"use client";
import { useState, useTransition } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/estate/form-field-class";
import { useAdminTheme } from "@/components/admin/admin-theme-root";
import { saveEstateRecord } from "@/app/admin/gestion/actions";

// Alta rápida de un EstateContact desde otra ficha (inquilino o garante de
// un contrato) — reutiliza saveEstateRecord("clientes", ...) en vez de una
// acción propia, fijando el rol según de dónde se abrió el modal.
export function ContactQuickCreateModal({
  open,
  role,
  title,
  onClose,
  onCreated,
}: {
  open: boolean;
  role: "TENANT" | "GUARANTOR";
  title: string;
  onClose: () => void;
  onCreated: (contact: { id: string; label: string }) => void;
}) {
  const { containerRef } = useAdminTheme();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(form: FormData) {
    setError("");
    const name = String(form.get("name") ?? "").trim();
    start(async () => {
      form.set("roles", role);
      const result = await saveEstateRecord("clientes", null, form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onCreated({ id: result.id, label: name });
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent container={containerRef}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Nombre *</label>
            <input name="name" required autoFocus className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input name="email" type="email" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Teléfono</label>
            <input name="phone" className={inputClass} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">DNI / CUIT</label>
            <input name="taxId" className={inputClass} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando…" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
