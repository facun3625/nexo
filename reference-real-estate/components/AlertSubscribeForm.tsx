"use client";

import { useState } from "react";
import { Bell, Loader2, CheckCircle } from "lucide-react";

interface Props {
  ciudad?: string;
  tipo?: string;
  operacion?: string;
  dormitorios?: string;
}

export default function AlertSubscribeForm({ ciudad, tipo, operacion, dormitorios }: Props) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, ciudad, tipo, operacion, dormitorios }),
      });

      if (res.ok) {
        setDone(true);
      } else {
        setError("Hubo un error. Intentá de nuevo.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const filtros = [operacion, tipo, ciudad, dormitorios ? `${dormitorios} dorm.` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mt-12 bg-[#262522] rounded-2xl px-8 py-10 text-center">

      {done ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-12 h-12 bg-brand-orange/15 rounded-full flex items-center justify-center">
            <CheckCircle size={24} className="text-brand-orange" />
          </div>
          <p className="text-white font-semibold text-[17px]">¡Listo! Te avisamos cuando haya novedades.</p>
          <p className="text-white/40 text-[13px]">Revisá tu bandeja de entrada cuando publiquemos propiedades con estas características.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 bg-brand-orange/15 rounded-full flex items-center justify-center">
              <Bell size={18} className="text-brand-orange" />
            </div>
          </div>

          <h3 className="text-white font-bold text-[20px] mb-2">¿No encontraste lo que buscabas?</h3>
          <p className="text-white/50 text-[14px] mb-1">
            Recibí un aviso cuando ingrese una propiedad con estas características.
          </p>
          {filtros && (
            <p className="text-brand-orange text-[12px] font-medium mb-6">{filtros}</p>
          )}

          <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-3">
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full bg-white/8 border border-white/10 text-white placeholder-white/30 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-brand-orange/60 transition-colors"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu e-mail"
              required
              className="w-full bg-white/8 border border-white/10 text-white placeholder-white/30 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-brand-orange/60 transition-colors"
            />

            {error && <p className="text-red-400 text-[12px]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-orange-700 disabled:bg-white/10 disabled:text-white/30 text-white font-semibold text-[13px] uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />}
              {loading ? "Enviando..." : "Avisarme"}
            </button>
          </form>

          <p className="text-white/20 text-[11px] mt-4">
            Solo te contactamos cuando haya propiedades que coincidan. Sin spam.
          </p>
        </>
      )}
    </div>
  );
}
