"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATALOG_FILTER_KEYS, CATALOG_FILTER_LABELS, type CatalogFilterKey } from "@/lib/estate/catalog-filters";
import { updateCatalogFilters } from "./actions";

type Row = { key: CatalogFilterKey; checked: boolean };

function initialRows(enabledOrder: CatalogFilterKey[]): Row[] {
  const rest = CATALOG_FILTER_KEYS.filter((k) => !enabledOrder.includes(k));
  return [...enabledOrder, ...rest].map((key) => ({ key, checked: enabledOrder.includes(key) }));
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function CatalogFiltersForm({
  enabledOrder,
  labels: initialLabels,
}: {
  enabledOrder: CatalogFilterKey[];
  labels: Record<CatalogFilterKey, string>;
}) {
  const [rows, setRows] = useState<Row[]>(() => initialRows(enabledOrder));
  const [labels, setLabels] = useState<Record<CatalogFilterKey, string>>(initialLabels);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("filters", rows.filter((r) => r.checked).map((r) => r.key).join(","));
        formData.set("labels", JSON.stringify(labels));
        const actionResult = await updateCatalogFilters(formData);
        if ("error" in actionResult) {
          toast.error(actionResult.error);
          return;
        }
        toast.success("Filtros guardados");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border p-4">
      <div>
        <Label>Filtros del buscador público</Label>
        <p className="mt-1 text-sm text-muted-foreground">
          Elegí qué filtros aparecen en el buscador de tu sitio (home y el mapa), en qué orden, y
          qué texto muestran antes de elegir una opción.
        </p>
      </div>

      <div className="flex flex-col divide-y rounded-lg border">
        {rows.map((row, i) => (
          <div key={row.key} className="flex items-center gap-3 px-3 py-2">
            <input
              type="checkbox"
              checked={row.checked}
              onChange={(e) =>
                setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, checked: e.target.checked } : r)))
              }
              className="size-4 shrink-0 rounded border-input"
            />
            <span className="w-32 shrink-0 text-sm text-muted-foreground">
              {CATALOG_FILTER_LABELS[row.key]}
            </span>
            <Input
              value={labels[row.key]}
              onChange={(e) => setLabels((prev) => ({ ...prev, [row.key]: e.target.value }))}
              placeholder={CATALOG_FILTER_LABELS[row.key]}
              maxLength={60}
              className="h-8 flex-1"
              aria-label={`Texto para ${CATALOG_FILTER_LABELS[row.key]}`}
            />
            <button
              type="button"
              disabled={i === 0}
              onClick={() => setRows((prev) => move(prev, i, i - 1))}
              className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label={`Subir ${CATALOG_FILTER_LABELS[row.key]}`}
            >
              <ChevronUpIcon className="size-4" />
            </button>
            <button
              type="button"
              disabled={i === rows.length - 1}
              onClick={() => setRows((prev) => move(prev, i, i + 1))}
              className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label={`Bajar ${CATALOG_FILTER_LABELS[row.key]}`}
            >
              <ChevronDownIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <Button type="button" size="sm" onClick={save} disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
