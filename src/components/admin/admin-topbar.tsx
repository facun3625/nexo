"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { MenuIcon, StoreIcon, ChevronDownIcon, MoonIcon, SunIcon, BellIcon, MessageSquareTextIcon, SearchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useAdminTheme } from "@/components/admin/admin-theme-root";
import { SuggestInput } from "@/components/search/suggest-input";

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export type AdminNotification = { id: string; type: "INQUIRY" | "DEVELOPMENT_INQUIRY" | "AI_CONVERSATION" | "PRICE_DROP" | "QR_VISIT"; title: string; detail: string; href: string; createdAt: string };

export function AdminTopbar({ newInquiryCount = 0, newDevelopmentInquiryCount = 0, newAiConversationCount = 0, priceDropCount = 0, newQrVisitCount = 0, notificationCount = 0, notifications = [] }: { newInquiryCount?: number; newDevelopmentInquiryCount?: number; newAiConversationCount?: number; priceDropCount?: number; newQrVisitCount?: number; notificationCount?: number; notifications?: AdminNotification[] }) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { containerRef, theme, toggleTheme } = useAdminTheme();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-10 flex flex-col border-b bg-background/95 backdrop-blur print:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 lg:px-8">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0" showCloseButton={false} container={containerRef}>
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <AdminSidebar onNavigate={() => setMobileOpen(false)} newInquiryCount={newInquiryCount} newDevelopmentInquiryCount={newDevelopmentInquiryCount} newAiConversationCount={newAiConversationCount} priceDropCount={priceDropCount} newQrVisitCount={newQrVisitCount} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Abrir menú"
          className="shrink-0 lg:hidden"
          onClick={() => setMobileOpen(true)}
        >
          <MenuIcon />
        </Button>
        <div className="relative flex w-full max-w-md items-center">
          <SearchIcon className="pointer-events-none absolute left-3 z-10 size-4 text-muted-foreground" />
          <SuggestInput
            endpoint="/api/admin/search"
            ariaLabel="Buscar en el panel"
            placeholder="Buscar propiedades, clientes, consultas…"
            className="w-full rounded-full border bg-background py-2 pl-9 pr-7 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={<button aria-label="Notificaciones" className="relative flex size-9 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground" />}>
            <BellIcon className="size-4" />
            {notificationCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-4.5 text-primary-foreground ring-2 ring-background">{notificationCount > 99 ? "99+" : notificationCount}</span>}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-1.5" container={containerRef}>
            <div className="flex items-center justify-between px-2.5 py-2"><span className="text-sm font-semibold">Notificaciones</span>{notificationCount > 0 && <span className="text-xs font-normal text-muted-foreground">{notificationCount} pendientes</span>}</div>
            <DropdownMenuSeparator />
            {notifications.length ? <DropdownMenuGroup>{notifications.map(notification => <DropdownMenuItem key={`${notification.type}-${notification.id}`} render={<Link href={notification.href} />} className="items-start gap-3 rounded-lg px-2.5 py-3"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageSquareTextIcon className="size-4" /></span><span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="truncate text-sm font-medium">{notification.title}</span><span className="truncate text-xs text-muted-foreground">{notification.detail}</span><span className="text-[10px] text-muted-foreground/70">{new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(notification.createdAt))}</span></span></DropdownMenuItem>)}</DropdownMenuGroup> : <div className="px-4 py-8 text-center"><BellIcon className="mx-auto size-6 text-muted-foreground/40" /><p className="mt-2 text-sm font-medium">Todo al día</p><p className="mt-1 text-xs text-muted-foreground">No hay pendientes nuevos.</p></div>}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* ── Controles unificados en un único pill ── */}
        <div className="flex items-center divide-x divide-border overflow-hidden rounded-full border bg-background shadow-sm">

          {/* Tema */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
          </button>

          {/* Ver sitio */}
          <Link
            href="/"
            className="flex h-9 items-center gap-1.5 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <StoreIcon className="size-3.5" />
            <span className="hidden sm:inline">Ver sitio</span>
          </Link>

          {/* Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="flex h-9 items-center gap-2 px-3 transition-colors hover:bg-muted" />}>
              <Avatar size="sm">
                <AvatarFallback>{initials(session?.user?.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-32 truncate text-xs font-medium sm:inline">
                {session?.user?.name}
              </span>
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
              reales entre dominios para borrar cookies de sesión en cada
              uno — con <Link>, Next lo trata como transición interna y el
              estado de sesión en memoria no se entera hasta recargar a mano. */}
              <DropdownMenuItem
                // eslint-disable-next-line @next/next/no-html-link-for-pages -- ver comentario arriba
                render={<a href="/api/auth/logout-all" />}
                className="gap-2 py-1.5 text-sm text-muted-foreground"
              >
                <span className="size-1 shrink-0 rounded-full bg-current" />
                Salir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>
    </header>
  );
}
