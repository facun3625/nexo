"use client";

import { useState } from "react";
import { Bell, CheckCircle, Loader2, MapPin, Home, Key, User } from "lucide-react";

interface Props {
  operations: { id: string; name: string }[];
  cities: { id: string; name: string }[];
  propertyTypes: { id: string; name: string }[];
}

export default function AlertasClient({ operations, cities, propertyTypes }: Props) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    operacion: "",
    tipo: "",
    ciudad: "",
    dormitorios: "",
  });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setDone(true);
      } else {
        setError("Hubo un error al procesar tu solicitud. Por favor, intentá de nuevo.");
      }
    } catch {
      setError("Error de conexión. Verificá tu internet e intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-orange outline-none transition-all bg-white text-[14px]";

  if (done) {
    return (
      <section className="flex-1 py-20 px-8 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-[#111] mb-4">¡Suscripción exitosa!</h1>
        <p className="text-gray-500 text-[16px] leading-relaxed">
            Hemos registrado tus preferencias. En cuanto ingrese una propiedad que coincida con lo que buscás, te enviaremos un correo electrónico automáticamente.
        </p>
        <a href="/" className="mt-8 px-8 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-700 transition-colors">
            Volver al inicio
        </a>
      </section>
    );
  }

  return (
    <section className="flex-1 py-16 bg-[#f8f6f2]">
      <div className="max-w-4xl mx-auto px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-orange/10 rounded-full mb-4">
            <Bell size={24} className="text-brand-orange" />
          </div>
          <h1 className="text-3xl font-bold text-[#111] mb-3">Recibí Alertas de Propiedades</h1>
          <p className="text-gray-500 text-[15px] max-w-xl mx-auto">
            ¿Buscás algo específico y no lo encontrás? Dejanos tus preferencias y te avisamos automáticamente apenas ingrese una oportunidad.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-12 border border-gray-100 overflow-hidden relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Mis Datos */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-orange flex items-center gap-2">
                <User size={13} />
                Mis Datos
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Nombre y Apellido</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Ej: Juan Pérez"
                    className={inputClass}
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Correo electrónico</label>
                  <input 
                    required 
                    type="email" 
                    placeholder="ejemplo@correo.com"
                    className={inputClass}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Mis Preferencias */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-brand-orange flex items-center gap-2">
                <Home size={13} />
                ¿Qué estás buscando?
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Operación</label>
                    <select 
                      className={inputClass}
                      value={formData.operacion}
                      onChange={(e) => setFormData({...formData, operacion: e.target.value})}
                    >
                      <option value="">Cualquiera</option>
                      {operations.map(op => <option key={op.id} value={op.name}>{op.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Tipo de Propiedad</label>
                    <select 
                      className={inputClass}
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    >
                      <option value="">Cualquiera</option>
                      {propertyTypes.map(pt => <option key={pt.id} value={pt.name}>{pt.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Ubicación / Ciudad</label>
                  <select 
                    className={inputClass}
                    value={formData.ciudad}
                    onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                  >
                    <option value="">Cualquiera</option>
                    {cities.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Dormitorios (Opcional)</label>
                  <select 
                    className={inputClass}
                    value={formData.dormitorios}
                    onChange={(e) => setFormData({...formData, dormitorios: e.target.value})}
                  >
                    <option value="">Cualquiera</option>
                    <option value="1">1 dormitorio</option>
                    <option value="2">2 dormitorios</option>
                    <option value="3">3 dormitorios</option>
                    <option value="4">4+ dormitorios</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-12 flex flex-col items-center border-t border-gray-100 pt-10">
            {error && <p className="text-red-500 text-[13px] mb-4 font-medium">{error}</p>}
            <button 
              disabled={loading}
              className="px-12 py-4 bg-brand-orange text-white font-bold rounded-2xl shadow-lg shadow-brand-orange/30 hover:bg-orange-700 hover:shadow-orange-700/40 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Bell size={18} />}
              Activar mi alerta personalizada
            </button>
            <p className="mt-4 text-[11px] text-gray-400">
                Al activar la alerta, aceptás recibir notificaciones por email. Podés darte de baja en cualquier momento.
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
