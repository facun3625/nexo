"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { inputClass } from "./form-field-class";

type ActionResult = { ok: true } | { error: string };

export function NewPostSaleProviderForm({ action }: { action: (form: FormData) => Promise<ActionResult> }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      className="space-y-3 rounded-2xl border bg-muted/20 p-5"
      action={(form) =>
        start(async () => {
          setMessage("");
          const result = await action(form);
          if ("error" in result) setMessage(result.error);
          else {
            formRef.current?.reset();
            router.refresh();
          }
        })
      }
    >
      <h2 className="font-semibold">Nuevo proveedor</h2>
      <div className="grid gap-3 sm:grid-cols-4">
        <input name="name" placeholder="Nombre" required maxLength={120} className={inputClass} />
        <input name="specialty" placeholder="Especialidad (ej: plomería)" maxLength={120} className={inputClass} />
        <input name="phone" placeholder="Teléfono" maxLength={40} className={inputClass} />
        <input name="email" type="email" placeholder="Email (opcional)" maxLength={254} className={inputClass} />
      </div>
      <button
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {pending ? "Creando…" : "Crear proveedor"}
      </button>
      {message && <p className="text-sm text-destructive">{message}</p>}
    </form>
  );
}
