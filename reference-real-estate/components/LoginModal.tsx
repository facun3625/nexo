"use client";

import { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setError("");
      const saved = localStorage.getItem("login_remember");
      if (saved) {
        const { username: u, password: p } = JSON.parse(saved);
        setUsername(u);
        setPassword(p);
        setRemember(true);
      } else {
        setUsername("");
        setPassword("");
        setRemember(false);
      }
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        if (remember) {
          localStorage.setItem("login_remember", JSON.stringify({ username, password }));
        } else {
          localStorage.removeItem("login_remember");
        }
        window.location.href = "/admin";
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#262522] px-8 py-7 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-orange/20 rounded-lg flex items-center justify-center">
              <Lock size={15} className="text-brand-orange" />
            </div>
            <div>
              <p className="text-white font-semibold text-[15px]">Acceso Administrativo</p>
              <p className="text-white/35 text-[11px]">Penalva Inmobiliaria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-7 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              autoFocus
              required
              className="w-full px-4 py-3 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-brand-orange"
            />
            <span className="text-[12px] text-gray-500">Recordar usuario y contraseña</span>
          </label>

          {error && (
            <p className="text-red-500 text-[12px] bg-red-50 px-4 py-2.5 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold text-[13px] uppercase tracking-wider py-3.5 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={14} />}
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
