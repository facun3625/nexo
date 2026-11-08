"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  Settings,
  Facebook,
  Instagram,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Image,
} from "lucide-react";

type ToastType = "success" | "error" | null;

function Toast({ type, message }: { type: ToastType; message: string }) {
  if (!type) return null;
  const isSuccess = type === "success";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-[14px] font-medium transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in ${
        isSuccess
          ? "bg-[#1a1a1a] border border-emerald-500/30"
          : "bg-[#1a1a1a] border border-red-500/30"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isSuccess ? "bg-emerald-500/15" : "bg-red-500/15"
        }`}
      >
        {isSuccess ? (
          <CheckCircle size={18} className="text-emerald-400" />
        ) : (
          <XCircle size={18} className="text-red-400" />
        )}
      </div>
      <div>
        <p className={isSuccess ? "text-emerald-300" : "text-red-300"}>{message}</p>
        <p className="text-white/30 text-[11px] font-normal mt-0.5">
          {isSuccess ? "Los cambios ya están activos en el sitio." : "Revisá los datos e intentá de nuevo."}
        </p>
      </div>
    </div>
  );
}

export default function ConfigPage() {
  const [config, setConfig] = useState({
    facebook: "",
    instagram: "",
    whatsapp: "",
    phone: "",
    email: "",
    address: "",
    metaDescription: "",
    ogImage: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({
    type: null,
    message: "",
  });

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: null, message: "" }), 4000);
  };

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        showToast("success", "¡Configuración guardada!");
      } else {
        showToast("error", "Error al guardar la configuración");
      }
    } catch {
      showToast("error", "Error de conexión con el servidor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="animate-spin text-brand-orange" size={24} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Toast type={toast.type} message={toast.message} />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111]">Configuración</h1>
          <p className="text-gray-400 text-[13px] mt-1">
            Gestiona la información de contacto y redes sociales del sitio
          </p>
        </div>
        <Settings size={28} className="text-gray-200" />
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Redes Sociales */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[14px] font-semibold text-[#111]">Redes Sociales</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Facebook (link completo)
                </label>
                <div className="relative">
                  <Facebook size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={config.facebook || ""}
                    onChange={(e) => setConfig({ ...config, facebook: e.target.value })}
                    className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all"
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Instagram (link completo)
                </label>
                <div className="relative">
                  <Instagram size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={config.instagram || ""}
                    onChange={(e) => setConfig({ ...config, instagram: e.target.value })}
                    className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[14px] font-semibold text-[#111]">Contacto</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  WhatsApp <span className="text-gray-300 normal-case tracking-normal">(código de país + número, sin espacios)</span>
                </label>
                <div className="relative">
                  <MessageCircle size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={config.whatsapp || ""}
                    onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
                    className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all"
                    placeholder="543424565000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Teléfono Fijo
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={config.phone || ""}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all"
                    placeholder="+54 342 456-5000"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Email de Contacto
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={config.email || ""}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all"
                    placeholder="administracion@penalvainmobiliaria.com.ar"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Dirección Física
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={config.address || ""}
                    onChange={(e) => setConfig({ ...config, address: e.target.value })}
                    className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all"
                    placeholder="Eva Perón 2845 — Santa Fe, Argentina"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-[14px] font-semibold text-[#111]">SEO</h2>
            <p className="text-[12px] text-gray-400 mt-0.5">Se usa en el inicio, nosotros y otras páginas generales</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                Meta description del sitio
              </label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  value={config.metaDescription || ""}
                  onChange={(e) => setConfig({ ...config, metaDescription: e.target.value })}
                  rows={3}
                  maxLength={160}
                  className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all resize-none"
                  placeholder="Más de 20 años de trayectoria en compra, venta y alquiler de propiedades en Santa Fe..."
                />
              </div>
              <p className="text-[11px] text-gray-300 mt-1">{(config.metaDescription || "").length}/160 caracteres — lo ideal es entre 120 y 160</p>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                Imagen por defecto (og:image)
              </label>
              <div className="relative">
                <Image size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={config.ogImage || ""}
                  onChange={(e) => setConfig({ ...config, ogImage: e.target.value })}
                  className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 pl-9 pr-4 text-[13px] outline-none transition-all"
                  placeholder="https://tudominio.com/og-image.jpg"
                />
              </div>
              <p className="text-[11px] text-gray-300 mt-1">Aparece cuando alguien comparte el sitio en redes. Tamaño recomendado: 1200×630px</p>
              {config.ogImage && (
                <img src={config.ogImage} alt="og preview" className="mt-3 rounded-lg border border-gray-100 h-28 object-cover" />
              )}
            </div>
          </div>
        </div>

        {/* Guardar */}
        <div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2.5 bg-brand-orange hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-8 py-3 rounded-xl font-semibold text-[14px] transition-all shadow-lg shadow-orange-400/20 active:scale-[0.98]"
          >
            {saving ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
