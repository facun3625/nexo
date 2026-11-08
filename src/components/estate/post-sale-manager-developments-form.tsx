"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ActionResult = { ok: true } | { error: string };

export function PostSaleManagerDevelopmentsForm({
  managerId,
  developments,
  assignedIds,
  action,
}: {
  managerId: string;
  developments: { id: string; name: string }[];
  assignedIds: string[];
  action: (managerId: string, developmentIds: string[]) => Promise<ActionResult>;
}) {
  const [selected, setSelected] = useState(new Set(assignedIds));
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    start(async () => {
      setMessage("");
      const result = await action(managerId, Array.from(selected));
      if ("error" in result) setMessage(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-1.5 sm:grid-cols-2">
        {developments.map((d) => (
          <label
            key={d.id}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted/40"
          >
            <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)} />
            {d.name}
          </label>
        ))}
        {!developments.length && (
          <p className="text-sm text-muted-foreground">Todavía no hay desarrollos cargados.</p>
        )}
      </div>
      {developments.length > 0 && (
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {pending ? "Guardando…" : "Guardar desarrollos asignados"}
        </button>
      )}
      {message && <p className="text-sm text-destructive">{message}</p>}
    </div>
  );
}
