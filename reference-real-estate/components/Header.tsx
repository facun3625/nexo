"use client";

import { useState } from "react";
import { Phone, Mail, Facebook, Instagram, Menu, X, LayoutDashboard, Lock, ChevronDown } from "lucide-react";
import AccesoButton from "@/components/AccesoButton";
import FavoritosNavButton from "@/components/FavoritosNavButton";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { 
    label: "Servicios", 
    submenu: [
      { href: "/tasacion", label: "Tasación" },
      { href: "/administracion-consorcios", label: "Administración de Consorcios" },
      { href: "/obras", label: "Proyecto y Ejecución de Obras" },
    ]
  },
  { href: "/mapa", label: "Propiedades en Mapa" },
  { href: "/alertas", label: "Recibir Alertas" },
  { href: "#contacto", label: "Contacto" },
];

interface Props {
  active?: string;
  isLoggedIn?: boolean;
  facebook?: string;
  instagram?: string;
}

export default function Header({ active, isLoggedIn, facebook, instagram }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[9999]">

      {/* Top bar — hidden on mobile */}
      <div className="hidden md:flex bg-[#3a3a3a] px-4 h-9 items-center justify-end">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-end gap-6 text-[11px] text-white/55">
          <div className="flex items-center gap-1.5">
            <Mail size={11} className="text-white/60" />
            <span>administracion@penalvainmobiliaria.com.ar</span>
          </div>
          <a href="tel:+543424565000" className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone size={11} className="text-white/60" />
            <span>+54 342 456-5000</span>
          </a>
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            {facebook && <a href={facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white transition-colors"><Facebook size={12} /></a>}
            {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white transition-colors"><Instagram size={12} /></a>}
          </div>
        </div>
      </div>

      {/* Logo row */}
      <div className="bg-[#262522] py-4 md:py-5 flex justify-center items-center">
        <a href="/">
          <img src="/logo.png" alt="Penalva Inmobiliaria" className="h-12 md:h-16 lg:h-20 w-auto object-contain" />
        </a>
      </div>

      {/* Nav bar */}
      <div className="bg-brand-orange">
        <div className="px-4 h-12 flex items-center justify-between md:justify-center gap-2">

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center text-[13px] font-medium text-white/70">
            {NAV_LINKS.map((link, i) => (
              <span key={link.label} className="flex items-center h-full group relative">
                {i > 0 && <span className="w-px h-3.5 bg-white/25" />}
                {link.submenu ? (
                  <div className="relative h-full flex items-center">
                    <button
                      className={`px-5 py-3 transition-colors hover:text-white flex items-center gap-1.5 ${
                        link.submenu.some(s => s.href === active) ? "text-white font-semibold" : ""
                      }`}
                    >
                      {link.label}
                      <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-[100]">
                      <div className="bg-[#262522] border border-white/10 rounded-lg shadow-2xl py-2 min-w-[240px] overflow-hidden">
                        {link.submenu.map((sub) => (
                          <a
                            key={sub.href}
                            href={sub.href}
                            className={`block px-5 py-3 text-[13px] transition-colors hover:bg-white/5 hover:text-white ${
                              active === sub.href ? "text-brand-orange font-semibold bg-white/5" : "text-white/70"
                            }`}
                          >
                            {sub.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <a
                    href={link.href}
                    className={`px-5 py-3 transition-colors hover:text-white ${active === link.href ? "text-white font-semibold" : ""}`}
                  >
                    {link.label}
                  </a>
                )}
              </span>
            ))}
          </nav>

          {/* Mobile: logo text + hamburger */}
          <span className="md:hidden text-white font-bold text-[13px] tracking-wide">Penalva</span>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-white p-1"
            aria-label="Menú"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Desktop right buttons */}
          <div className="hidden md:flex items-center gap-2 md:absolute md:right-4">
            <FavoritosNavButton />
            <AccesoButton isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <div className="md:hidden bg-[#262522] border-t border-white/10 absolute w-full left-0 z-[9999] shadow-xl">
          <nav className="flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <div key={link.label} className="border-b border-white/5">
                {link.submenu ? (
                  <div className="flex flex-col">
                    <div className="px-6 py-4 text-[14px] font-bold text-white/40 uppercase tracking-widest bg-white/[0.02]">
                      {link.label}
                    </div>
                    {link.submenu.map((sub) => (
                      <a
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setOpen(false)}
                        className={`px-10 py-4 text-[14px] font-medium border-b border-white/5 transition-colors hover:bg-white/5 ${
                          active === sub.href ? "text-brand-orange" : "text-white/80"
                        }`}
                      >
                        {sub.label}
                      </a>
                    ))}
                  </div>
                ) : (
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`px-6 py-4 text-[14px] font-medium block transition-colors hover:bg-white/5 ${
                      active === link.href ? "text-brand-orange" : "text-white/80"
                    }`}
                  >
                    {link.label}
                  </a>
                )}
              </div>
            ))}
            <FavoritosNavButton mobile onClick={() => setOpen(false)} />
            {isLoggedIn ? (
              <a href="/admin" onClick={() => setOpen(false)} className="px-6 py-4 text-[14px] font-medium text-brand-orange hover:bg-white/5 flex items-center gap-2">
                <LayoutDashboard size={14} />
                Dashboard
              </a>
            ) : (
              <a href="/admin/login" onClick={() => setOpen(false)} className="px-6 py-4 text-[14px] font-medium text-white/80 hover:bg-white/5 flex items-center gap-2">
                <Lock size={14} />
                Acceso
              </a>
            )}
          </nav>
        </div>
      )}

    </header>
  );
}
