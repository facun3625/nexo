import React from "react";
import {
  ShieldCheck,
  ClipboardList,
  Users,
  Wrench,
  Scale,
  CreditCard,
  BarChart3,
  CheckCircle,
  Clock,
} from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getSession } from "@/lib/auth";
import { getSiteConfig } from "@/lib/config";
import { getContent } from "@/lib/content";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Administración de Consorcios — Penalva Inmobiliaria",
  description: "Gestión profesional, transparente y eficiente de consorcios en Santa Fe.",
};

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Liquidación de Expensas",
    description: "Procesos claros, detallados y puntuales con múltiples medios de pago.",
  },
  {
    icon: Wrench,
    title: "Mantenimiento Preventivo",
    description: "Coordinación de servicios técnicos y reparaciones con proveedores calificados.",
  },
  {
    icon: Scale,
    title: "Asesoramiento Legal",
    description: "Cumplimiento normativo y gestión de conflictos basada en el marco legal vigente.",
  },
  {
    icon: Users,
    title: "Atención al Propietario",
    description: "Canales de comunicación fluidos para resolver dudas y reclamos rápidamente.",
  },
];

const INCLUDES = [
  "Liquidación mensual de expensas",
  "Pago a proveedores y servicios",
  "Gestión de cobranzas y morosidad",
  "Atención de emergencias 24/7",
  "Asambleas ordinarias y extraordinarias",
  "Informes de estado patrimonial",
  "Supervisión de personal de limpieza",
];

export default async function ConsorciosPage() {
  const [session, siteConfig, heroTitulo, heroSubtitulo, heroImg, introTitulo, introP1, introP2, consorcios] = await Promise.all([
    getSession(),
    getSiteConfig(),
    getContent("consorcios_hero_titulo"),
    getContent("consorcios_hero_subtitulo"),
    getContent("consorcios_hero_img"),
    getContent("consorcios_intro_titulo"),
    getContent("consorcios_intro_p1"),
    getContent("consorcios_intro_p2"),
    prisma.consorcio.findMany({
      where: { active: true },
      orderBy: { order: "asc" }
    })
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#111]">
      <Header active="/administracion-consorcios" isLoggedIn={!!session} facebook={siteConfig.facebook ?? undefined} instagram={siteConfig.instagram ?? undefined} />

      {/* ── HERO ── */}
      <section className="relative h-[320px] overflow-hidden">
        <img
          src={heroImg}
          alt="Administración de Consorcios"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#262522]/85 via-[#262522]/60 to-transparent" />
        <div className="absolute inset-0 flex items-center px-8 md:px-16 lg:px-24">
          <div>
            <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
              Servicios
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
      <section className="py-24 bg-[#f8f6f2]">
        <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-brand-orange text-[10px] uppercase tracking-[0.4em] font-semibold mb-3">
                Gestión Profesional
              </p>
              <h2 className="text-3xl md:text-[40px] font-bold text-[#111] mb-8 leading-tight">
                {introTitulo}
              </h2>
              <div className="space-y-6 text-[16px] text-gray-600 leading-relaxed">
                <p>{introP1}</p>
                <p>{introP2}</p>
              </div>
              <div className="mt-10">
                <a 
                  href="#contacto" 
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange text-white font-bold rounded-lg hover:bg-brand-orange/90 transition-all shadow-lg shadow-brand-orange/20"
                >
                  Solicitar presupuesto
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-brand-orange/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="text-brand-orange" size={24} />
                    </div>
                    <h3 className="font-bold text-[#111] mb-2">{feat.title}</h3>
                    <p className="text-[13px] text-gray-500 leading-relaxed">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONSORCIOS ADMINISTRADOS ── */}
      {consorcios.length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16">
            <div className="mb-12">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-brand-orange mb-4">Transferencias</h2>
              <h3 className="text-3xl font-bold text-[#111]">Cuentas corrientes para expensas</h3>
              <p className="text-gray-400 mt-4 text-[14px]">
                Importante: Una vez realizado el depósito o transferencia, enviar el comprobante de pago especificando Titular y Unidad a:{" "}
                <a href="mailto:claudio@penalvainmobiliaria.com.ar" className="text-brand-orange font-semibold hover:underline">
                  claudio@penalvainmobiliaria.com.ar
                </a>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {consorcios.map((c: any) => (
                <div key={c.id} className="bg-[#f8f6f2] rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                  <div className="mb-6 pb-6 border-b border-gray-200/50">
                    <h4 className="text-[15px] font-bold text-[#111] uppercase tracking-wider">{c.nombre}</h4>
                  </div>
                  
                  <div className="space-y-4 flex-1">
                    {c.banco && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Banco</p>
                        <p className="text-[14px] text-gray-700 font-medium uppercase">{c.banco}</p>
                      </div>
                    )}
                    {c.titular && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Nombre</p>
                        <p className="text-[14px] text-gray-700 font-medium uppercase">{c.titular}</p>
                      </div>
                    )}
                    {c.cuit && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">CUIT</p>
                        <p className="text-[14px] text-gray-700 font-medium">{c.cuit}</p>
                      </div>
                    )}
                    {c.ca && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Cuenta</p>
                        <p className="text-[14px] text-gray-700 font-medium">{c.ca}</p>
                      </div>
                    )}
                    {c.cbu && (
                      <div className="bg-white/50 p-4 rounded-xl mt-4">
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">CBU</p>
                        <p className="text-[13px] text-[#111] font-mono break-all">{c.cbu}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DETALLES ── */}
      <section className="py-24 bg-[#f8f6f2]">
        <div className="max-w-5xl mx-auto px-8 md:px-12 lg:px-16 text-center">
          <h2 className="text-3xl font-bold mb-12">¿Qué incluye nuestra gestión?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            {INCLUDES.map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-xl bg-[#f8f6f2] border border-gray-100">
                <CheckCircle size={18} className="text-brand-orange shrink-0" />
                <span className="text-[14px] font-medium text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-[#262522] text-center">
        <div className="max-w-3xl mx-auto px-8">
          <ShieldCheck size={48} className="text-brand-orange mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Transparencia y Confianza</h2>
          <p className="text-white/60 mb-10 text-lg">
            Deje la administración de su edificio en manos de expertos. 
            Garantizamos una gestión eficiente que valoriza su patrimonio.
          </p>
          <a 
            href="mailto:administracion@penalvainmobiliaria.com.ar" 
            className="inline-flex items-center gap-2 text-white font-bold text-xl hover:text-brand-orange transition-colors"
          >
            administracion@penalvainmobiliaria.com.ar
          </a>
        </div>
      </section>

      <Footer siteConfig={siteConfig} />
    </div>
  );
}
