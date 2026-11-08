"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserIcon, ClipboardListIcon, StoreIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/", label: "Volver a la tienda", icon: StoreIcon, exact: true, highlight: true },
  { href: "/perfil", label: "Mi perfil", icon: UserIcon },
  { href: "/pedidos", label: "Mis pedidos", icon: ClipboardListIcon },
];

export function CustomerSidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex lg:flex-col gap-2 lg:sticky lg:top-6">
      {sections.map((s) => {
        const active = s.exact ? pathname === s.href : pathname.startsWith(s.href);
        const Icon = s.icon;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={cn(
              "flex whitespace-nowrap items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : s.highlight
                  ? "bg-zinc-800 text-white hover:bg-black dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}
