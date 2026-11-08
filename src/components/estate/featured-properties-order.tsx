"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDownIcon, ChevronUpIcon, StarIcon } from "lucide-react";
import { reorderFeaturedEstateProperties } from "@/app/admin/gestion/actions";

type FeaturedProperty = { id: string; title: string; code: string };

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function FeaturedPropertiesOrder({ properties }: { properties: FeaturedProperty[] }) {
  const [items, setItems] = useState(properties);
  const [prevProperties, setPrevProperties] = useState(properties);
  const [reordering, setReordering] = useState(false);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (properties !== prevProperties) {
    setPrevProperties(properties);
    setItems(properties);
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const reordered = move(items, index, index + direction);
    if (reordered === items) return;
    setItems(reordered);
    setReordering(true);
    try {
      const result = await reorderFeaturedEstateProperties(reordered.map((p) => p.id));
      if ("error" in result) {
        toast.error(result.error);
        setItems(items);
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setReordering(false);
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <StarIcon className="size-4 fill-current text-amber-500" />
          <h2 className="font-semibold">Orden de destacadas</h2>
        </span>
        {open ? (
          <ChevronUpIcon className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && (
        <>
          <p className="mt-3 mb-4 text-sm text-muted-foreground">
            Así se muestran en la home y en los resultados — la primera de la lista aparece primero.
          </p>
          <div className="flex flex-col divide-y rounded-xl border">
            {items.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {p.code} · {p.title}
                </span>
                <button
                  type="button"
                  disabled={i === 0 || reordering || pending}
                  onClick={() => handleMove(i, -1)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label={`Subir ${p.title}`}
                >
                  <ChevronUpIcon className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={i === items.length - 1 || reordering || pending}
                  onClick={() => handleMove(i, 1)}
                  className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label={`Bajar ${p.title}`}
                >
                  <ChevronDownIcon className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
