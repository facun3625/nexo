"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function NewDevelopmentForm({
  action,
  inputClass,
}: {
  action: (form: FormData) => Promise<{ ok: true; id: string } | { error: string }>;
  inputClass: string;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="space-y-3 rounded-2xl border bg-muted/20 p-5"
      action={(form) =>
        start(async () => {
          setMessage("");
          const result = await action(form);
          if ("error" in result) setMessage(result.error);
          else router.push(`/admin/postventa/desarrollos/${result.id}`);
        })
      }
    >
      <h2 className="font-semibold">Nuevo desarrollo</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="name" placeholder="Nombre (ej: Torre Norte)" required maxLength={120} className={inputClass} />
        <input name="address" placeholder="Dirección" required maxLength={200} className={inputClass} />
        <input name="city" placeholder="Ciudad" required maxLength={120} className={inputClass} />
      </div>
      <button
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {pending ? "Creando…" : "Crear desarrollo"}
      </button>
      {message && <p className="text-sm text-destructive">{message}</p>}
    </form>
  );
}
