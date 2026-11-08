"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BellRingIcon,
  QrCodeIcon,
  LayoutDashboardIcon,
  ClipboardListIcon,
  CreditCardIcon,
  SettingsIcon,
  StoreIcon,
  UsersIcon,
  ChevronDownIcon,
  MessageSquareTextIcon,
  BotIcon,
  DownloadIcon,
  GlobeIcon,
  SearchIcon,
  BuildingIcon,
  UserCheckIcon,
  ChartNoAxesCombinedIcon,
  MailIcon,
  HistoryIcon,
} from "lucide-react";

import { useStoreSettings } from "@/lib/store-settings-context";
import { useAdminPwa } from "@/components/admin/pwa-provider";
import { cn } from "@/lib/utils";
import { AGENT_MENU_SECTIONS, type AgentPermissions } from "@/lib/agent-permission-types";

type Section = {
  href: string;
  label: string;
  icon: typeof LayoutDashboardIcon;
  group?: string;
  subitems?: { href: string; label: string; panel: string | null }[];
};

const sections: Section[] = [
  {
    href: "/admin",
    label: "Resumen",
    icon: LayoutDashboardIcon,
    group: "Inmobiliaria",
  },

  // Gestión Inmobiliaria — todo lo comercial: propiedades, agenda, contratos
  // y la bandeja de consultas inmobiliarias viven juntas acá.
  {
    href: "/admin/gestion/propiedades",
    label: "Propiedades",
    icon: StoreIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/clientes",
    label: "Clientes y contactos",
    icon: UsersIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/agentes",
    label: "Agentes",
    icon: UserCheckIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/consultas",
    label: "Consultas inmobiliarias",
    icon: MessageSquareTextIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/busquedas",
    label: "Búsquedas guardadas",
    icon: SearchIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/avisos-precio",
    label: "Avisarme si baja el precio",
    icon: BellRingIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/aperturas-qr",
    label: "Aperturas de QR",
    icon: QrCodeIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/operaciones",
    label: "Operaciones",
    icon: ClipboardListIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/tasaciones",
    label: "Tasaciones",
    icon: StoreIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/contratos",
    label: "Contratos",
    icon: ClipboardListIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/cobranzas",
    label: "Cobranzas",
    icon: CreditCardIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/emprendimientos",
    label: "Obras",
    icon: BuildingIcon,
    group: "Gestión Inmobiliaria",
  },
  {
    href: "/admin/gestion/consultas-emprendimientos",
    label: "Consultas de obras",
    icon: MessageSquareTextIcon,
    group: "Gestión Inmobiliaria",
  },

  // Cuenta
  {
    href: "/admin/pagina",
    label: "Página web",
    icon: GlobeIcon,
    group: "Cuenta",
  },
  {
    href: "/admin/estadisticas",
    label: "Estadísticas",
    icon: ChartNoAxesCombinedIcon,
    group: "Cuenta",
  },
  {
    href: "/admin/email-marketing",
    label: "Email marketing",
    icon: MailIcon,
    group: "Cuenta",
  },
  {
    href: "/admin/conversaciones",
    label: "Conversaciones IA",
    icon: BotIcon,
    group: "Cuenta",
  },
  {
    href: "/admin/usuarios",
    label: "Usuarios",
    icon: UsersIcon,
    group: "Cuenta",
  },
  {
    href: "/admin/actividad",
    label: "Actividad",
    icon: HistoryIcon,
    group: "Cuenta",
  },
  {
    href: "/admin/configuracion",
    label: "Configuración",
    icon: SettingsIcon,
    group: "Cuenta",
  },
];

export function AdminSidebar({
  onNavigate,
  newInquiryCount = 0,
  newDevelopmentInquiryCount = 0,
  newAiConversationCount = 0,
  priceDropCount = 0,
  newQrVisitCount = 0,
  agentPermissions,
}: {
  onNavigate?: () => void;
  newInquiryCount?: number;
  newDevelopmentInquiryCount?: number;
  newAiConversationCount?: number;
  priceDropCount?: number;
  newQrVisitCount?: number;
  agentPermissions?: AgentPermissions;
}) {
  const { storeName, logoUrl } = useStoreSettings();
  const { canInstall, promptInstall } = useAdminPwa();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel");
  const [query, setQuery] = useState("");
  const visibleSections = sections.filter((s) => {
    if (!agentPermissions) return true;
    const section = AGENT_MENU_SECTIONS.find((item) => item.href === s.href);
    return Boolean(section && agentPermissions[section.key] !== "NONE");
  });
  const filtered = query.trim()
    ? visibleSections.filter((s) =>
        s.label.toLowerCase().includes(query.trim().toLowerCase()),
      )
    : visibleSections;

  // La sección con sub-ítems se abre sola al entrar — pero una vez ahí, el
  // admin puede plegarla a mano sin que se reabra en cada click. Solo se
  // guarda como "override" mientras siga siendo la sección activa; al
  // navegar a otra, se vuelve a calcular desde cero.
  const activeParentHref =
    filtered.find((s) => s.subitems && pathname.startsWith(s.href))?.href ??
    null;
  const [override, setOverride] = useState<{
    href: string;
    expanded: boolean;
  } | null>(null);
  const expandedHref =
    override && override.href === activeParentHref
      ? override.expanded
        ? activeParentHref
        : null
      : activeParentHref;

  // Agrupa los ítems consecutivos que comparten "group" bajo un mismo
  // encabezado, como en el sidebar de Cloudflare — sin group quedan sueltos
  // (Resumen, arriba de todo). Al filtrar por búsqueda se aplana: no tiene
  // sentido mostrar encabezados de grupos vacíos.
  const groups: { label: string | null; items: Section[] }[] = query.trim()
    ? [{ label: null, items: filtered }]
    : filtered.reduce<{ label: string | null; items: Section[] }[]>(
        (acc, s) => {
          const last = acc[acc.length - 1];
          const label = s.group ?? null;
          if (last && last.label === label) {
            last.items.push(s);
          } else {
            acc.push({ label, items: [s] });
          }
          return acc;
        },
        [],
      );

  return (
    <div className="flex flex-1 w-full flex-col text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sidebar-accent">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={storeName}
              width={32}
              height={32}
              className="size-full object-contain"
            />
          ) : (
            <StoreIcon className="size-4 text-sidebar-accent-foreground/70" />
          )}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{storeName}</span>
          <span className="text-xs text-sidebar-foreground/60">
            Panel inmobiliario
          </span>
        </div>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sidebar-foreground/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en el panel…"
            className="w-full rounded-lg border border-sidebar-border bg-sidebar-accent/40 py-1.5 pl-8 pr-2 text-xs text-sidebar-foreground placeholder:text-sidebar-foreground/40 outline-none focus:border-primary/50 focus:bg-sidebar-accent"
          />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-1 pb-3">
        {groups.map((group, gi) => (
          <div key={group.label ?? `g${gi}`} className="flex flex-col gap-0.5">
            {group.label && (
              <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-foreground/40">
                {group.label}
              </p>
            )}
            {group.items.map((s) => {
              const agentSection = agentPermissions
                ? AGENT_MENU_SECTIONS.find((item) => item.href === s.href)
                : undefined;
              const href = agentSection?.key === "inquiries"
                ? "/agente?channel=property"
                : agentSection?.key === "searches"
                  ? "/agente?channel=searches"
                  : s.href;
              // "Resumen" (/admin) es prefijo de todas las subpáginas del
              // panel — con startsWith quedaría marcado activo siempre.
              // Exact match para esa, startsWith para el resto.
              const active = s.href === "/admin"
                ? pathname === s.href
                : pathname.startsWith(s.href);
              const expanded = expandedHref === s.href;
              const Icon = s.icon;
              return (
                <div key={s.href} className="flex flex-col">
                  <Link
                    href={href}
                    onClick={() => {
                      onNavigate?.();
                      if (s.subitems)
                        setOverride({ href: s.href, expanded: !expanded });
                    }}
                    aria-expanded={s.subitems ? expanded : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1">{s.label}</span>
                    {(() => {
                      // "Consultas inmobiliarias" (EstateInquiry) y
                      // "Consultas de emprendimientos" son bandejas
                      // distintas, cada una con su propio contador.
                      const count =
                        s.href === "/admin/gestion/consultas"
                          ? newInquiryCount
                          : s.href === "/admin/gestion/consultas-emprendimientos"
                            ? newDevelopmentInquiryCount
                            : s.href === "/admin/conversaciones"
                              ? newAiConversationCount
                              : s.href === "/admin/gestion/avisos-precio"
                                ? priceDropCount
                                : s.href === "/admin/gestion/aperturas-qr"
                                  ? newQrVisitCount
                                  : 0;
                      if (count <= 0) return null;
                      return (
                        <span
                          className={cn(
                            "flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          {count > 99 ? "99+" : count}
                        </span>
                      );
                    })()}
                    {s.subitems && (
                      <ChevronDownIcon
                        className={cn(
                          "size-3.5 shrink-0 opacity-70 transition-transform duration-200 ease-out",
                          expanded ? "rotate-0" : "-rotate-90",
                        )}
                      />
                    )}
                  </Link>
                  {s.subitems && (
                    <div
                      className={cn(
                        "grid transition-all duration-200 ease-out",
                        expanded
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-[1.15rem] flex flex-col gap-0 border-l border-sidebar-border py-0.5 pl-3.5">
                          {s.subitems.map((sub) => {
                            const subActive = panel === sub.panel;
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={onNavigate}
                                className={cn(
                                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                                  subActive
                                    ? "text-primary"
                                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
                                )}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-2">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <StoreIcon className="size-4 shrink-0" />
          Ver sitio
        </Link>
        {canInstall && (
          <button
            type="button"
            onClick={() => {
              promptInstall();
              onNavigate?.();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <DownloadIcon className="size-4 shrink-0" />
            Instalar app
          </button>
        )}
      </div>
    </div>
  );
}
