"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGridIcon, ClipboardListIcon, ListTreeIcon, ChartNoAxesCombinedIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function PostSaleDevelopmentSidebar({ developmentId }: { developmentId: string }) {
  const pathname = usePathname();
  const base = `/admin/postventa/desarrollos/${developmentId}`;
  // Reclamos vive en la sección de nivel superior (lista todos los
  // desarrollos) — este link solo la pre-filtra a este desarrollo.
  const items = [
    { href: base, label: "Unidades", icon: LayoutGridIcon, activeMatch: base },
    {
      href: `/admin/postventa/reclamos?desarrollo=${developmentId}`,
      label: "Reclamos",
      icon: ClipboardListIcon,
      activeMatch: "/admin/postventa/reclamos",
    },
    { href: `${base}/catalogo`, label: "Catálogo", icon: ListTreeIcon, activeMatch: `${base}/catalogo` },
    {
      href: `${base}/estadisticas`,
      label: "Estadísticas",
      icon: ChartNoAxesCombinedIcon,
      activeMatch: `${base}/estadisticas`,
    },
  ];

  return (
    <nav aria-label="Secciones del desarrollo" className="sticky top-6 flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          item.activeMatch === base ? pathname === base : pathname.startsWith(item.activeMatch);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
