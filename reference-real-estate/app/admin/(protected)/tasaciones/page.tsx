"use client";

import { useEffect, useState } from "react";
import { Loader2, Trash2, Phone, Mail, MapPin, ChevronDown } from "lucide-react";

interface TasacionRequest {
  id: string;
  address: string;
  propertyType: string;
  area?: number | null;
  phone: string;
  email: string;
  status: "pending" | "contacted" | "done";
  notes?: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  contacted: "Contactado",
  done: "Finalizado",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-600 border-yellow-200",
  contacted: "bg-blue-50 text-blue-600 border-blue-200",
  done: "bg-green-50 text-green-600 border-green-200",
};

export default function TasacionesPage() {
  const [requests, setRequests] = useState<TasacionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/tasaciones")
      .then((r) => r.json())
      .then((data) => {
        setRequests(data);
        const n: Record<string, string> = {};
        data.forEach((r: TasacionRequest) => { if (r.notes) n[r.id] = r.notes; });
        setNotes(n);
        setLoading(false);
      });
  }, []);

  const notify = () => window.dispatchEvent(new Event("admin-data-changed"));

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/tasaciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes: notes[id] ?? null }),
    });
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: status as any } : r));
    notify();
  };

  const saveNotes = async (id: string) => {
    const req = requests.find((r) => r.id === id);
    await fetch(`/api/tasaciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: req?.status, notes: notes[id] ?? null }),
    });
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("¿Eliminar esta solicitud?")) return;
    await fetch(`/api/tasaciones/${id}`, { method: "DELETE" });
    setRequests((prev) => prev.filter((r) => r.id !== id));
    notify();
  };

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    contacted: requests.filter((r) => r.status === "contacted").length,
    done: requests.filter((r) => r.status === "done").length,
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-gray-400">
        <Loader2 size={16} className="animate-spin" /> Cargando...
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#111]">Tasaciones</h1>
        <p className="text-gray-400 text-[13px] mt-0.5">Solicitudes recibidas desde el sitio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { key: "pending", label: "Pendientes", color: "text-yellow-500" },
          { key: "contacted", label: "Contactados", color: "text-blue-500" },
          { key: "done", label: "Finalizados", color: "text-green-500" },
        ].map(({ key, label, color }) => (
          <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4">
            <p className={`text-2xl font-bold ${color}`}>{counts[key as keyof typeof counts]}</p>
            <p className="text-[12px] text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-16 text-center text-gray-300 text-[13px]">
          No hay solicitudes aún
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {requests.map((r) => (
            <div key={r.id}>
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                {/* Date */}
                <div className="shrink-0 text-center w-10">
                  <p className="text-[18px] font-bold text-[#111] leading-none">
                    {new Date(r.createdAt).getDate()}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase">
                    {new Date(r.createdAt).toLocaleString("es-AR", { month: "short" })}
                  </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-[#111] truncate">{r.address}</p>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-medium shrink-0">
                      {r.propertyType}
                    </span>
                    {r.area && (
                      <span className="text-[11px] text-gray-400 shrink-0">{r.area} m²</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-[12px] text-gray-400">
                      <Phone size={11} /> {r.phone}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-gray-400">
                      <Mail size={11} /> {r.email}
                    </span>
                  </div>
                </div>

                {/* Status selector */}
                <div className="shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={r.status}
                    onChange={(e) => updateStatus(r.id, e.target.value)}
                    className={`appearance-none text-[11px] font-semibold px-3 py-1.5 pr-7 rounded-full border cursor-pointer focus:outline-none ${STATUS_STYLE[r.status]}`}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="contacted">Contactado</option>
                    <option value="done">Finalizado</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteRequest(r.id); }}
                  className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} className="text-gray-300 hover:text-red-400" />
                </button>

                <ChevronDown
                  size={14}
                  className={`shrink-0 text-gray-300 transition-transform ${expanded === r.id ? "rotate-180" : ""}`}
                />
              </div>

              {/* Expanded notes */}
              {expanded === r.id && (
                <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-300 block mb-2 mt-3">
                    Notas internas
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={notes[r.id] ?? ""}
                      onChange={(e) => setNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                      placeholder="Agregá notas sobre este contacto..."
                      rows={2}
                      className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors resize-none bg-white"
                    />
                    <button
                      onClick={() => saveNotes(r.id)}
                      className="px-4 py-2 bg-brand-orange text-white text-[12px] font-semibold rounded-lg hover:bg-orange-700 transition-colors shrink-0 self-end"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
