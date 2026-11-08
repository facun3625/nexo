"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Eye,
  Calendar,
  Clock,
  Building2,
  MapPin,
  BarChart3,
  Activity,
  Users,
  RefreshCw,
  Loader2,
  UserCheck,
} from "lucide-react";

interface ChartDay { date: string; count: number; unique: number; }
interface TopProperty { id: string; title: string; city: string; type: string; price: number; views: number; uniqueVisitors: number; }
interface PageBreakdown { label: string; count: number; }
interface RecentView { path: string; createdAt: string; propertyId: string | null; sessionId: string | null; }
interface Stats {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
  uniqueTotal: number;
  uniqueToday: number;
  uniqueWeek: number;
  uniqueMonth: number;
  chartData: ChartDay[];
  topProperties: TopProperty[];
  pageBreakdown: PageBreakdown[];
  recentActivity: RecentView[];
}

function MiniBar({ value, max, color = "bg-brand-orange" }: { value: number; max: number; color?: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function BarChart({ data }: { data: ChartDay[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-[3px] h-32">
        {data.map((d, i) => {
          const h = max === 0 ? 0 : Math.max(2, Math.round((d.count / max) * 128));
          const isLast7 = i >= data.length - 7;
          const isHovered = hovered === i;
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center justify-end group relative cursor-default"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white text-[11px] px-3 py-2 rounded-lg whitespace-nowrap z-10 shadow-xl pointer-events-none">
                  <p className="font-semibold text-white">{d.count} visitas</p>
                  <p className="text-emerald-400">{d.unique} únicos</p>
                  <p className="text-white/30 text-[10px] mt-0.5">
                    {new Date(d.date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                </div>
              )}
              <div
                className={`w-full rounded-sm transition-all duration-300 ${
                  isLast7
                    ? isHovered ? "bg-orange-600" : "bg-brand-orange"
                    : isHovered ? "bg-orange-300" : "bg-orange-200"
                }`}
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-gray-300 pt-1">
        {[0, 7, 14, 21, 29].map((i) => (
          <span key={i}>
            {data[i] ? new Date(data[i].date + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  if (mins > 0) return `hace ${mins}m`;
  return "ahora";
}

function pathLabel(path: string): string {
  if (path === "/") return "🏠 Inicio";
  if (path === "/propiedades") return "🏢 Propiedades";
  if (path.startsWith("/propiedad/")) return "📍 Detalle de propiedad";
  if (path === "/tasacion") return "📊 Tasación";
  if (path === "/nosotros") return "👥 Nosotros";
  if (path === "/mapa") return "🗺️ Mapa";
  return `📄 ${path}`;
}

type Period = "total" | "today" | "week" | "month";

export default function EstadisticasPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("week");

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const res = await fetch("/api/stats");
    const data = await res.json();
    setStats(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="animate-spin text-brand-orange" size={24} />
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-gray-400">Error al cargar estadísticas.</div>;

  const maxBreakdown = Math.max(...stats.pageBreakdown.map((p) => p.count), 1);

  const periodData = {
    total: { views: stats.totalViews, unique: stats.uniqueTotal },
    today: { views: stats.todayViews, unique: stats.uniqueToday },
    week: { views: stats.weekViews, unique: stats.uniqueWeek },
    month: { views: stats.monthViews, unique: stats.uniqueMonth },
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111]">Estadísticas</h1>
          <p className="text-gray-400 text-[13px] mt-1">Tráfico del sitio en tiempo real</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 text-[13px] text-gray-400 hover:text-[#111] transition-colors"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {(["today", "week", "month", "total"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              period === p
                ? "bg-brand-orange text-white shadow-sm"
                : "bg-white text-gray-400 hover:text-[#111] border border-gray-100"
            }`}
          >
            {p === "today" ? "Hoy" : p === "week" ? "7 días" : p === "month" ? "Este mes" : "Total"}
          </button>
        ))}
      </div>

      {/* KPI Cards — 2 main + 2 breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Visitas de página</p>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
              <Eye size={15} className="text-brand-orange" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#111]">{periodData[period].views.toLocaleString("es-AR")}</p>
          <p className="text-[12px] text-gray-400 mt-1">páginas vistas en el período</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Visitantes únicos</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <UserCheck size={15} className="text-emerald-500" />
            </div>
          </div>
          <p className="text-4xl font-bold text-[#111]">{periodData[period].unique.toLocaleString("es-AR")}</p>
          <p className="text-[12px] text-gray-400 mt-1">
            sesiones distintas — promedio{" "}
            <span className="font-semibold text-[#111]">
              {periodData[period].unique === 0
                ? "—"
                : (periodData[period].views / periodData[period].unique).toFixed(1)}
            </span>{" "}
            páginas/visita
          </p>
        </div>

        {/* Mini KPIs */}
        {[
          { label: "Hoy", views: stats.todayViews, unique: stats.uniqueToday, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Este mes", views: stats.monthViews, unique: stats.uniqueMonth, icon: Calendar, color: "text-violet-500", bg: "bg-violet-50" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon size={13} className={kpi.color} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#111]">{kpi.views.toLocaleString("es-AR")}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                <span className="text-emerald-500 font-semibold">{kpi.unique}</span> únicos
              </p>
            </div>
          );
        })}
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-[14px] text-[#111]">Visitas — Últimos 30 días</h2>
            <BarChart3 size={16} className="text-gray-300" />
          </div>
          <p className="text-[11px] text-gray-400 mb-5">Hover sobre una barra para ver el detalle del día</p>
          {stats.chartData.length > 0 ? (
            <BarChart data={stats.chartData} />
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-300 text-[13px]">Sin datos aún</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-[14px] text-[#111]">Por sección</h2>
            <Activity size={16} className="text-gray-300" />
          </div>
          {stats.pageBreakdown.length === 0 ? (
            <p className="text-gray-300 text-[13px]">Sin datos aún</p>
          ) : (
            <ul className="space-y-4">
              {stats.pageBreakdown.map((pb) => (
                <li key={pb.label}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-gray-600">{pb.label}</span>
                    <span className="font-semibold text-[#111]">{pb.count}</span>
                  </div>
                  <MiniBar value={pb.count} max={maxBreakdown} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Top properties + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[14px] text-[#111]">Propiedades más vistas</h2>
            <Building2 size={15} className="text-gray-300" />
          </div>
          {stats.topProperties.length === 0 ? (
            <div className="py-12 text-center text-gray-300 text-[13px]">Sin datos aún</div>
          ) : (
            <ul>
              {stats.topProperties.map((p, i) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-4 px-6 py-3.5 ${i < stats.topProperties.length - 1 ? "border-b border-gray-50" : ""} hover:bg-gray-50/50 transition-colors`}
                >
                  <span className="text-[13px] font-bold text-gray-200 w-5 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#111] truncate">{p.title}</p>
                    <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                      <MapPin size={9} />
                      <span>{p.city}</span>
                      <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${p.type === "Venta" ? "bg-blue-50 text-blue-500" : "bg-emerald-50 text-emerald-500"}`}>{p.type}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold text-brand-orange">{p.views} <span className="text-gray-300 font-normal text-[11px]">vistas</span></p>
                    <p className="text-[11px] text-emerald-500">{p.uniqueVisitors} únicos</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-[14px] text-[#111]">Actividad reciente</h2>
            <Users size={15} className="text-gray-300" />
          </div>
          {stats.recentActivity.length === 0 ? (
            <div className="py-12 text-center text-gray-300 text-[13px]">Sin actividad reciente</div>
          ) : (
            <ul className="divide-y divide-gray-50 overflow-y-auto max-h-80">
              {stats.recentActivity.map((v, i) => (
                <li key={i} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.sessionId ? "bg-emerald-400" : "bg-gray-300"}`} />
                    <span className="text-[13px] text-gray-600">{pathLabel(v.path)}</span>
                  </div>
                  <span className="text-[11px] text-gray-400 shrink-0">{timeAgo(v.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
