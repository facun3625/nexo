"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { inputClass } from "@/components/estate/form-field-class";
import { submitQrGate } from "./actions";

export function QrGateForm({ propertyId }: { propertyId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-3"
      action={(form) =>
        start(async () => {
          setError("");
          const result = await submitQrGate(form);
          if (result && "error" in result) setError(result.error);
        })
      }
    >
      <input type="hidden" name="propertyId" value={propertyId} />
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" defaultValue="" />
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Nombre</span>
        <input name="firstName" autoComplete="given-name" required minLength={2} maxLength={80} className={inputClass} />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Apellido</span>
        <input name="lastName" autoComplete="family-name" required minLength={2} maxLength={80} className={inputClass} />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">
        <span>Teléfono</span>
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={6} maxLength={40} placeholder="Ej: 342 4123456" className={inputClass} />
      </label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? "Entrando…" : "Ver la propiedad"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        La inmobiliaria usará estos datos para contactarte por esta propiedad.{" "}
        <Link href="/privacidad" className="underline">Privacidad</Link>
      </p>
    </form>
  );
}
