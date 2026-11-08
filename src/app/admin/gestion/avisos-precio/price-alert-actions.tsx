"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useConfirm } from "@/components/admin/confirm-provider";
import { WhatsAppIcon } from "@/components/catalog/social-icons";
import { deletePriceAlert, markPriceAlertNotified } from "./actions";

export function PriceAlertActions({
  id,
  dropped,
  whatsappHref,
  mailHref,
}: {
  id: string;
  dropped: boolean;
  whatsappHref: string | null;
  mailHref: string | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const run = (action: () => Promise<{ ok: true } | { error: string }>) =>
    start(async () => {
      setError("");
      const result = await action();
      if ("error" in result) setError(result.error);
      else router.refresh();
    });

  return (
    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => run(() => markPriceAlertNotified(id))}
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white hover:brightness-105"
        >
          <WhatsAppIcon className="size-4" />
          Avisar por WhatsApp
        </a>
      )}
      {mailHref && (
        <Link href={mailHref} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Avisar por mail
        </Link>
      )}
      {dropped && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => markPriceAlertNotified(id))}
          className="rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          Marcar como avisado
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          if (await confirm({ description: "¿Borrar este aviso de baja de precio?", confirmLabel: "Borrar", destructive: true })) run(() => deletePriceAlert(id));
        }}
        className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
      >
        Borrar
      </button>
      {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
    </div>
  );
}
