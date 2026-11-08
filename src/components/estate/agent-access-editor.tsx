"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAgentAccess } from "@/app/admin/gestion/agent-access-actions";
import { inputClass } from "./form-field-class";
import type { AgentPermissions } from "@/lib/agent-permission-types";
import { AgentSectionPermissions } from "./agent-section-permissions";

export function AgentAccessEditor({
  agentId,
  email,
  enabled,
  hasAccount,
  permissions,
}: {
  agentId: string;
  email: string;
  enabled: boolean;
  hasAccount: boolean;
  permissions: AgentPermissions;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="mb-6 space-y-4 rounded-xl border bg-muted/20 p-4"
      action={(form) =>
        start(async () => {
          setMessage("");
          try {
            const result = await saveAgentAccess(agentId, form);
            setMessage("error" in result ? result.error : "Acceso actualizado");
            if (!("error" in result)) router.refresh();
          } catch {
            setMessage("No se pudo guardar el acceso");
          }
        })
      }
    >
      <h3 className="font-semibold">Acceso personal del agente</h3>
      <p className="text-sm text-muted-foreground">
        Ingresa en{" "}
        <a href="/agente" target="_blank" className="underline">
          /agente
        </a>{" "}
        con su email y contraseña. Compartí las credenciales directamente con el
        agente.
      </p>
      <fieldset disabled={pending} className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked={enabled} />{" "}
          Habilitar acceso
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span>Email de acceso</span>
            <input
              name="email"
              type="email"
              defaultValue={email}
              className={inputClass}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>
              {hasAccount
                ? "Nueva contraseña (opcional)"
                : "Contraseña inicial"}
            </span>
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
        <AgentSectionPermissions permissions={permissions} />
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
