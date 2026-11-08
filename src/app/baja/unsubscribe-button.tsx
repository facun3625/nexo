"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { confirmUnsubscribe } from "./actions";

export function UnsubscribeButton({ email, token }: { email: string; token: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok?: true; error?: string } | null>(null);

  if (result?.ok) {
    return (
      <p className="mt-8 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
        <CheckCircle2 className="size-4 shrink-0" />
        Listo, {email} ya no va a recibir nuestros mails de novedades.
      </p>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await confirmUnsubscribe(email, token)))}
        className="inline-flex min-h-12 w-fit items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Confirmar baja
      </button>
      {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
    </div>
  );
}
