import React from "react";
import {
  Clock,
  Award,
  Users,
  Shield,
  Handshake,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import { getContentBatch } from "@/lib/content";

export const metadata = {
  title: "Nosotros — Penalva Inmobiliaria",
  description:
    "Más de 20 años de trayectoria en compra, venta y alquiler de propiedades en Santa Fe, Argentina.",
};

const VALUE_ICONS = [Shield, Handshake, Award, TrendingUp];

const NOSOTROS_KEYS = [
  "nosotros_hero_titulo", "nosotros_hero_subtitulo", "nosotros_hero_img", "nosotros_hero_eyebrow",
  "nosotros_empresa_titulo", "nosotros_empresa_eyebrow", "nosotros_empresa_img",
  "nosotros_empresa_p1", "nosotros_empresa_p2", "nosotros_empresa_p3", "nosotros_empresa_quote",
  "nosotros_horario", "nosotros_badge_valor", "nosotros_badge_label",
  "nosotros_stat1_valor", "nosotros_stat1_label",
  "nosotros_stat2_valor", "nosotros_stat2_label",
  "nosotros_stat3_valor", "nosotros_stat3_label",
  "nosotros_stat4_valor", "nosotros_stat4_label",
  "nosotros_valores_titulo", "nosotros_valores_eyebrow",
  "nosotros_valor1_titulo", "nosotros_valor1_desc",
  "nosotros_valor2_titulo", "nosotros_valor2_desc",
  "nosotros_valor3_titulo", "nosotros_valor3_desc",
  "nosotros_valor4_titulo", "nosotros_valor4_desc",
  "nosotros_equipo_titulo", "nosotros_equipo_eyebrow",
  "nosotros_miembro1_nombre", "nosotros_miembro1_rol", "nosotros_miembro1_desc",
  "nosotros_miembro2_nombre", "nosotros_miembro2_rol", "nosotros_miembro2_desc",
  "nosotros_miembro3_nombre", "nosotros_miembro3_rol", "nosotros_miembro3_desc",
  "nosotros_membresias_eyebrow",
  "nosotros_membresia1_nombre", "nosotros_membresia1_desc",
  "nosotros_membresia2_nombre", "nosotros_membresia2_desc",
  "nosotros_membresia3_nombre", "nosotros_membresia3_desc",
  "nosotros_contacto_eyebrow", "nosotros_contacto_titulo", "nosotros_contacto_texto", "nosotros_contacto_email_cta",
];

export default async function NosotrosPage() {
  const [session, siteConfig, c] = await Promise.all([
    getSession(),
    getSiteConfig(),
    getContentBatch(NOSOTROS_KEYS),
  ]);

  const STATS = [
    { value: c.nosotros_stat1_valor, label: c.nosotros_stat1_label },
    { value: c.nosotros_stat2_valor, label: c.nosotros_stat2_label },
    { value: c.nosotros_stat3_valor, label: c.nosotros_stat3_label },
    { value: c.nosotros_stat4_valor, label: c.nosotros_stat4_label },
  ];

  const VALUES = [
    { icon: VALUE_ICONS[0], title: c.nosotros_valor1_titulo, description: c.nosotros_valor1_desc },
    { icon: VALUE_ICONS[1], title: c.nosotros_valor2_titulo, description: c.nosotros_valor2_desc },
    { icon: VALUE_ICONS[2], title: c.nosotros_valor3_titulo, description: c.nosotros_valor3_desc },
    { icon: VALUE_ICONS[3], title: c.nosotros_valor4_titulo, description: c.nosotros_valor4_desc },
  ];

  const TEAM = [
    { name: c.nosotros_miembro1_nombre, role: c.nosotros_miembro1_rol, description: c.nosotros_miembro1_desc },
    { name: c.nosotros_miembro2_nombre, role: c.nosotros_miembro2_rol, description: c.nosotros_miembro2_desc },
    { name: c.nosotros_miembro3_nombre, role: c.nosotros_miembro3_rol, description: c.nosotros_miembro3_desc },
  ];

  const MEMBERSHIPS = [
    { name: c.nosotros_membresia1_nombre, description: c.nosotros_membresia1_desc },
    { name: c.nosotros_membresia2_nombre, description: c.nosotros_membresia2_desc },
    { name: c.nosotros_membresia3_nombre, description: c.nosotros_membresia3_desc },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">

      <Header active="/nosotros" isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      {/* ── HERO ── */}
      <section className="relative h-[320px] overflow-hidden">
        <img
          src={c.nosotros_hero_img}
          alt="Oficina Penalva"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#262522]/85 via-[#262522]/60 to-transparent" />
        <div className="absolute inset-0 flex items-center px-8 md:px-16 lg:px-24">
          <div>
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
              {c.nosotros_hero_eyebrow}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {c.nosotros_hero_titulo}
            </h1>
            <p className="mt-3 text-white/50 text-[14px] max-w-md leading-relaxed">
              {c.nosotros_hero_subtitulo}
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-brand-orange">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 py-0">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className={`py-8 flex flex-col items-center text-center ${
                  i < STATS.length - 1 ? "border-r border-white/20" : ""
                }`}
              >
                <span className="text-3xl md:text-4xl font-bold text-white">{stat.value}</span>
                <span className="mt-1 text-[11px] font-medium uppercase tracking-widest text-white/60">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LA EMPRESA ── */}
      <section className="py-20 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
                {c.nosotros_empresa_eyebrow}
              </p>
              <h2 className="text-3xl md:text-[32px] font-bold text-[#111] mb-6 leading-tight">
                {c.nosotros_empresa_titulo.split("\n").map((line: string, i: number, arr: string[]) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </h2>
              <div className="space-y-4 text-[15px] text-gray-600 leading-relaxed">
                <p>{c.nosotros_empresa_p1}</p>
                {c.nosotros_empresa_p2 && <p>{c.nosotros_empresa_p2}</p>}
                {c.nosotros_empresa_p3 && <p>{c.nosotros_empresa_p3}</p>}
                {c.nosotros_empresa_quote && (
                  <p className="text-brand-orange font-semibold italic">{c.nosotros_empresa_quote}</p>
                )}
              </div>

              <div className="mt-8 flex items-center gap-3 text-[13px] text-gray-500">
                <Clock size={15} className="text-brand-orange shrink-0" />
                <span>{c.nosotros_horario}</span>
              </div>
            </div>

            <div className="relative">
              <img
                src={c.nosotros_empresa_img}
                alt="Oficina Penalva"
                className="w-full h-[420px] object-cover rounded-2xl shadow-xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-brand-orange text-white p-6 rounded-xl shadow-lg">
                <div className="text-3xl font-bold">{c.nosotros_badge_valor}</div>
                <div className="text-[11px] uppercase tracking-widest text-white/70 mt-0.5">{c.nosotros_badge_label}</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── VALORES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="text-center mb-14">
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
              {c.nosotros_valores_eyebrow}
            </p>
            <h2 className="text-3xl md:text-[32px] font-bold text-[#111]">
              {c.nosotros_valores_titulo}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.title}
                  className="group p-7 rounded-xl border border-gray-100 hover:border-brand-orange/30 hover:shadow-lg transition-all duration-300 bg-[#f8f6f2] hover:bg-white"
                >
                  <div className="w-11 h-11 bg-brand-orange/10 rounded-lg flex items-center justify-center mb-5 group-hover:bg-brand-orange/15 transition-colors">
                    <Icon size={20} className="text-brand-orange" />
                  </div>
                  <h3 className="font-bold text-[#111] text-[15px] mb-2">{val.title}</h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed">{val.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── EQUIPO ── */}
      <section className="py-20 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="mb-14">
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
              {c.nosotros_equipo_eyebrow}
            </p>
            <h2 className="text-3xl md:text-[32px] font-bold text-[#111]">
              {c.nosotros_equipo_titulo}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="w-14 h-14 bg-[#262522] rounded-full flex items-center justify-center mb-5">
                  <Users size={22} className="text-white/50" />
                </div>
                <h3 className="font-bold text-[#111] text-[16px] mb-0.5">{member.name}</h3>
                <p className="text-brand-orange text-[11px] font-semibold uppercase tracking-wider mb-3">{member.role}</p>
                <p className="text-gray-500 text-[13px] leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MEMBRESÍAS ── */}
      <section className="py-16 bg-[#262522]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <p className="text-center text-white/30 text-[10px] uppercase tracking-[0.4em] font-semibold mb-10">
            {c.nosotros_membresias_eyebrow}
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {MEMBERSHIPS.map((m) => (
              <div key={m.name} className="text-center">
                <div className="text-2xl font-bold text-white/80 tracking-widest mb-1">{m.name}</div>
                <div className="text-[11px] text-white/30 max-w-[180px] leading-snug">{m.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACTO CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
            {c.nosotros_contacto_eyebrow}
          </p>
          <h2 className="text-3xl md:text-[32px] font-bold text-[#111] mb-4">
            {c.nosotros_contacto_titulo}
          </h2>
          <p className="text-gray-500 text-[15px] leading-relaxed mb-10">
            {c.nosotros_contacto_texto}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`tel:${(siteConfig.phone ?? "").replace(/[^0-9+]/g, "")}`}
              className="flex items-center gap-2.5 bg-brand-orange text-white font-bold text-[13px] uppercase tracking-wider px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Phone size={15} />
              {siteConfig.phone}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="flex items-center gap-2.5 bg-[#f0efed] text-[#111] font-bold text-[13px] uppercase tracking-wider px-8 py-4 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Mail size={15} />
              {c.nosotros_contacto_email_cta}
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-2 text-[13px] text-gray-400">
            <MapPin size={13} className="text-brand-orange" />
            <span>{siteConfig.address}</span>
          </div>
        </div>
      </section>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
