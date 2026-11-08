"use client";
import { useState, useTransition } from "react";
import { scrollIntoViewOnMount } from "@/lib/scroll-into-view";
import { sendContactInquiry } from "./actions";
import { inputClass } from "@/components/estate/record-form";

export function ContactForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <p ref={scrollIntoViewOnMount} role="status" className="rounded-2xl bg-primary/10 p-6 text-sm text-primary">
        Recibimos tu consulta. Te vamos a responder a la brevedad.
      </p>
    );

  return (
    <form
      className="rounded-2xl border bg-card p-5 shadow-sm sm:p-8"
      action={(form) =>
        start(async () => {
          setError("");
          try {
            const result = await sendContactInquiry(form);
            if ("error" in result) setError(result.error);
            else setSent(true);
          } catch {
            setError("No se pudo conectar. Intentá nuevamente.");
          }
        })
      }
    >
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        defaultValue=""
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-1">
          Nombre
          <input name="name" type="text" required maxLength={150} className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className="block text-sm sm:col-span-1">
          Email
          <input name="email" type="email" required maxLength={254} className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className="block text-sm sm:col-span-2">
          Teléfono
          <input name="phone" type="tel" maxLength={60} className={`mt-1.5 ${inputClass}`} />
        </label>
        <label className="block text-sm sm:col-span-2">
          Tu consulta
          <textarea
            name="message"
            required
            minLength={5}
            maxLength={3000}
            rows={4}
            className={`mt-1.5 ${inputClass}`}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        disabled={pending}
        className="mt-6 min-h-12 w-full rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
      >
        {pending ? "Enviando…" : "Enviar consulta"}
      </button>
    </form>
  );
}
