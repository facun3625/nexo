"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { inputClass } from "./form-field-class";
import { SelectField } from "./select-field";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Nuevo",
  ASSIGNED: "Asignado",
  IN_PROGRESS: "En progreso",
  RESOLVED: "Resuelto",
  REJECTED: "Rechazado",
  CLOSED: "Cerrado",
};
const STATUS_OPTIONS = Object.keys(STATUS_LABEL);

export function PostSaleClaimStatusForm({
  claimId,
  currentStatus,
  action,
  statusOptions = STATUS_OPTIONS,
}: {
  claimId: string;
  currentStatus: string;
  action: (claimId: string, form: FormData) => Promise<{ ok: true } | { error: string }>;
  statusOptions?: string[];
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      className="space-y-3"
      action={(form) =>
        start(async () => {
          setMessage("");
          const result = await action(claimId, form);
          if ("error" in result) setMessage(result.error);
          else {
            formRef.current?.reset();
            router.refresh();
          }
        })
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <SelectField name="status" defaultValue={currentStatus} disabled={pending} className="w-auto">
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </SelectField>
        <button
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {pending ? "Guardando…" : "Actualizar"}
        </button>
      </div>
      <textarea
        name="notes"
        rows={2}
        maxLength={4000}
        placeholder="Nota para el historial (opcional)"
        className={inputClass}
      />
      {message && <p className="text-sm text-destructive">{message}</p>}
    </form>
  );
}
