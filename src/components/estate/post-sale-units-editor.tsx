"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, XIcon } from "lucide-react";

import { inputClass } from "./form-field-class";

type Owner = { membershipId: string; contactId: string; name: string | null; taxId: string | null };
type Unit = { id: string; label: string; floor: string | null; owners: Owner[] };
type ActionResult = { ok: true } | { error: string };

export function DevelopmentUnitsEditor({
  units,
  addOwnerAction,
  removeOwnerAction,
}: {
  units: Unit[];
  addOwnerAction: (unitId: string, form: FormData) => Promise<ActionResult>;
  removeOwnerAction: (unitMemberId: string) => Promise<ActionResult>;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);
  const router = useRouter();

  function run(action: () => Promise<ActionResult>, onOk?: () => void) {
    start(async () => {
      setMessage("");
      const result = await action();
      if ("error" in result) setMessage(result.error);
      else {
        onOk?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {message && (
        <p role="status" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {message}
        </p>
      )}

      <div className="divide-y rounded-2xl border bg-card">
        {units.map((unit) => (
          <div key={unit.id}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-sm">
              <div className="flex shrink-0 items-baseline gap-1.5">
                <span className="font-medium">{unit.label}</span>
                {unit.floor && <span className="text-xs text-muted-foreground">Piso {unit.floor}</span>}
              </div>

              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                {unit.owners.map((owner) => (
                  <span
                    key={owner.membershipId}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/60 py-0.5 pl-2.5 pr-1 text-xs"
                  >
                    {owner.name ?? "Sin nombre"}
                    {owner.taxId && <span className="text-muted-foreground">· DNI {owner.taxId}</span>}
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => removeOwnerAction(owner.membershipId))}
                      className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Quitar a ${owner.name ?? owner.taxId ?? "propietario"}`}
                    >
                      <XIcon className="size-3" />
                    </button>
                  </span>
                ))}
                {!unit.owners.length && (
                  <span className="text-xs text-muted-foreground">Sin propietarios</span>
                )}
              </div>

              <button
                type="button"
                disabled={pending}
                onClick={() => setOpenUnitId(openUnitId === unit.id ? null : unit.id)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-muted"
              >
                <PlusIcon className="size-3" />
                {unit.owners.length ? "Co-propietario" : "Propietario"}
              </button>
            </div>

            {openUnitId === unit.id && (
              <form
                className="border-t bg-muted/20 px-4 py-3"
                action={(form) =>
                  run(
                    () => addOwnerAction(unit.id, form),
                    () => setOpenUnitId(null),
                  )
                }
              >
                {unit.owners.length > 0 && (
                  <p className="mb-2 text-xs text-muted-foreground">
                    Esta unidad ya tiene un propietario cargado — usá esto solo si hay más de un
                    dueño (ej: cónyuges, herederos).
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-4">
                  <input name="name" placeholder="Nombre y apellido" required maxLength={120} className={inputClass} />
                  <input name="taxId" placeholder="DNI" required maxLength={40} className={inputClass} />
                  <input name="email" type="email" placeholder="Email (opcional)" maxLength={254} className={inputClass} />
                  <input name="phone" placeholder="Teléfono (opcional)" maxLength={40} className={inputClass} />
                </div>
                <button
                  disabled={pending}
                  className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  {pending ? "Guardando…" : unit.owners.length ? "Agregar co-propietario" : "Agregar propietario"}
                </button>
              </form>
            )}
          </div>
        ))}
        {!units.length && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Todavía no hay unidades en este desarrollo. Agregá la primera desde &ldquo;Nueva
            unidad&rdquo;.
          </p>
        )}
      </div>
    </div>
  );
}
