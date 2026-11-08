"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";

import { inputClass } from "./form-field-class";
import { SelectField } from "./select-field";

export function PostSaleClaimsFilters({
  developments,
}: {
  developments: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = (new FormData(e.currentTarget).get("q") as string).trim();
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("q", value);
    else next.delete("q");
    navigate(next);
  }

  function onDevelopmentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(searchParams.toString());
    if (e.target.value) next.set("desarrollo", e.target.value);
    else next.delete("desarrollo");
    navigate(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form onSubmit={onSearchSubmit} className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Buscar por título, unidad, propietario, DNI, sección…"
          className={`${inputClass} pl-9`}
        />
      </form>

      <div className="w-56 shrink-0">
        <SelectField
          value={searchParams.get("desarrollo") ?? ""}
          onChange={onDevelopmentChange}
        >
          <option value="">Todos los desarrollos</option>
          {developments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectField>
      </div>
    </div>
  );
}
