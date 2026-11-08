"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAdminTheme } from "@/components/admin/admin-theme-root";

export function UsersFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { containerRef } = useAdminTheme();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      updateParam("q", q || null);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["q", "rol"].some((k) => searchParams.get(k));

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o email"
          className="pl-9"
        />
      </div>

      <Select
        items={[
          { value: "all", label: "Todos" },
          { value: "CUSTOMER", label: "Clientes" },
          { value: "ADMIN", label: "Admins" },
        ]}
        value={searchParams.get("rol") ?? "all"}
        onValueChange={(v) => updateParam("rol", v === "all" ? null : String(v))}
      >
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Rol" />
        </SelectTrigger>
        <SelectContent container={containerRef} alignItemWithTrigger={false}>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="CUSTOMER">Clientes</SelectItem>
          <SelectItem value="ADMIN">Admins</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            router.push(pathname);
          }}
        >
          <XIcon className="size-3.5" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
