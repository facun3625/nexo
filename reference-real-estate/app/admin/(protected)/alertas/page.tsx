"use client";

import { useState, useEffect } from "react";
import { BellRing, Mail, MapPin, Home, Bed, Calendar, Send, Loader2, CheckCircle, XCircle, Clock, History, Wifi, RotateCcw } from "lucide-react";

interface EmailLog {
  id: string;
  to: string;
  nombre: string;
  subject: string;
  alertId: string;
  createdAt: string;
}

interface Alert {
  id: string;
  nombre: string;
  email: string;
  ciudad?: string | null;
  tipo?: string | null;
  operacion?: string | null;
  dormitorios?: number | null;
  pending: boolean;
  lastMatchPropertyId?: string | null;
  createdAt: string;
}

type ToastType = "success" | "error" | null;

function Toast({ type, message }: { type: ToastType; message: string }) {
  if (!type) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-[14px] font-medium animate-in slide-in-from-bottom-4 ${type === "success" ? "bg-[#1a1a1a] border border-emerald-500/30" : "bg-[#1a1a1a] border border-red-500/30"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${type === "success" ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
        {type === "success" ? <CheckCircle size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-red-400" />}
      </div>
      <p className={type === "success" ? "text-emerald-300" : "text-red-300"}>{message}</p>
    </div>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const filtros = [alert.operacion, alert.tipo, alert.ciudad, alert.dormitorios ? `${alert.dormitorios} dorm.` : null].filter(Boolean);

  return (
    <div className={`px-6 py-4 flex items-center gap-4 ${alert.pending ? "bg-orange-50/50" : ""}`}>
      <div className="w-9 h-9 rounded-full bg-brand-orange/10 flex items-center justify-center shrink-0">
        <span className="text-brand-orange font-bold text-[13px]">{alert.nombre.charAt(0).toUpperCase()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-[#111]">{alert.nombre}</p>
          {alert.pending && (
            <span className="flex items-center gap-1 bg-brand-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Clock size={9} />
              PENDIENTE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-0.5">
          <Mail size={11} />
          <span>{alert.email}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {filtros.length === 0 ? (
          <span className="text-gray-300 text-[11px]">Sin filtros específicos</span>
        ) : filtros.map((f, i) => (
          <span key={i} className="bg-gray-100 text-gray-600 text-[11px] px-2.5 py-1 rounded-full">{f}</span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-gray-300 shrink-0">
        <Calendar size={11} />
        {new Date(alert.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
      </div>
    </div>
  );
}

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"suscriptores" | "historial">("suscriptores");
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({ type: null, message: "" });

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: null, message: "" }), 4000);
  };

  const fetchAll = () => {
    Promise.all([
      fetch("/api/alerts").then((r) => r.json()),
      fetch("/api/alerts/logs").then((r) => r.json()),
    ])
      .then(([alertsData, logsData]) => {
        setAlerts(alertsData);
        setLogs(logsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/alerts/send", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast("success", `${data.sent} email${data.sent !== 1 ? "s" : ""} enviado${data.sent !== 1 ? "s" : ""}${data.skipped > 0 ? `, ${data.skipped} sin coincidencias` : ""}`);
        fetchAll();
        window.dispatchEvent(new Event("admin-data-changed"));
      } else {
        showToast("error", data.error || "Error al enviar");
      }
    } catch {
      showToast("error", "Error de conexión");
    } finally {
      setSending(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/alerts/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: "" }),
      });
      const data = await res.json();
      if (res.ok) showToast("success", data.message);
      else showToast("error", `SMTP error: ${data.error}`);
    } catch {
      showToast("error", "Error de conexión");
    } finally {
      setTesting(false);
    }
  };

  const handleResend = async (logId: string) => {
    setResendingId(logId);
    try {
      const res = await fetch(`/api/alerts/logs/${logId}/resend`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast("success", "Email reenviado correctamente");
        fetchAll();
      } else {
        showToast("error", data.error || "Error al reenviar");
      }
    } catch {
      showToast("error", "Error de conexión");
    } finally {
      setResendingId(null);
    }
  };

  const pending = alerts.filter((a) => a.pending);
  const rest = alerts.filter((a) => !a.pending);

  return (
    <div className="p-8 max-w-5xl">
      <Toast type={toast.type} message={toast.message} />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111]">Alertas de propiedades</h1>
          <p className="text-gray-400 text-[13px] mt-1">
            Usuarios esperando novedades según sus búsquedas
          </p>
        </div>
        <button
          onClick={handleTestSmtp}
          disabled={testing}
          className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-lg transition-all"
        >
          {testing ? <Loader2 size={13} className="animate-spin" /> : <Wifi size={13} />}
          Probar SMTP
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        <button
          onClick={() => setTab("suscriptores")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${tab === "suscriptores" ? "bg-white shadow-sm text-[#111]" : "text-gray-400 hover:text-gray-600"}`}
        >
          <BellRing size={14} />
          Suscriptores
          {alerts.filter(a => a.pending).length > 0 && (
            <span className="bg-brand-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{alerts.filter(a => a.pending).length}</span>
          )}
        </button>
        <button
          onClick={() => setTab("historial")}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold transition-all ${tab === "historial" ? "bg-white shadow-sm text-[#111]" : "text-gray-400 hover:text-gray-600"}`}
        >
          <History size={14} />
          Historial de envíos
          {logs.length > 0 && (
            <span className="bg-gray-300 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{logs.length}</span>
          )}
        </button>
      </div>

      {/* Stats */}
      {tab === "suscriptores" && <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Total suscriptores</p>
          <p className="text-3xl font-bold text-[#111]">{alerts.length}</p>
        </div>
        <div className={`rounded-xl border shadow-sm p-5 ${pending.length > 0 ? "bg-orange-50 border-brand-orange/20" : "bg-white border-gray-100"}`}>
          <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Pendientes de notificar</p>
          <p className={`text-3xl font-bold ${pending.length > 0 ? "text-brand-orange" : "text-[#111]"}`}>{pending.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-[12px] text-gray-400 uppercase tracking-wider mb-1">Ya notificados</p>
          <p className="text-3xl font-bold text-[#111]">{rest.length}</p>
        </div>
      </div>}

      {/* TAB: Suscriptores */}
      {tab === "suscriptores" && <>

      {/* Pendientes + botón enviar */}
      {pending.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-orange/20 shadow-sm overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-orange-100 bg-orange-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold text-[#111]">
                {pending.length} suscriptor{pending.length !== 1 ? "es" : ""} con nuevas coincidencias
              </h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Hay propiedades publicadas que matchean sus búsquedas</p>
            </div>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 bg-brand-orange hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-all shadow-lg shadow-orange-400/20"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {sending ? "Enviando..." : `Enviar ${pending.length} email${pending.length !== 1 ? "s" : ""}`}
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {pending.map((a) => <AlertRow key={a.id} alert={a} />)}
          </div>
        </div>
      )}

      {/* Todos los suscriptores */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#111]">Todos los suscriptores</h2>
          <span className="text-[12px] text-gray-400">{alerts.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-brand-orange" size={22} />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BellRing size={36} className="text-gray-200 mb-3" />
            <p className="text-gray-400 text-[14px]">Ningún suscriptor todavía</p>
            <p className="text-gray-300 text-[12px] mt-1">Aparecen cuando alguien completa el formulario en la búsqueda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {alerts.map((a) => <AlertRow key={a.id} alert={a} />)}
          </div>
        )}
      </div>

      </>}

      {/* TAB: Historial */}
      {tab === "historial" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#111]">Emails enviados</h2>
            <span className="text-[12px] text-gray-400">{logs.length} total</span>
          </div>

          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <History size={36} className="text-gray-200 mb-3" />
              <p className="text-gray-400 text-[14px]">Ningún email enviado todavía</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {logs.map((log) => (
                <div key={log.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle size={15} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#111]">{log.nombre}</p>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-400 mt-0.5">
                      <Mail size={11} />
                      <span>{log.to}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-400 truncate max-w-xs hidden md:block">{log.subject}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-300 shrink-0">
                    <Calendar size={11} />
                    {new Date(log.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}
                    {" · "}
                    {new Date(log.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                  <button
                    onClick={() => handleResend(log.id)}
                    disabled={resendingId === log.id}
                    className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-brand-orange border border-gray-200 hover:border-brand-orange/30 px-3 py-1.5 rounded-lg transition-all shrink-0"
                    title="Reenviar"
                  >
                    {resendingId === log.id ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                    Reenviar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
