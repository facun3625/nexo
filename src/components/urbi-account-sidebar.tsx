"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSignIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  PlusIcon,
  StoreIcon,
  UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export function UrbiAccountSidebar({
  hasOwnStore,
  isReseller,
  onNavigate,
}: {
  hasOwnStore: boolean;
  isReseller: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = [
    { href: "/mi-cuenta", label: "Resumen", icon: LayoutDashboardIcon },
    ...(hasOwnStore ? [{ href: "/mi-cuenta/tienda/plan", label: "Mi plan", icon: CreditCardIcon }] : []),
    ...(isReseller
      ? [
          { href: "/socios", label: "Socios comerciales", icon: HandshakeIcon },
          { href: "/socios/tiendas", label: "Inmobiliarias referidas", icon: StoreIcon },
          { href: "/socios/comisiones", label: "Comisiones", icon: BadgeDollarSignIcon },
          { href: "/socios/perfil", label: "Perfil", icon: UserIcon },
        ]
      : []),
  ];

  return (
    <div className="flex h-full w-full flex-col text-sidebar-foreground">
      <Link href="/mi-cuenta" onClick={onNavigate} className="flex items-center gap-3 px-4 py-4">
        <Image src="/brand/logo.svg" alt="Urbi" width={595} height={180} className="bg-white rounded-lg p-1.5 h-7 w-auto object-contain" />
        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">Mi cuenta</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {sections.map((section) => {
          const active = section.href === "/mi-cuenta"
            ? pathname === "/mi-cuenta"
            : section.href === "/socios"
              ? pathname === "/socios"
              : pathname.startsWith(section.href);
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {section.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <Link
          href={hasOwnStore ? "/mi-cuenta/tienda" : "/registro/plan"}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {hasOwnStore ? <ExternalLinkIcon className="size-4 shrink-0" /> : <PlusIcon className="size-4 shrink-0" />}
          {hasOwnStore ? "Ir a mi inmobiliaria" : "Crear mi inmobiliaria"}
        </Link>
      </div>
    </div>
  );
}
