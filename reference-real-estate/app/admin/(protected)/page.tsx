"use client";

import React, { useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Eye,
  ArrowRight,
  MapPin,
  Loader2,
  Users,
  MessageSquare,
  Star,
  TrendingUp,
  Clock,
  Phone,
} from "lucide-react";
import { formatPrice } from "@/lib/formatPrice";

export default function AdminDashboard() {
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [tasaciones, setTasaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/properties").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
      fetch("/api/tasaciones").then((r) => r.json()),
    ]).then(([props, st, cont, tas]) => {
      setProperties(props);
      setStats(st);
      setContacts(cont);
      setTasaciones(tas);
      setLoading(false);
    });
  }, []);

  const total = properties.length;
  const featured = properties.filter((p) => p.featured).length;
  const pendingContacts = contacts.filter((c: any) => c.status === "pending").length;
  const pendingTas = tasaciones.filter((t: any) => t.status === "pending").length;
  const totalPending = pendingContacts + pendingTas;
  const recent = [...properties].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 5);

  // Últimas consultas combinadas (contacts + tasaciones)
  const recentConsultas = [
    ...contacts.map((c: any) => ({ ...c, _type: "contact" })),
    ...tasaciones.map((t: any) => ({ ...t, _type: "tasacion" })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const kpis = [
    {
      label: "Propiedades",
      value: loading ? null : total,
      sub: loading ? "" : `${properties.filter((p) => p.type === "Venta").length} venta · ${properties.filter((p) => p.type === "Alquiler").length} alquiler`,
      icon: Building2,
      accent: "#df691a",
      bg: "#fff7f2",
    },
    {
      label: "Visitas únicas",
      value: loading || !stats ? null : stats.uniqueMonth,
      sub: loading || !stats ? "" : `${stats.uniqueToday} hoy · ${stats.uniqueWeek} esta semana`,
      icon: Users,
      accent: "#6366f1",
      bg: "#f5f5ff",
    },
    {
      label: "Consultas pendientes",
      value: loading ? null : totalPending,
      sub: loading ? "" : `${pendingContacts} chat · ${pendingTas} tasaciones`,
      icon: MessageSquare,
      accent: totalPending > 0 ? "#ef4444" : "#22c55e",
      bg: totalPending > 0 ? "#fff5f5" : "#f0fdf4",
    },
    {
      label: "Destacadas",
      value: loading ? null : featured,
      sub: loading ? "" : `de ${total} propiedades`,
      icon: Star,
      accent: "#f59e0b",
      bg: "#fffbeb",
    },
  ];

  return (
    <div className="p-8 max-w-6xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#111]">Dashboard</h1>
        <p className="text-gray-400 text-[13px] mt-1">Panel de administración · Penalva Inmobiliaria</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: kpi.bg }}
                >
                  <Icon size={16} style={{ color: kpi.accent }} />
                </div>
                {kpi.value !== null && kpi.value !== undefined && typeof kpi.value === "number" && kpi.label === "Consultas pendientes" && kpi.value > 0 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                    Nuevo
                  </span>
                )}
              </div>
              <p className="text-[28px] font-bold text-[#111] leading-none mb-1">
                {loading ? <Loader2 size={18} className="animate-spin text-gray-200 mt-1" /> : kpi.value}
              </p>
              <p className="text-[11px] font-medium text-gray-400 mt-1 leading-none">{kpi.label}</p>
              {kpi.sub && <p className="text-[10px] text-gray-300 mt-1.5">{kpi.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <a
          href="/admin/nueva"
          className="flex items-center gap-3 bg-brand-orange hover:bg-orange-700 text-white rounded-xl px-5 py-4 transition-colors group"
        >
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
            <Plus size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px]">Nueva propiedad</p>
            <p className="text-white/60 text-[11px]">Publicar inmueble</p>
          </div>
          <ArrowRight size={14} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
        </a>
        <a
          href="/admin/propiedades"
          className="flex items-center gap-3 bg-white hover:bg-gray-50 text-[#111] rounded-xl px-5 py-4 border border-gray-100 shadow-sm transition-colors group"
        >
          <div className="w-8 h-8 bg-[#f4f4f5] rounded-lg flex items-center justify-center shrink-0">
            <Eye size={15} className="text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px]">Propiedades</p>
            <p className="text-gray-400 text-[11px]">Gestionar listado</p>
          </div>
          <ArrowRight size={14} className="opacity-30 group-hover:opacity-70 transition-all" />
        </a>
        <a
          href="/admin/estadisticas"
          className="flex items-center gap-3 bg-white hover:bg-gray-50 text-[#111] rounded-xl px-5 py-4 border border-gray-100 shadow-sm transition-colors group"
        >
          <div className="w-8 h-8 bg-[#f4f4f5] rounded-lg flex items-center justify-center shrink-0">
            <TrendingUp size={15} className="text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px]">Estadísticas</p>
            <p className="text-gray-400 text-[11px]">Ver analíticas</p>
          </div>
          <ArrowRight size={14} className="opacity-30 group-hover:opacity-70 transition-all" />
        </a>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent properties — wider */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[14px] text-[#111]">Propiedades recientes</h2>
            <a href="/admin/propiedades" className="text-[11px] text-brand-orange hover:text-orange-700 transition-colors font-medium">
              Ver todas
            </a>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={18} className="animate-spin text-gray-200" />
            </div>
          ) : recent.length === 0 ? (
            <div className="py-12 text-center text-gray-300 text-[13px]">Sin propiedades aún</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recent.map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-[#f4f4f5] rounded-lg flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#111] truncate">{p.title}</p>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <MapPin size={9} />
                      <span className="truncate">{p.city}, {p.address}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-semibold text-brand-orange">{formatPrice(p.price, p.currency, p.pricePerMonth)}</p>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${p.type === "Venta" ? "bg-blue-50 text-blue-400" : "bg-emerald-50 text-emerald-500"}`}>
                      {p.type}
                    </span>
                  </div>
                  <a href={`/propiedad/${p.id}`} target="_blank" className="text-gray-200 hover:text-brand-orange transition-colors ml-1">
                    <Eye size={14} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent consultas — narrower */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[14px] text-[#111]">Últimas consultas</h2>
            <div className="flex gap-2">
              <a href="/admin/contactos" className="text-[11px] text-brand-orange hover:text-orange-700 transition-colors font-medium">Ver</a>
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={18} className="animate-spin text-gray-200" />
            </div>
          ) : recentConsultas.length === 0 ? (
            <div className="py-12 text-center text-gray-300 text-[13px]">Sin consultas aún</div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentConsultas.map((c: any) => (
                <li key={c.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: c._type === "contact" ? "#fff7f2" : "#fffbeb" }}
                    >
                      {c._type === "contact"
                        ? <MessageSquare size={12} style={{ color: "#df691a" }} />
                        : <Building2 size={12} style={{ color: "#f59e0b" }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[12px] font-semibold text-[#111] truncate">
                          {c._type === "contact" ? (c.nombre || "Sin nombre") : c.address}
                        </p>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                          c.status === "pending" ? "bg-yellow-50 text-yellow-500" :
                          c.status === "contacted" ? "bg-blue-50 text-blue-500" :
                          "bg-green-50 text-green-500"
                        }`}>
                          {c.status === "pending" ? "Pendiente" : c.status === "contacted" ? "Contactado" : "Listo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(c.telefono || c.phone) && (
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Phone size={9} />{c.telefono || c.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-gray-300">
                          <Clock size={9} />
                          {new Date(c.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}
