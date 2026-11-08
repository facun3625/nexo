"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MailIcon } from "lucide-react";
import { subscribeToNewsletter } from "@/app/baja/subscribe-action";

// "Recibí novedades por mail": alimenta la lista de suscriptores del email
// marketing del panel.
export function NewsletterSignup() {
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="border-t border-border bg-muted/40 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailIcon className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Recibí las nuevas propiedades en tu mail</h2>
            <p className="mt-1 text-sm text-muted-foreground">Te avisamos cuando ingresan propiedades y oportunidades. Podés darte de baja cuando quieras.</p>
          </div>
        </div>
        {done ? (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" /> ¡Listo! Ya estás suscripto.
          </p>
        ) : (
          <form
            className="flex w-full flex-col gap-2 lg:w-auto"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setError(null);
              startTransition(async () => {
                const result = await subscribeToNewsletter(form);
                if ("error" in result) setError(result.error);
                else setDone(true);
              });
            }}
          >
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <input
                name="name"
                autoComplete="name"
                placeholder="Tu nombre"
                className="h-11 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary sm:w-44"
              />
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Tu mail"
                className="h-11 min-w-0 flex-1 rounded-xl border bg-background px-4 text-sm outline-none focus:border-primary sm:w-64"
              />
              <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                Suscribirme
              </button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
