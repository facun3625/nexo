"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDownIcon } from "lucide-react";
import { inputClass } from "@/components/estate/form-field-class";

type Option = { id: string; label: string };

// Sin tildes ni mayúsculas: "angel" encuentra "Ángel Gallardo".
function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function SearchableSelect({
  name,
  options,
  defaultValue = "",
  required,
  placeholder = "Buscar…",
  onDirty,
  onChange,
  disabled,
}: {
  name: string;
  options: Option[];
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  onDirty?: () => void;
  // Para usarlo controlado desde afuera (ej. selects en cascada).
  onChange?: (id: string) => void;
  disabled?: boolean;
}) {
  const initial = options.find((o) => o.id === defaultValue) ?? null;
  const [query, setQuery] = useState(initial?.label ?? "");
  const [selectedId, setSelectedId] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q || (selectedId && query === initial?.label)) return options;
    return options.filter((o) => normalize(o.label).includes(q));
  }, [options, query, selectedId, initial]);

  useEffect(() => {
    inputRef.current?.setCustomValidity(
      required && !selectedId ? "Seleccioná una opción" : "",
    );
  }, [required, selectedId]);

  function select(option: Option) {
    setSelectedId(option.id);
    setQuery(option.label);
    setOpen(false);
    onDirty?.();
    onChange?.(option.id);
  }

  function clear() {
    setSelectedId("");
    setQuery("");
    onDirty?.();
    onChange?.("");
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selectedId} readOnly />
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
            if (selectedId) {
              setSelectedId("");
              onChange?.("");
            }
          }}
          onBlur={() => {
            blurTimeout.current = setTimeout(() => {
              setOpen(false);
              if (!selectedId) setQuery("");
            }, 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlight((h) => Math.min(h + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              if (open && filtered[highlight]) {
                e.preventDefault();
                select(filtered[highlight]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className={`${inputClass} pr-16 disabled:cursor-not-allowed disabled:opacity-50`}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {selectedId && (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => {
                e.preventDefault();
                if (blurTimeout.current) clearTimeout(blurTimeout.current);
                clear();
              }}
              aria-label="Quitar selección"
              className="rounded p-1 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
          <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
        </div>
      </div>
      {open && (
        <ul className="absolute z-[1000] mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-card text-sm shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">Sin resultados</li>
          ) : (
            filtered.map((o, i) => (
              <li key={o.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimeout.current) clearTimeout(blurTimeout.current);
                    select(o);
                  }}
                  className={`block w-full px-3 py-2 text-left hover:bg-muted ${
                    i === highlight ? "bg-muted" : ""
                  } ${o.id === selectedId ? "font-medium text-primary" : ""}`}
                >
                  {o.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
