"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SelectField } from "./select-field";

type ActionResult = { ok: true } | { error: string };
type Option = { id: string; label: string };

export function PostSaleClaimAssignment({
  claimId,
  managers,
  currentManagerId,
  providers,
  currentProviderId,
  assignManagerAction,
  assignProviderAction,
}: {
  claimId: string;
  managers: Option[];
  currentManagerId: string | null;
  providers: Option[];
  currentProviderId: string | null;
  assignManagerAction: (claimId: string, managerId: string) => Promise<ActionResult>;
  assignProviderAction: (claimId: string, providerId: string) => Promise<ActionResult>;
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
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span>Administrador</span>
        <SelectField
          disabled={pending}
          defaultValue={currentManagerId ?? ""}
          onChange={(e) => run(() => assignManagerAction(claimId, e.target.value))}
        >
          <option value="">Sin asignar</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </SelectField>
        {!managers.length && (
          <span className="block text-xs text-muted-foreground">
            Ningún administrador tiene este desarrollo asignado todavía.
          </span>
        )}
      </label>

      <label className="space-y-1 text-sm">
        <span>Derivar a proveedor</span>
        <SelectField
          disabled={pending}
          defaultValue={currentProviderId ?? ""}
          onChange={(e) => run(() => assignProviderAction(claimId, e.target.value))}
        >
          <option value="">Sin derivar</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </SelectField>
      </label>

      {message && <p className="sm:col-span-2 text-sm text-destructive">{message}</p>}
    </div>
  );
}
