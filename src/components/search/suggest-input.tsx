"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type SuggestItem = { href: string; title: string; subtitle?: string; image?: string | null };
export type SuggestGroup = { label: string; items: SuggestItem[] };

const MIN_CHARS = 2;
const DEBOUNCE_MS = 180;

// Input con sugerencias mientras se escribe. Sigue siendo un input común:
// dentro de un <form>, Enter sin sugerencia elegida manda el formulario.
export function SuggestInput({
  endpoint,
  name,
  form,
  defaultValue = "",
  placeholder,
  ariaLabel,
  className,
  autoFocus,
  portal = false,
  freeTextHref,
  onNavigate,
}: {
  endpoint: string;
  name?: string;
  form?: string;
  defaultValue?: string;
  placeholder: string;
  ariaLabel: string;
  className?: string;
  autoFocus?: boolean;
  // Para cuando un contenedor con overflow-hidden recortaría la lista.
  portal?: boolean;
  // A dónde ir con Enter si no se eligió ninguna sugerencia (fuera de un form).
  freeTextHref?: (query: string) => string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef<AbortController | null>(null);
  const [value, setValue] = useState(defaultValue);
  const [groups, setGroups] = useState<SuggestGroup[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [active, setActive] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const items = groups.flatMap((g) => g.items);
  const showList = open && value.trim().length >= MIN_CHARS && (items.length > 0 || searched);

  const measure = () => setRect(inputRef.current?.getBoundingClientRect() ?? null);

  useEffect(() => {
    if (!portal || !open) return;
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [portal, open]);

  function search(text: string) {
    clearTimeout(timer.current);
    request.current?.abort();
    const query = text.trim();
    setActive(-1);
    if (query.length < MIN_CHARS) {
      setGroups([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      try {
        const separator = endpoint.includes("?") ? "&" : "?";
        const response = await fetch(`${endpoint}${separator}q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = response.ok ? ((await response.json()) as { groups: SuggestGroup[] }) : { groups: [] };
        setGroups(data.groups);
        setSearched(true);
        setLoading(false);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setLoading(false);
      }
    }, DEBOUNCE_MS);
  }

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
    } else if (event.key === "ArrowDown" && items.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % items.length);
    } else if (event.key === "ArrowUp" && items.length) {
      event.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (showList && active >= 0 && items[active]) {
        event.preventDefault();
        go(items[active].href);
      } else if (freeTextHref && value.trim()) {
        event.preventDefault();
        go(freeTextHref(value.trim()));
      }
    }
  }

  const list = showList && (
    <div
      id={listId}
      role="listbox"
      style={portal && rect ? { position: "fixed", top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, Math.min(360, window.innerWidth - rect.left - 12)) } : undefined}
      className={cn(
        "z-[70] max-h-[60vh] overflow-y-auto rounded-xl border bg-popover p-1.5 text-left text-popover-foreground shadow-lg",
        !portal && "absolute inset-x-0 top-full mt-2 min-w-72",
      )}
      // Sin esto, el blur del input cierra la lista antes de que llegue el clic.
      onMouseDown={(event) => event.preventDefault()}
    >
      {items.length === 0 && <p className="px-3 py-2.5 text-sm text-muted-foreground">Sin resultados para «{value.trim()}»</p>}
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
          {group.items.map((item) => {
            const selected = items.indexOf(item) === active;
            return (
              <button
                key={item.href}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => go(item.href)}
                className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted", selected && "bg-muted")}
              >
                {item.image && (
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  {item.subtitle && <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <span className="relative flex min-w-0 flex-1 items-center">
      <input
        ref={inputRef}
        name={name}
        form={form}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={Boolean(showList)}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setOpen(true);
          measure();
          search(event.target.value);
        }}
        onFocus={() => {
          setOpen(true);
          measure();
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={className}
      />
      {loading && <Loader2 className="absolute right-2 size-4 animate-spin text-muted-foreground" />}
      {list && (portal ? createPortal(list, document.body) : list)}
    </span>
  );
}
