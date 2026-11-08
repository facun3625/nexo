"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

type ActionResult = { ok: true } | { error: string };

export function CustomizeCatalogButton({
  action,
}: {
  action: () => Promise<ActionResult>;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await action();
          if (!("error" in result)) router.refresh();
        })
      }
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    >
      {pending ? "Guardando…" : "Personalizar catálogo para este desarrollo"}
    </button>
  );
}
