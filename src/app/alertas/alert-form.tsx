"use client";
import { useState, useTransition } from "react";
import { scrollIntoViewOnMount } from "@/lib/scroll-into-view";
import { Bell, CheckCircle2 } from "lucide-react";
import { subscribeToAlerts } from "./actions";
import { SearchCriteriaFields, type SearchOptions } from "@/components/estate/search-criteria-fields";
import { inputClass } from "@/components/estate/form-field-class";

export function AlertForm({ options }: { options: SearchOptions }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <div ref={scrollIntoViewOnMount} role="status" className="flex items-start gap-3 rounded-2xl bg-primary/10 p-6 text-primary"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Tu búsqueda quedó guardada</p><p className="mt-1 text-sm">La inmobiliaria podrá ver tus requisitos y las propiedades que coinciden para contactarte.</p></div></div>;
  return <form className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8" action={(form) => start(async () => {
    setError("");
    try {
      const result = await subscribeToAlerts(form);
      if ("error" in result) setError(result.error); else setSent(true);
    } catch { setError("No se pudo conectar. Intentá nuevamente."); }
  })}>
    <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" defaultValue="" />
    <fieldset disabled={pending} className="space-y-7 disabled:opacity-60">
      <div><h2 className="text-lg font-semibold">¿Qué propiedad buscás?</h2><p className="mt-1 text-sm text-muted-foreground">Elegí tus requisitos para encontrar coincidencias precisas.</p></div>
      <SearchCriteriaFields options={options} />
      <div className="border-t pt-6"><h2 className="font-semibold">¿Cómo te contactamos?</h2><div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1.5 text-sm font-medium"><span>Nombre</span><input name="name" autoComplete="name" required minLength={2} maxLength={150} className={inputClass} /></label>
        <label className="block space-y-1.5 text-sm font-medium"><span>Teléfono / WhatsApp</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" required minLength={6} maxLength={40} placeholder="Ej: 342 4123456" className={inputClass} /></label>
        <label className="block space-y-1.5 text-sm font-medium"><span>Email</span><input name="email" type="email" autoComplete="email" required maxLength={254} className={inputClass} /></label>
      </div></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button disabled={pending} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 sm:w-auto"><Bell className="size-4" />{pending ? "Guardando…" : "Guardar mi búsqueda"}</button>
    </fieldset>
  </form>;
}
