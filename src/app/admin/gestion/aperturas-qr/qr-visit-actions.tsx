"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/components/admin/confirm-provider";
import { WhatsAppIcon } from "@/components/catalog/social-icons";
import { deleteQrVisit, markAllQrVisitsHandled, markQrVisitHandled } from "./actions";

type Result = { ok: true } | { error: string };

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const run = (action: () => Promise<Result>) =>
    start(async () => {
      setError("");
      const result = await action();
      if ("error" in result) setError(result.error);
      else router.refresh();
    });
  return { pending, error, run };
}

export function QrVisitActions({ id, handled, whatsappHref }: { id: string; handled: boolean; whatsappHref: string }) {
  const confirm = useConfirm();
  const { pending, error, run } = useRun();
  return (
    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (!handled) run(() => markQrVisitHandled(id));
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white hover:brightness-105"
      >
        <WhatsAppIcon className="size-4" />
        Escribir por WhatsApp
      </a>
      {!handled && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => markQrVisitHandled(id))}
          className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          Marcar como vista
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (await confirm({ description: "¿Borrar esta apertura de QR?", confirmLabel: "Borrar", destructive: true })) run(() => deleteQrVisit(id));
        }}
        className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
      >
        Borrar
      </button>
      {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function MarkAllQrVisitsButton() {
  const { pending, error, run } = useRun();
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(markAllQrVisitsHandled)}
        className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
      >
        Marcar todas como vistas
      </button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </>
  );
}
