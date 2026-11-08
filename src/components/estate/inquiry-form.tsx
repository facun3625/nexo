"use client";
import { useState, useTransition } from "react";
import { scrollIntoViewOnMount } from "@/lib/scroll-into-view";
import { inquireProperty } from "@/app/propiedades/actions";
import { inputClass } from "./record-form";
export function InquiryForm({ propertyId }: { propertyId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <p ref={scrollIntoViewOnMount} role="status" className="rounded-xl bg-emerald-500/10 p-5 text-sm">
        Recibimos tu consulta. La inmobiliaria se comunicará con vos.
      </p>
    );
  return (
    <form
      className="space-y-4"
      action={(form) =>
        start(async () => {
          setError("");
          try {
            const result = await inquireProperty(form);
            if ("error" in result) setError(result.error);
            else setSent(true);
          } catch {
            setError("No se pudo conectar. Intentá nuevamente.");
          }
        })
      }
    >
      <input type="hidden" name="propertyId" value={propertyId} />
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        defaultValue=""
      />
      {[
        ["name", "Nombre", "text"],
        ["email", "Email", "email"],
        ["phone", "Teléfono", "tel"],
      ].map(([name, label, type]) => (
        <label key={name} className="block text-sm">
          {label}
          <input
            name={name}
            type={type}
            required
            maxLength={254}
            className={inputClass}
          />
        </label>
      ))}
      <label className="block text-sm">
        Tu consulta
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={3000}
          rows={4}
          className={inputClass}
          defaultValue="Hola, me interesa esta propiedad. Quisiera recibir más información."
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Usaremos estos datos para responder tu consulta.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        disabled={pending}
        className="min-h-12 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Consultar por esta propiedad"}
      </button>
    </form>
  );
}
