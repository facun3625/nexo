"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { inputClass } from "./form-field-class";

type ActionResult = { ok: true } | { error: string };

export function PostSaleManagerAccessForm({
  managerId,
  email,
  enabled,
  hasAccount,
  action,
}: {
  managerId: string;
  email: string;
  enabled: boolean;
  hasAccount: boolean;
  action: (managerId: string, form: FormData) => Promise<ActionResult>;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  return (
    <form
      className="space-y-4"
      action={(form) =>
        start(async () => {
          setMessage("");
          const result = await action(managerId, form);
          setMessage("error" in result ? result.error : "Acceso actualizado");
          if (!("error" in result)) router.refresh();
        })
      }
    >
      <p className="text-sm text-muted-foreground">
        Ingresa en{" "}
        <a href="/agente" target="_blank" className="underline">
          /agente
        </a>{" "}
        con su email y contraseña — mismo login que un agente inmobiliario, si esta persona
        también lo es.
      </p>
      <fieldset disabled={pending} className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={enabled} /> Habilitar acceso
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Email de acceso</span>
            <input name="email" type="email" defaultValue={email} className={inputClass} />
          </label>
          <label className="space-y-1 text-sm">
            <span>{hasAccount ? "Nueva contraseña (opcional)" : "Contraseña inicial"}</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              className={inputClass}
            />
          </label>
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          {pending ? "Guardando…" : "Guardar acceso"}
        </button>
      </fieldset>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </form>
  );
}
