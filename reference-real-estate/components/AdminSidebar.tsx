"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Plus,
  FileText,
  Calculator,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  SlidersHorizontal,
  ExternalLink,
  BarChart3,
  Star,
  User,
  ShieldCheck,
  History,
  Bot,
  BellRing,
} from "lucide-react";

const NAV = [
  {
    section: "Principal",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Propiedades", href: "/admin/propiedades", icon: Building2 },
      { label: "Consorcios", href: "/admin/consorcios", icon: Users },
      { label: "Nueva propiedad", href: "/admin/nueva", icon: Plus },
      { label: "Destacadas", href: "/admin/destacadas", icon: Star },
      { label: "Opciones", href: "/admin/opciones", icon: SlidersHorizontal },
      { label: "Estadísticas", href: "/admin/estadisticas", icon: BarChart3 },
    ],
  },
  {
    section: "Consultas",
    items: [
      { label: "Tasaciones", href: "/admin/tasaciones", icon: Calculator },
      { label: "Contactos", href: "/admin/contactos", icon: Users },
      { label: "Alertas", href: "/admin/alertas", icon: BellRing },
    ],
  },
  {
    section: "Contenido",
    items: [
      { label: "Contenido del sitio", href: "/admin/contenido", icon: FileText },
      { label: "Asistente IA", href: "/admin/asistente", icon: Bot },
      { label: "Configuración", href: "/admin/configuracion", icon: Settings },
    ],
  },
  {
    section: "Administración",
    items: [
      { label: "Mi Perfil", href: "/admin/perfil", icon: User },
      { label: "Usuarios", href: "/admin/usuarios", icon: ShieldCheck },
      { label: "Logs de Actividad", href: "/admin/logs", icon: History },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingTasaciones, setPendingTasaciones] = useState(0);

  const [pendingContacts, setPendingContacts] = useState(0);
  const [pendingAlerts, setPendingAlerts] = useState(0);

  const fetchCounts = () => {
    Promise.all([
      fetch("/api/tasaciones").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
      fetch("/api/alerts").then((r) => r.json()),
    ])
      .then(([tas, con, alerts]) => {
        setPendingTasaciones((tas as { status: string }[]).filter((r) => r.status === "pending").length);
        setPendingContacts((con as { status: string }[]).filter((r) => r.status === "pending").length);
        setPendingAlerts((alerts as { pending: boolean }[]).filter((a) => a.pending).length);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCounts();
    window.addEventListener("admin-data-changed", fetchCounts);
    return () => window.removeEventListener("admin-data-changed", fetchCounts);
  }, [pathname]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <aside className="w-60 shrink-0 bg-[#262522] min-h-screen flex flex-col">

      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.06]">
        <a href="/">
          <img src="/logo.png" alt="Penalva" className="h-8 w-auto object-contain brightness-0 invert opacity-80" />
        </a>
        <p className="text-white/25 text-[10px] uppercase tracking-widest mt-2">Panel de administración</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="text-white/20 text-[9px] uppercase tracking-widest font-semibold px-3 mb-2">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group ${
                        active
                          ? "bg-brand-orange text-white"
                          : "text-white/40 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon size={15} className={active ? "text-white" : "text-white/30 group-hover:text-white/60"} />
                      {item.label}
                      {(() => {
                        const badge =
                          item.href === "/admin/tasaciones" && pendingTasaciones > 0 ? pendingTasaciones
                          : item.href === "/admin/contactos" && pendingContacts > 0 ? pendingContacts
                          : item.href === "/admin/alertas" && pendingAlerts > 0 ? pendingAlerts
                          : 0;
                        return badge > 0 ? (
                          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                            {badge}
                          </span>
                        ) : active ? (
                          <ChevronRight size={13} className="ml-auto opacity-60" />
                        ) : null;
                      })()}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-0.5">
        <a
          href="/"
          target="_blank"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/35 hover:text-white hover:bg-white/5 transition-all"
        >
          <ExternalLink size={15} />
          Ver sitio
        </a>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/35 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut size={15} />
          Cerrar sesión
        </button>
      </div>

    </aside>
  );
}
