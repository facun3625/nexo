"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createCatalogItem,
  deleteCatalogItem,
  renameCatalogItem,
  type CatalogKind,
} from "@/app/admin/gestion/categorias/actions";
import { inputClass } from "@/components/estate/form-field-class";

type Item = { id: string; name: string };

export function CatalogList({
  kind,
  title,
  description,
  items,
}: {
  kind: CatalogKind;
  title: string;
  description: string;
  items: Item[];
}) {
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const router = useRouter();
  const addInputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const value = newValue.trim();
    if (!value) return;
    start(async () => {
      const result = await createCatalogItem(kind, value);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setNewValue("");
      router.refresh();
      addInputRef.current?.focus();
    });
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditValue(item.name);
  }

  function handleRename(id: string) {
    const value = editValue.trim();
    if (!value) return;
    setBusyId(id);
    start(async () => {
      const result = await renameCatalogItem(kind, id, value);
      setBusyId(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setBusyId(id);
    start(async () => {
      const result = await deleteCatalogItem(kind, id);
      setBusyId(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <ul className="mt-4 flex flex-col divide-y rounded-xl border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 px-3 py-2">
            {editingId === item.id ? (
              <>
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(item.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className={`${inputClass} py-1.5`}
                />
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => handleRename(item.id)}
                  aria-label="Guardar"
                  className="rounded p-1.5 text-emerald-600 hover:bg-muted disabled:opacity-40"
                >
                  <Check className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  aria-label="Cancelar"
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => startEdit(item)}
                  aria-label={`Editar ${item.name}`}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => handleDelete(item.id)}
                  aria-label={`Eliminar ${item.name}`}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-40"
                >
                  {busyId === item.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </button>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-muted-foreground">
            Todavía no hay ninguno.
          </li>
        )}
      </ul>
      <div className="mt-3 flex gap-2">
        <input
          ref={addInputRef}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Agregar nuevo…"
          className={inputClass}
        />
        <button
          type="button"
          disabled={pending || !newValue.trim()}
          onClick={handleAdd}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <Plus className="size-4" />
          Agregar
        </button>
      </div>
    </div>
  );
}
