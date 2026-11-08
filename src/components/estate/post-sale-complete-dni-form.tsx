"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { inputClass } from "./form-field-class";

export function CompleteDniForm({
  action,
}: {
  action: (form: FormData) => Promise<{ ok: true } | { error: string }>;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="flex w-full flex-col gap-3"
      action={(form) =>
        start(async () => {
          setMessage("");
          const result = await action(form);
          if ("error" in result) setMessage(result.error);
          else router.push("/posventa");
        })
      }
    >
      <input
        name="taxId"
        placeholder="DNI"
        required
        maxLength={40}
        autoComplete="off"
        className={inputClass}
      />
      <button
        disabled={pending}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        {pending ? "Verificando…" : "Continuar"}
      </button>
      {message && <p className="text-sm text-destructive">{message}</p>}
    </form>
  );
}
