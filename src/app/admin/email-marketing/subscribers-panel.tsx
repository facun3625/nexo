"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { inputClass } from "@/components/estate/form-field-class";
import { useConfirm } from "@/components/admin/confirm-provider";
import { cn } from "@/lib/utils";
import { addSubscriber, deleteSubscriber, setNewsletterSignup, setSubscriberActive } from "./actions";

export type SubscriberRow = { id: string; email: string; name: string; source: string; active: boolean; when: string };

const SOURCE_LABELS: Record<string, string> = { WEB: "Desde el sitio", ADMIN: "Cargado a mano", BAJA: "Contacto dado de baja" };

export function SubscribersPanel({ rows, signupEnabled }: { rows: SubscriberRow[]; signupEnabled: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (filter === "all" ? true : filter === "active" ? r.active : !r.active))
      .filter((r) => !q || r.email.includes(q) || r.name.toLowerCase().includes(q));
  }, [rows, query, filter]);

  function run(action: () => Promise<{ ok: true } | { error: string }>, success?: string) {
    startTransition(async () => {
      const result = await action();
      if ("error" in result) toast.error(result.error);
      else if (success) toast.success(success);
      router.refresh();
    });
  }

  const active = rows.filter((r) => r.active).length;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
        <div>
          <p className="text-sm font-semibold">Formulario de suscripción en el sitio</p>
          <p className="text-xs text-muted-foreground">
            Aparece arriba del pie de página: &quot;Recibí las nuevas propiedades en tu mail&quot;.
          </p>
        </div>
        <Button
          type="button"
          variant={signupEnabled ? "outline" : "default"}
          disabled={pending}
          onClick={() => run(() => setNewsletterSignup(!signupEnabled), signupEnabled ? "Formulario oculto" : "Formulario visible en el sitio")}
        >
          {signupEnabled ? "Ocultar del sitio" : "Mostrar en el sitio"}
        </Button>
      </section>

      <form
        className="flex flex-col gap-2 rounded-2xl border bg-card p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const result = await addSubscriber(email, name);
            if ("ok" in result) {
              setEmail("");
              setName("");
            }
            return result;
          }, "Suscriptor agregado");
        }}
      >
        <label className="flex flex-1 flex-col gap-1.5 text-xs font-medium">
          Mail
          <input className={inputClass} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-xs font-medium">
          Nombre
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <Button type="submit" disabled={pending} className="h-10">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <PlusIcon className="size-4" />}
          Agregar
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        {([
          ["active", `Activos ${active}`],
          ["inactive", `Dados de baja ${rows.length - active}`],
          ["all", `Todos ${rows.length}`],
        ] as const).map(([id, text]) => (
          <Button key={id} type="button" size="sm" variant={filter === id ? "default" : "outline"} onClick={() => setFilter(id)}>
            {text}
          </Button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className={cn(inputClass, "py-2 pl-9")} placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <ul className="divide-y rounded-2xl border bg-card">
        {filtered.length === 0 ? (
          <li className="p-8 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "Todavía no hay suscriptores. Se suman solos desde el formulario del sitio." : "No hay resultados."}
          </li>
        ) : (
          filtered.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.name || r.email}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.name ? `${r.email} · ` : ""}
                  {SOURCE_LABELS[r.source] ?? r.source} · {r.when}
                </p>
              </div>
              {!r.active && <Badge variant="secondary">Dado de baja</Badge>}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => run(() => setSubscriberActive(r.id, !r.active), r.active ? "Dado de baja" : "Suscripto de nuevo")}
              >
                {r.active ? "Dar de baja" : "Volver a suscribir"}
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                disabled={pending}
                aria-label="Borrar"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Borrar suscriptor",
                    description: `¿Borrar a ${r.email} de la lista? Si solo no quiere recibir mails, mejor "Dar de baja": así no le llegan aunque esté cargado como cliente.`,
                    confirmLabel: "Borrar",
                    destructive: true,
                  });
                  if (ok) run(() => deleteSubscriber(r.id), "Suscriptor borrado");
                }}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
