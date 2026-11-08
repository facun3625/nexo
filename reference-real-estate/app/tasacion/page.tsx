import React from "react";
import {
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  FileText,
  Home,
  BarChart2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import { getContentBatch } from "@/lib/content";
import TasacionForm from "@/components/TasacionForm";

export const metadata = {
  title: "Tasación de Propiedades — Penalva Inmobiliaria",
  description:
    "Tasaciones profesionales y precisas para conocer el valor real de tu propiedad en Santa Fe, Argentina.",
};

const TYPE_ICONS = [Home, BarChart2, FileText, ShieldCheck];

const TASACION_KEYS = [
  "tasacion_hero_titulo", "tasacion_hero_subtitulo", "tasacion_hero_img", "tasacion_hero_eyebrow",
  "tasacion_intro_titulo", "tasacion_intro_eyebrow", "tasacion_intro_p1", "tasacion_intro_p2",
  "tasacion_intro_cta", "tasacion_contacto_nota",
  "tasacion_incluye_titulo", "tasacion_incluye_1", "tasacion_incluye_2", "tasacion_incluye_3", "tasacion_incluye_nota",
  "tasacion_tipos_titulo", "tasacion_tipos_eyebrow",
  "tasacion_tipo1_titulo", "tasacion_tipo1_desc",
  "tasacion_tipo2_titulo", "tasacion_tipo2_desc",
  "tasacion_tipo3_titulo", "tasacion_tipo3_desc",
  "tasacion_tipo4_titulo", "tasacion_tipo4_desc",
  "tasacion_proceso_titulo", "tasacion_proceso_eyebrow",
  "tasacion_paso1_titulo", "tasacion_paso1_desc",
  "tasacion_paso2_titulo", "tasacion_paso2_desc",
  "tasacion_paso3_titulo", "tasacion_paso3_desc",
  "tasacion_paso4_titulo", "tasacion_paso4_desc",
  "tasacion_form_titulo", "tasacion_form_subtitulo", "tasacion_form_eyebrow",
];

export default async function TasacionPage() {
  const [session, siteConfig, c] = await Promise.all([
    getSession(),
    getSiteConfig(),
    getContentBatch(TASACION_KEYS),
  ]);

  const STEPS = [
    { number: "01", title: c.tasacion_paso1_titulo, description: c.tasacion_paso1_desc },
    { number: "02", title: c.tasacion_paso2_titulo, description: c.tasacion_paso2_desc },
    { number: "03", title: c.tasacion_paso3_titulo, description: c.tasacion_paso3_desc },
    { number: "04", title: c.tasacion_paso4_titulo, description: c.tasacion_paso4_desc },
  ];

  const INCLUDES = [c.tasacion_incluye_1, c.tasacion_incluye_2, c.tasacion_incluye_3];

  const TYPES = [
    { icon: TYPE_ICONS[0], title: c.tasacion_tipo1_titulo, description: c.tasacion_tipo1_desc },
    { icon: TYPE_ICONS[1], title: c.tasacion_tipo2_titulo, description: c.tasacion_tipo2_desc },
    { icon: TYPE_ICONS[2], title: c.tasacion_tipo3_titulo, description: c.tasacion_tipo3_desc },
    { icon: TYPE_ICONS[3], title: c.tasacion_tipo4_titulo, description: c.tasacion_tipo4_desc },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">

      <Header active="/tasacion" isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      {/* ── HERO ── */}
      <section className="relative h-[320px] overflow-hidden">
        <img
          src={c.tasacion_hero_img}
          alt="Tasación de propiedades"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#262522]/90 via-[#262522]/65 to-transparent" />
        <div className="absolute inset-0 flex items-center px-8 md:px-16 lg:px-24">
          <div>
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
              {c.tasacion_hero_eyebrow}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {c.tasacion_hero_titulo.split("\n").map((line: string, i: number, arr: string[]) => (
                <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
              ))}
            </h1>
            <p className="mt-3 text-white/50 text-[14px] max-w-md leading-relaxed">
              {c.tasacion_hero_subtitulo}
            </p>
          </div>
        </div>
      </section>

      {/* ── INTRO + QUÉ INCLUYE ── */}
      <section className="py-20 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            <div>
              <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
                {c.tasacion_intro_eyebrow}
              </p>
              <h2 className="text-3xl md:text-[32px] font-bold text-[#111] mb-6 leading-tight">
                {c.tasacion_intro_titulo}
              </h2>
              <div className="space-y-4 text-[15px] text-gray-600 leading-relaxed">
                <p>{c.tasacion_intro_p1}</p>
                {c.tasacion_intro_p2 && <p>{c.tasacion_intro_p2}</p>}
                <a href="#solicitar" className="inline-block text-brand-orange font-semibold hover:opacity-75 transition-opacity">{c.tasacion_intro_cta}</a>
              </div>

              <div className="mt-8 flex items-center gap-3 text-[13px] text-gray-500">
                <Clock size={15} className="text-brand-orange shrink-0" />
                <span>{c.tasacion_contacto_nota}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h3 className="font-bold text-[#111] text-[16px] mb-6">{c.tasacion_incluye_titulo}</h3>
              <ul className="space-y-3.5">
                {INCLUDES.filter(Boolean).map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle size={16} className="text-brand-orange shrink-0 mt-0.5" />
                    <span className="text-[14px] text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-[13px] text-gray-400 text-center">
                  {c.tasacion_incluye_nota}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── TIPOS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="text-center mb-14">
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
              {c.tasacion_tipos_eyebrow}
            </p>
            <h2 className="text-3xl md:text-[32px] font-bold text-[#111]">
              {c.tasacion_tipos_titulo}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <div
                  key={type.title}
                  className="group p-7 rounded-xl border border-gray-100 hover:border-brand-orange/30 hover:shadow-lg transition-all duration-300 bg-[#f8f6f2] hover:bg-white"
                >
                  <div className="w-11 h-11 bg-brand-orange/10 rounded-lg flex items-center justify-center mb-5 group-hover:bg-brand-orange/15 transition-colors">
                    <Icon size={20} className="text-brand-orange" />
                  </div>
                  <h3 className="font-bold text-[#111] text-[15px] mb-2">{type.title}</h3>
                  <p className="text-gray-500 text-[13px] leading-relaxed">{type.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="py-20 bg-[#262522]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="text-center mb-14">
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
              {c.tasacion_proceso_eyebrow}
            </p>
            <h2 className="text-3xl md:text-[32px] font-bold text-white">
              {c.tasacion_proceso_titulo}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div key={step.number} className="relative">
                <div className="bg-white/5 rounded-xl p-7 h-full border border-white/[0.07] relative">
                  <div className="text-4xl font-bold text-brand-orange/30 mb-4 leading-none">{step.number}</div>
                  <h3 className="font-bold text-white text-[15px] mb-2">{step.title}</h3>
                  <p className="text-white/40 text-[13px] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FORMULARIO CTA ── */}
      <section id="solicitar" className="py-20 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <div>
              <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
                {c.tasacion_form_eyebrow}
              </p>
              <h2 className="text-3xl md:text-[32px] font-bold text-[#111] mb-4 leading-tight">
                {c.tasacion_form_titulo.split("\n").map((line: string, i: number, arr: string[]) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </h2>
              <p className="text-gray-500 text-[15px] leading-relaxed mb-8">
                {c.tasacion_form_subtitulo}
              </p>
              <div className="space-y-4 text-[14px] text-gray-500">
                <div className="flex items-center gap-3">
                  <Phone size={14} className="text-brand-orange shrink-0" />
                  <span>{siteConfig.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={14} className="text-brand-orange shrink-0" />
                  <span>{siteConfig.email}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={14} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>{siteConfig.address}</span>
                </div>
              </div>
            </div>

            <TasacionForm />

          </div>
        </div>
      </section>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
