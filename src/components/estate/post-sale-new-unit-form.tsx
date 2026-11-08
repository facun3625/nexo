"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { inputClass } from "./form-field-class";

type ActionResult = { ok: true } | { error: string };

export function NewUnitForm({ action }: { action: (form: FormData) => Promise<ActionResult> }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      className="flex flex-wrap items-start gap-2 rounded-2xl border bg-muted/20 p-4"
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
      <input
        name="label"
        placeholder="Etiqueta (ej: Torre A - 4B)"
        required
        maxLength={80}
        className={`${inputClass} flex-1`}
      />
      <input name="floor" placeholder="Piso (opcional)" maxLength={40} className={`${inputClass} w-32`} />
      <label className="flex shrink-0 flex-col gap-1 text-xs text-muted-foreground">
        Fecha de entrega (opcional)
        <input name="deliveredAt" type="date" className={inputClass} />
      </label>
      <button
        disabled={pending}
        className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {pending ? "Creando…" : "Agregar unidad"}
      </button>
      {message && <p className="w-full text-sm text-destructive">{message}</p>}
    </form>
  );
}
