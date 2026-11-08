"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { UserIcon, DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLoginDialog } from "@/lib/login-dialog-context";
import { useStorePwa } from "@/components/store/store-pwa-provider";

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AccountMenu({
  overlay = false,
  iconOnly = false,
}: {
  overlay?: boolean;
  iconOnly?: boolean;
}) {
  const { data: session, status } = useSession();
  const { openLogin } = useLoginDialog();
  const { canInstall, promptInstall } = useStorePwa();

  if (status === "loading") return null;

  if (status !== "authenticated") {
    return (
      <button
        type="button"
        aria-label="Ingresar"
        onClick={openLogin}
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium transition-colors",
          overlay
            ? "text-current opacity-85 hover:opacity-100"
            : "text-muted-foreground hover:text-foreground",
          iconOnly && "size-9 justify-center rounded-full border border-current/20",
        )}
      >
        <UserIcon className="size-4" />
        {!iconOnly && "Acceso"}
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            aria-label={`Cuenta de ${session.user.name ?? session.user.email}`}
            className={cn(
              "rounded-full p-0",
              overlay &&
                "border-current/30 bg-current/15 text-current hover:bg-current/25",
            )}
          />
        }
      >
        <Avatar className="size-full">
          {session.user.image && (
            <AvatarImage src={session.user.image} alt="" />
          )}
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {initials(session.user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44 p-1.5">
        {session.user.role === "AGENT" && <DropdownMenuItem render={<Link href="/agente" />}>Mis consultas</DropdownMenuItem>}
        {session.user.role === "ADMIN" && (
          <DropdownMenuItem
            render={<Link href="/admin" />}
            className="gap-2 py-1.5 text-sm"
          >
            <span className="size-1 shrink-0 rounded-full bg-current" />
            Admin
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          render={<Link href="/perfil" />}
          className="gap-2 py-1.5 text-sm"
        >
          <span className="size-1 shrink-0 rounded-full bg-current" />
          Mi perfil
        </DropdownMenuItem>
        {canInstall && (
          <DropdownMenuItem
            onClick={promptInstall}
            className="gap-2 py-1.5 text-sm"
          >
            <DownloadIcon className="size-3.5 shrink-0" />
            Instalar app
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            // Auth.js invalida primero la sesión del host actual. La
            // navegación completa posterior limpia también cualquier
            // sesión que haya quedado en el dominio raíz/subdominio.
            void signOut({ redirect: false }).finally(() => {
              // Debe ser una navegación de documento: el endpoint encadena
              // redirects entre hosts y no es una transición del App Router.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/api/auth/logout-all");
            });
          }}
          className="gap-2 py-1.5 text-sm text-muted-foreground"
        >
          <span className="size-1 shrink-0 rounded-full bg-current" />
          Salir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
