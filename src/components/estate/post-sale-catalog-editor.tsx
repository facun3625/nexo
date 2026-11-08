"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { inputClass } from "./form-field-class";

type Rubro = { id: string; name: string; isCatchAll: boolean; warrantyMonths: number | null };
type Section = { id: string; name: string; rubros: Rubro[] };
type ActionResult = { ok: true } | { error: string };

// Reusable tanto para el catálogo default del tenant (developmentId null)
// como para el catálogo instancia de un desarrollo — quién llama decide qué
// server actions pasar, este componente no conoce esa diferencia.
export function CatalogEditor({
  sections,
  readOnly = false,
  createSectionAction,
  deleteSectionAction,
  createRubroAction,
  deleteRubroAction,
}: {
  sections: Section[];
  readOnly?: boolean;
  createSectionAction: (form: FormData) => Promise<ActionResult>;
  deleteSectionAction: (sectionId: string) => Promise<ActionResult>;
  createRubroAction: (sectionId: string, form: FormData) => Promise<ActionResult>;
  deleteRubroAction: (rubroId: string) => Promise<ActionResult>;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  function run(action: () => Promise<ActionResult>) {
    start(async () => {
      setMessage("");
      const result = await action();
      if ("error" in result) setMessage(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {message && (
        <p role="status" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{section.name}</h3>
              {!readOnly && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteSectionAction(section.id))}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Eliminar sección ${section.name}`}
                >
                  <Trash2Icon className="size-4" />
                </button>
              )}
            </div>

            <ul className="mt-3 flex flex-wrap gap-2">
              {section.rubros.map((rubro) => (
                <li
                  key={rubro.id}
                  className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-xs"
                >
                  {rubro.name}
                  <span className="text-muted-foreground">
                    {rubro.warrantyMonths != null ? `· ${rubro.warrantyMonths}m` : "· sin garantía"}
                  </span>
                  {!readOnly && !rubro.isCatchAll && (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => deleteRubroAction(rubro.id))}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Eliminar rubro ${rubro.name}`}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {!readOnly && (
              <form
                className="mt-3 flex gap-2"
                action={(form) => run(() => createRubroAction(section.id, form))}
              >
                <input
                  name="name"
                  placeholder="Nuevo rubro (ej: pintura)"
                  required
                  maxLength={80}
                  className={`${inputClass} flex-1`}
                />
                <input
                  name="warrantyMonths"
                  type="number"
                  min={0}
                  max={600}
                  placeholder="Meses de garantía"
                  className={`${inputClass} w-40`}
                />
                <button
                  disabled={pending}
                  className="shrink-0 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  Agregar
                </button>
              </form>
            )}
          </div>
        ))}

        {!sections.length && (
          <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Todavía no hay secciones en este catálogo.
          </p>
        )}
      </div>

      {!readOnly && (
        <form
          className="flex gap-2 rounded-2xl border bg-muted/20 p-4"
          action={(form) => run(() => createSectionAction(form))}
        >
          <input
            name="name"
            placeholder="Nueva sección (ej: dormitorio)"
            required
            maxLength={80}
            className={`${inputClass} flex-1`}
          />
          <button
            disabled={pending}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {pending ? "Guardando…" : "Agregar sección"}
          </button>
        </form>
      )}
    </div>
  );
}
