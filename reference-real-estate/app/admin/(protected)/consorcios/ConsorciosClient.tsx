"use client";

import { useState } from "react";
import { 
  Building2, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Loader2, 
  GripVertical,
  ArrowUpDown
} from "lucide-react";

interface Consorcio {
  id: string;
  nombre: string;
  banco: string | null;
  titular: string | null;
  cuit: string | null;
  cbu: string | null;
  ca: string | null;
  order: number;
  active: boolean;
}

interface Props {
  initialData: Consorcio[];
}

export default function ConsorciosClient({ initialData }: Props) {
  const [data, setData] = useState<Consorcio[]>(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Consorcio | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [form, setForm] = useState<Partial<Consorcio>>({
    nombre: "",
    banco: "",
    titular: "",
    cuit: "",
    cbu: "",
    ca: "",
    active: true,
  });

  const openModal = (item?: Consorcio) => {
    if (item) {
      setEditingItem(item);
      setForm(item);
    } else {
      setEditingItem(null);
      setForm({
        nombre: "",
        banco: "",
        titular: "",
        cuit: "",
        cbu: "",
        ca: "",
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const method = editingItem ? "PATCH" : "POST";
    const url = editingItem ? `/api/consorcios/${editingItem.id}` : "/api/consorcios";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingItem) {
          setData(data.map(d => d.id === saved.id ? saved : d));
        } else {
          setData([...data, saved]);
        }
        closeModal();
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return;
    
    try {
      const res = await fetch(`/api/consorcios/${id}`, { method: "DELETE" });
      if (res.ok) {
        setData(data.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const toggleActive = async (item: Consorcio) => {
    try {
      const res = await fetch(`/api/consorcios/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      if (res.ok) {
        const updated = await res.json();
        setData(data.map(d => d.id === item.id ? updated : d));
      }
    } catch (error) {
      console.error("Toggle error:", error);
    }
  };

  const inputStyle = "w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange bg-white transition-colors";
  const labelStyle = "block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#111]">Administración de Consorcios</h1>
          <p className="text-gray-400 text-[13px] mt-1">
            Gestioná los edificios administrados y sus cuentas bancarias para expensas.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-brand-orange hover:bg-orange-700 text-white font-bold text-[13px] px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-orange/20"
        >
          <Plus size={16} /> Nuevo edificio
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-[13px]">
        {data.length === 0 ? (
          <div className="py-20 text-center text-gray-300">
            <Building2 size={32} className="mx-auto mb-4 opacity-20" />
            <p>No hay edificios cargados todavía.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Edificio</th>
                <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px]">Banco / Cuenta</th>
                <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px]">CUIT</th>
                <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px] text-center">Estado</th>
                <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-[10px] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#111]">{item.nombre}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="font-medium text-[#111]">{item.banco || "—"}</div>
                    <div className="text-[11px]">{item.titular || item.ca || "—"}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {item.cuit || "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                        item.active 
                          ? "bg-green-50 text-green-600 border border-green-100" 
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-green-500" : "bg-gray-400"}`} />
                      {item.active ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-gray-400 hover:text-brand-orange transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => remove(item.id, item.nombre)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#111]">
                {editingItem ? "Editar edificio" : "Nuevo edificio"}
              </h2>
              <button 
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={save} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className={labelStyle}>Nombre / Dirección</label>
                  <input
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Edificio Senda - 1 de Mayo 2242"
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Banco</label>
                  <input
                    value={form.banco || ""}
                    onChange={(e) => setForm({ ...form, banco: e.target.value })}
                    placeholder="Macro, Santa Fe, etc."
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>CUIT</label>
                  <input
                    value={form.cuit || ""}
                    onChange={(e) => setForm({ ...form, cuit: e.target.value })}
                    placeholder="30-XXXXXXXX-X"
                    className={inputStyle}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelStyle}>Titular / Nombre de Cuenta</label>
                  <input
                    value={form.titular || ""}
                    onChange={(e) => setForm({ ...form, titular: e.target.value })}
                    placeholder="CONSORCIO EDIF. XX"
                    className={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelStyle}>Nº Cuenta / CA</label>
                  <input
                    value={form.ca || ""}
                    onChange={(e) => setForm({ ...form, ca: e.target.value })}
                    placeholder="X-XXX-XXXXXXXXX-X"
                    className={inputStyle}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelStyle}>CBU</label>
                  <input
                    value={form.cbu || ""}
                    onChange={(e) => setForm({ ...form, cbu: e.target.value })}
                    placeholder="22 dígitos"
                    className={inputStyle}
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-brand-orange hover:bg-orange-700 text-white font-bold text-[13px] px-8 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-orange/20 disabled:bg-gray-200"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {editingItem ? "Guardar cambios" : "Crear edificio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
