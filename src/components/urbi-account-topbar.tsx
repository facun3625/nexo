"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronDownIcon, ExternalLinkIcon, MenuIcon, MoonIcon, StoreIcon, SunIcon } from "lucide-react";

import { useAdminTheme } from "@/components/admin/admin-theme-root";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UrbiAccountSidebar } from "@/components/urbi-account-sidebar";

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function UrbiAccountTopbar({ hasOwnStore, isReseller }: { hasOwnStore: boolean; isReseller: boolean }) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { containerRef, theme, toggleTheme } = useAdminTheme();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:px-8">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0" showCloseButton={false} container={containerRef}>
          <SheetTitle className="sr-only">Menú de cuenta</SheetTitle>
          <UrbiAccountSidebar hasOwnStore={hasOwnStore} isReseller={isReseller} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <Button variant="outline" size="icon" aria-label="Abrir menú" className="lg:hidden" onClick={() => setMobileOpen(true)}>
        <MenuIcon />
      </Button>

      <div className="hidden lg:block" />

      <div className="flex items-center divide-x divide-border overflow-hidden rounded-full border bg-background shadow-sm">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </button>
        <Link href="/" target="_blank" className="flex h-9 items-center gap-1.5 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ExternalLinkIcon className="size-3.5" />
          <span className="hidden sm:inline">Ver urbi.com.ar</span>
        </Link>
        {hasOwnStore && (
          <Link href="/mi-cuenta/tienda" className="flex h-9 items-center gap-1.5 px-3 text-xs font-semibold text-primary transition-colors hover:bg-muted">
            <StoreIcon className="size-3.5" />
            <span className="hidden sm:inline">Ir a mi inmobiliaria</span>
          </Link>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger render={<button className="flex h-9 items-center gap-2 px-3 transition-colors hover:bg-muted" />}>
            <Avatar size="sm"><AvatarFallback>{initials(session?.user?.name)}</AvatarFallback></Avatar>
            <span className="hidden max-w-32 truncate text-xs font-medium sm:inline">{session?.user?.name ?? session?.user?.email}</span>
            <ChevronDownIcon className="size-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56 p-1.5" container={containerRef}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col gap-0.5 px-2.5 py-2">
                <span className="text-sm font-medium">{session?.user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{session?.user?.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* <a> nativo, no <Link>: /api/auth/logout-all hace redirects
            reales entre dominios para borrar cookies de sesión en cada uno
            — con <Link>, Next lo trata como transición interna y el estado
            de sesión en memoria no se entera hasta recargar a mano. */}
            <DropdownMenuItem
              // eslint-disable-next-line @next/next/no-html-link-for-pages -- ver comentario arriba
              render={<a href="/api/auth/logout-all" />}
              className="gap-2 py-1.5 text-sm text-muted-foreground"
            >
              <span className="size-1 shrink-0 rounded-full bg-current" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
