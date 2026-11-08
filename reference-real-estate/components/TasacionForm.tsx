"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function TasacionForm() {
  const [form, setForm] = useState({
    address: "", propertyType: "", area: "", phone: "", email: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const f = "w-full px-4 py-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tasaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("Hubo un error al enviar. Intentá de nuevo.");
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center gap-4 min-h-[320px]">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
          <CheckCircle2 size={28} className="text-green-500" />
        </div>
        <h3 className="text-[17px] font-bold text-[#111]">¡Solicitud enviada!</h3>
        <p className="text-gray-500 text-[14px] max-w-xs leading-relaxed">
          Recibimos tu pedido de tasación. Te contactamos a la brevedad.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-5">
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Dirección de la propiedad *
        </label>
        <input required value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          type="text" placeholder="Calle y número, ciudad" className={f} />
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Tipo de propiedad *
        </label>
        <select required value={form.propertyType} onChange={(e) => setForm((p) => ({ ...p, propertyType: e.target.value }))}
          className={f + " appearance-none bg-white text-gray-600"}>
          <option value="">Seleccionar</option>
          <option>Casa</option>
          <option>Departamento</option>
          <option>Terreno</option>
          <option>Local comercial</option>
          <option>Otro</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Superficie aproximada (m²)
        </label>
        <input value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))}
          type="number" placeholder="Ej: 120" className={f} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Teléfono celular *
          </label>
          <input required value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
            type="tel" placeholder="+54 342..." className={f} />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Correo electrónico *
          </label>
          <input required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            type="email" placeholder="tu@email.com" className={f} />
        </div>
      </div>

      {error && <p className="text-red-400 text-[12px]">{error}</p>}

      <button type="submit" disabled={loading}
        className="w-full bg-brand-orange text-white font-bold text-[13px] uppercase tracking-wider py-4 rounded-lg hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2">
        {loading ? <Loader2 size={15} className="animate-spin" /> : null}
        {loading ? "Enviando..." : "Solicitar tasación gratuita"}
      </button>
    </form>
  );
}
