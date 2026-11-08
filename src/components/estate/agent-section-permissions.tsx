"use client";

import { useState } from "react";

import type {
  AgentAccessScope,
  AgentPermissions,
} from "@/lib/agent-permission-types";
import { AGENT_MENU_SECTIONS } from "@/lib/agent-permission-types";

function SectionPermission({
  section,
  initialScope,
}: {
  section: (typeof AGENT_MENU_SECTIONS)[number];
  initialScope: AgentAccessScope;
}) {
  const [enabled, setEnabled] = useState(initialScope !== "NONE");
  const [scope, setScope] = useState<Exclude<AgentAccessScope, "NONE">>(
    initialScope === "ALL" ? "ALL" : "OWN",
  );
  const fieldName = `${section.key}Access`;

  return (
    <article className="rounded-lg border bg-background p-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="block text-sm font-medium">{section.title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {section.description}
          </span>
        </span>
      </label>

      {enabled && (section.key === "inquiries" || section.key === "searches") ? (
        <fieldset className="mt-3 space-y-2 border-l-2 pl-4">
          <legend className="text-xs font-medium text-muted-foreground">
            ¿Qué puede ver?
          </legend>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={fieldName}
              value="OWN"
              checked={scope === "OWN"}
              onChange={() => setScope("OWN")}
            />
            Solo las asignadas a este agente
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name={fieldName}
              value="ALL"
              checked={scope === "ALL"}
              onChange={() => setScope("ALL")}
            />
            {section.key === "inquiries"
              ? "Todas las consultas"
              : "Todas las búsquedas"}
          </label>
        </fieldset>
      ) : !enabled ? (
        <input type="hidden" name={fieldName} value="NONE" />
      ) : <input type="hidden" name={fieldName} value="ALL" />}
    </article>
  );
}

export function AgentSectionPermissions({
  permissions,
}: {
  permissions: AgentPermissions;
}) {
  return (
    <section className="space-y-3 rounded-xl border bg-muted/20 p-4">
      <div>
        <p className="font-medium">Permisos por sección</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Marcá cada ítem del menú que puede usar. En las consultas y búsquedas
          también definí si ve sólo lo asignado a él o toda la información.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENT_MENU_SECTIONS.map((section) => (
          <SectionPermission
            key={section.key}
            section={section}
            initialScope={permissions[section.key]}
          />
        ))}
      </div>
    </section>
  );
}
