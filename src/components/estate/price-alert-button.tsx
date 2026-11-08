"use client";

import { useState, useTransition } from "react";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";

import { inputClass } from "@/components/estate/form-field-class";
import { subscribeToPriceDrop } from "@/app/propiedades/price-alert-action";

type Offer = { operation: string; label: string };

// Botón de la ficha: se despliega un formulario corto y queda anotado en
// el panel, en «Avisarme si baja el precio».
export function PriceAlertButton({ propertyId, offers }: { propertyId: string; offers: Offer[] }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  if (sent)
    return (
      <p role="status" className="flex items-start gap-2 rounded-xl bg-primary/10 p-4 text-sm text-primary">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        Listo. Te vamos a avisar si baja el precio de esta propiedad.
      </p>
    );

  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
      >
        <BellRing className="size-4" />
        Avisarme si baja el precio
      </button>
    );

  return (
    <form
      className="space-y-3 rounded-xl border p-4"
      action={(form) =>
        start(async () => {
          setError("");
          const result = await subscribeToPriceDrop(form);
          if ("error" in result) setError(result.error);
          else setSent(true);
        })
      }
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <BellRing className="size-4" />
        Avisarme si baja el precio
      </p>
      <input type="hidden" name="propertyId" value={propertyId} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" defaultValue="" />
      {offers.length > 1 ? (
        <select name="operation" aria-label="Oferta" className={inputClass} defaultValue={offers[0].operation}>
          {offers.map((o) => (
            <option key={o.operation} value={o.operation}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input type="hidden" name="operation" value={offers[0].operation} />
      )}
      <input name="name" aria-label="Nombre" placeholder="Nombre" autoComplete="name" required minLength={2} maxLength={150} className={inputClass} />
      <input name="phone" type="tel" aria-label="Teléfono" placeholder="Teléfono / WhatsApp" autoComplete="tel" required minLength={6} maxLength={40} className={inputClass} />
      <input name="email" type="email" aria-label="Mail" placeholder="Mail" autoComplete="email" required maxLength={254} className={inputClass} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Guardando…" : "Avisarme"}
      </button>
    </form>
  );
}
