import React from "react";
import {
  Compass,
  HardHat,
  Ruler,
  Paintbrush,
  Home,
  Building2,
  CheckCircle,
  Clock,
  MapPin,
} from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import { getContent } from "@/lib/content";

export const metadata = {
  title: "Proyecto y Ejecución de Obras — Penalva Inmobiliaria",
  description: "Servicios integrales de arquitectura y construcción en Santa Fe. Desde el proyecto hasta la llave en mano.",
};

const SERVICES = [
  {
    icon: Compass,
    title: "Diseño y Proyecto",
    description: "Desarrollamos planos, maquetas 3D y documentación técnica completa para su obra.",
  },
  {
    icon: Ruler,
    title: "Dirección de Obra",
    description: "Supervisión técnica profesional para garantizar que se cumplan los estándares de calidad.",
  },
  {
    icon: HardHat,
    title: "Ejecución de Obra",
    description: "Gestión total de la construcción con mano de obra especializada y control de plazos.",
  },
  {
    icon: Paintbrush,
    title: "Remodelaciones",
    description: "Renovamos sus espacios actuales para darles una nueva vida y mayor valor de mercado.",
  },
];

const VALUES = [
  { title: "Calidad Constructiva", text: "Materiales de primera línea y terminaciones de excelencia." },
  { title: "Cumplimiento de Plazos", text: "Respetamos los tiempos acordados para la entrega de su proyecto." },
  { title: "Presupuesto Cerrado", text: "Transparencia total en los costos sin sorpresas de último momento." },
];

export default async function ObrasPage() {
  const [session, siteConfig, heroTitulo, heroSubtitulo, heroImg, introTitulo, introP1, introP2] = await Promise.all([
    getSession(),
    getSiteConfig(),
    getContent("obras_hero_titulo"),
    getContent("obras_hero_subtitulo"),
    getContent("obras_hero_img"),
    getContent("obras_intro_titulo"),
    getContent("obras_intro_p1"),
    getContent("obras_intro_p2"),
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">
      <Header active="/obras" isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      {/* ── HERO ── */}
      <section className="relative h-[320px] overflow-hidden">
        <img
          src={heroImg}
          alt="Proyecto y Obra"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#262522]/85 via-[#262522]/60 to-transparent" />
        <div className="absolute inset-0 flex items-center px-8 md:px-16 lg:px-24">
          <div>
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
              Arquitectura & Construcción
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              {heroTitulo}
            </h1>
            <p className="mt-3 text-white/50 text-[14px] max-w-md leading-relaxed">
              {heroSubtitulo}
            </p>
          </div>
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="max-w-3xl mb-16">
            <h2 className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
              Nuestra Visión
            </h2>
            <h3 className="text-4xl font-bold text-[#111] mb-6">{introTitulo}</h3>
            <div className="space-y-4 text-lg text-gray-500 leading-relaxed">
              <p>{introP1}</p>
              <p>{introP2}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="group p-8 bg-[#f8f6f2] rounded-3xl hover:bg-brand-orange transition-all duration-500">
                  <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                    <Icon className="text-brand-orange group-hover:text-white" size={28} />
                  </div>
                  <h4 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">{s.title}</h4>
                  <p className="text-gray-500 group-hover:text-white/80 transition-colors text-sm leading-relaxed">{s.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── VALORES ── */}
      <section className="py-24 bg-[#262522]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {VALUES.map((v) => (
              <div key={v.title} className="text-center lg:text-left">
                <CheckCircle size={32} className="text-brand-orange mb-6 mx-auto lg:mx-0" />
                <h5 className="text-white text-xl font-bold mb-4">{v.title}</h5>
                <p className="text-white/40 leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INFO ── */}
      <section className="py-24 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="bg-white rounded-[40px] p-12 md:p-20 shadow-xl flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-bold mb-8">¿Listo para empezar a construir?</h2>
              <p className="text-gray-500 text-lg mb-8">
                Coordinamos una entrevista para conocer tus ideas y brindarte un presupuesto estimativo inicial.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 bg-[#f8f6f2] px-4 py-2 rounded-full text-sm font-medium text-gray-700">
                  <MapPin size={16} className="text-brand-orange" />
                  Santa Fe y la región
                </div>
                <div className="flex items-center gap-2 bg-[#f8f6f2] px-4 py-2 rounded-full text-sm font-medium text-gray-700">
                  <Clock size={16} className="text-brand-orange" />
                  Atención personalizada
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <a 
                href="/#contacto" 
                className="inline-block px-10 py-5 bg-brand-orange text-white font-bold rounded-2xl hover:scale-105 transition-transform shadow-2xl shadow-brand-orange/30"
              >
                HABLEMOS DE TU PROYECTO
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
