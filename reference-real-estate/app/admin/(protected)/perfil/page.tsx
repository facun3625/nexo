"use client";

import React, { useState } from "react";
import { User, Key, Save, Loader2, CheckCircle, XCircle } from "lucide-react";

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
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({
    type: null,
    message: "",
  });

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: null, message: "" }), 4000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showToast("error", "Las contraseñas nuevas no coinciden");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("success", "Contraseña actualizada correctamente");
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        showToast("error", data.error || "Error al actualizar contraseña");
      }
    } catch {
      showToast("error", "Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <Toast type={toast.type} message={toast.message} />

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <User size={24} className="text-brand-orange" />
          <h1 className="text-2xl font-semibold text-[#111]">Mi Perfil</h1>
        </div>
        <p className="text-gray-400 text-[13px]">Gestiona tu cuenta y seguridad</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <Key size={16} className="text-gray-400" />
          <h2 className="text-[14px] font-semibold text-[#111]">Cambiar Contraseña</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
              Contraseña Actual
            </label>
            <input
              type="password"
              required
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 px-4 text-[13px] outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 px-4 text-[13px] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 px-4 text-[13px] outline-none transition-all"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-brand-orange hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-2.5 rounded-lg font-semibold text-[13px] transition-all shadow-md active:scale-[0.98]"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? "Guardando..." : "Actualizar Contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
