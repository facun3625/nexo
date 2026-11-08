"use client";

import { useState } from "react";

import { DEFAULT_AGENT_PERMISSIONS } from "@/lib/agent-permission-types";

import { AgentSectionPermissions } from "./agent-section-permissions";
import { inputClass } from "./form-field-class";

export function AgentInitialAccessFields() {
  const [enabled, setEnabled] = useState(true);

  return (
    <section className="space-y-4 border-t pt-5 sm:col-span-2">
      <div>
        <h3 className="text-sm font-semibold">Acceso del agente</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Creá sus credenciales y definí desde ahora qué bandejas puede usar.
        </p>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          name="accessEnabled"
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Habilitar acceso al panel del agente
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">
          <span>Usuario (email)</span>
          <input
            name="loginEmail"
            type="email"
            autoComplete="username"
            required={enabled}
            disabled={!enabled}
            className={inputClass}
          />
        </label>
        <label className="space-y-1.5 text-sm font-medium">
          <span>Contraseña inicial</span>
          <input
            name="loginPassword"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={72}
            required={enabled}
            disabled={!enabled}
            className={inputClass}
          />
          <p className="text-xs font-normal text-muted-foreground">
            Mínimo 12 caracteres.
          </p>
        </label>
      </div>

      <AgentSectionPermissions permissions={DEFAULT_AGENT_PERMISSIONS} />
    </section>
  );
}
