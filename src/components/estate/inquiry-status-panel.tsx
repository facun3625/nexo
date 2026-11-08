"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MailIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/confirm-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { consultaStatusBadgeClass, labels } from "@/lib/estate/modules";
import { INQUIRY_STATUSES } from "@/lib/estate/inquiry-status";
import { deleteEstateInquiry, setEstateInquiryStatus } from "@/app/admin/gestion/actions";

export type InquiryStatusEvent = {
  id: string;
  status: string;
  changedByName: string;
  // Ya formateada en el servidor: formatearla acá daba un texto distinto
  // al del render del servidor (Node y el navegador no escriben igual
  // "a. m.") y React se quejaba de hydration mismatch.
  when: string;
};

// Estado de la consulta con cambio en un clic, historial de quién hizo cada
// cambio y eliminar.
export function InquiryStatusPanel({
  id,
  status,
  createdAt,
  history,
  closeHref,
  mailHref = null,
}: {
  id: string;
  status: string;
  createdAt: string;
  history: InquiryStatusEvent[];
  closeHref: string;
  // Atajo al armado de mail con el cliente (y la propiedad) ya cargados.
  mailHref?: string | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();

  function changeStatus(next: string) {
    if (next === status) return;
    startTransition(async () => {
      const result = await setEstateInquiryStatus(id, next);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Marcada como ${labels[next]?.toLowerCase() ?? next}`);
      router.refresh();
    });
  }

  async function remove() {
    const accepted = await confirm({
      title: "Eliminar consulta",
      description: "La consulta y su historial se borran definitivamente. El contacto no se elimina.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!accepted) return;
    startTransition(async () => {
      const result = await deleteEstateInquiry(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Consulta eliminada");
      router.push(closeHref);
      router.refresh();
    });
  }

  return (
    <div className="mb-6 space-y-4 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Estado de la consulta">
          {INQUIRY_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              aria-pressed={s === status}
              onClick={() => changeStatus(s)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                s === status
                  ? cn(consultaStatusBadgeClass(s), "border-current")
                  : "bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              {labels[s] ?? s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {mailHref && (
            <Button size="sm" variant="outline" render={<Link href={mailHref} />}>
              <MailIcon className="size-3.5" />
              Responder por mail
            </Button>
          )}
          <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={remove}>
            <Trash2 className="size-3.5" />
            Eliminar
          </Button>
        </div>
      </div>

      <ol className="space-y-1.5 text-xs text-muted-foreground">
        {[...history].reverse().map((event) => (
          <li key={event.id}>
            <span className="font-medium text-foreground">{labels[event.status] ?? event.status}</span>
            {" · "}
            {event.changedByName} · {event.when}
          </li>
        ))}
        <li>
          <span className="font-medium text-foreground">Ingresada</span> ·{" "}
          {createdAt}
        </li>
      </ol>
    </div>
  );
}
