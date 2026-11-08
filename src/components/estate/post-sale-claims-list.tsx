"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

import { ClickableRow } from "./clickable-row";

const STATUS_LABEL: Record<string, string> = {
  NEW: "Nuevo",
  ASSIGNED: "Asignado",
  IN_PROGRESS: "En progreso",
  RESOLVED: "Resuelto",
  REJECTED: "Rechazado",
  CLOSED: "Cerrado",
};
const STATUS_OPTIONS = Object.keys(STATUS_LABEL);

type Claim = {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  developmentName?: string;
  unitLabel: string;
  sectionName: string;
  rubroName: string;
  contactName: string | null;
  photos: string[];
  unread?: number;
};

export function PostSaleClaimsList({
  claims,
  updateStatusAction,
  emptyMessage = "Todavía no hay reclamos.",
}: {
  claims: Claim[];
  updateStatusAction: (claimId: string, form: FormData) => Promise<{ ok: true } | { error: string }>;
  emptyMessage?: string;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  function submit(claimId: string, form: FormData) {
    start(async () => {
      setMessage("");
      const result = await updateStatusAction(claimId, form);
      if ("error" in result) setMessage(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {message && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{message}</p>}

      <div className="divide-y rounded-2xl border bg-card">
        {claims.map((claim) => (
          <ClickableRow
            key={claim.id}
            href={`/admin/postventa/reclamos/${claim.id}`}
            className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-sm transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate">
                {claim.developmentName && (
                  <span className="mr-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                    {claim.developmentName}
                  </span>
                )}
                <span className="font-medium">{claim.title}</span>
                {!!claim.unread && (
                  <span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {claim.unread}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {" — "}
                  {claim.unitLabel} · {claim.sectionName}/{claim.rubroName}
                  {claim.contactName && ` · ${claim.contactName}`}
                  {claim.description && ` · ${claim.description}`}
                </span>
              </p>
            </div>

            {claim.photos.length > 0 && (
              <div className="flex shrink-0 -space-x-2">
                {claim.photos.slice(0, 4).map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block size-7 overflow-hidden rounded-full border-2 border-card"
                    style={{ zIndex: claim.photos.length - i }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                  </a>
                ))}
                {claim.photos.length > 4 && (
                  <span className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
                    +{claim.photos.length - 4}
                  </span>
                )}
              </div>
            )}

            <div className="relative shrink-0">
              <select
                name="status"
                defaultValue={claim.status}
                disabled={pending}
                onChange={(e) => {
                  const data = new FormData();
                  data.set("status", e.target.value);
                  submit(claim.id, data);
                }}
                className="appearance-none rounded-lg border border-input bg-background py-1.5 pl-2.5 pr-7 text-xs outline-none focus:ring-2 focus:ring-primary/30"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            </div>

            <Link
              href={`/admin/postventa/reclamos/${claim.id}`}
              className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline"
            >
              Ingresar
              <ChevronRightIcon className="size-3.5" />
            </Link>
          </ClickableRow>
        ))}

        {!claims.length && (
          <p className="p-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}
