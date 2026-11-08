"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Plus, Trash2, Pencil, Check, X, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Instruction {
  id: string;
  text: string;
  createdAt: string;
}

type ToastType = "success" | "error" | null;

function Toast({ type, message }: { type: ToastType; message: string }) {
  if (!type) return null;
  const isSuccess = type === "success";
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-[14px] font-medium animate-in slide-in-from-bottom-4 fade-in ${isSuccess ? "bg-[#1a1a1a] border border-emerald-500/30" : "bg-[#1a1a1a] border border-red-500/30"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
        {isSuccess ? <CheckCircle size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-red-400" />}
      </div>
      <p className={isSuccess ? "text-emerald-300" : "text-red-300"}>{message}</p>
    </div>
  );
}

export default function AsistentePage() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({ type: null, message: "" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: null, message: "" }), 3500);
  };

  useEffect(() => {
    fetch("/api/ai-instructions")
      .then((r) => r.json())
      .then((data) => { setInstructions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/ai-instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText }),
      });
      if (res.ok) {
        const created = await res.json();
        setInstructions((prev) => [...prev, created]);
        setNewText("");
        showToast("success", "Instrucción agregada");
      }
    } catch {
      showToast("error", "Error al agregar");
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item: Instruction) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSave = async (id: string) => {
    if (!editText.trim()) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/ai-instructions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInstructions((prev) => prev.map((i) => (i.id === id ? updated : i)));
        setEditingId(null);
        showToast("success", "Instrucción actualizada");
      }
    } catch {
      showToast("error", "Error al guardar");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ai-instructions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setInstructions((prev) => prev.filter((i) => i.id !== id));
        showToast("success", "Instrucción eliminada");
      }
    } catch {
      showToast("error", "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <Toast type={toast.type} message={toast.message} />

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#111]">Asistente IA</h1>
          <p className="text-gray-400 text-[13px] mt-1">
            Instrucciones adicionales que Lena seguirá en cada conversación
          </p>
        </div>
        <Bot size={28} className="text-gray-200" />
      </div>

      {/* Agregar nueva */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-[14px] font-semibold text-[#111]">Nueva instrucción</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">
            Ejemplos: "Siempre mencionar la financiación propia", "No ofrecer propiedades bajo USD 50.000"
          </p>
        </div>
        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd(); }}
            rows={3}
            placeholder="Escribí la instrucción aquí..."
            className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-3 px-4 text-[13px] outline-none transition-all resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-gray-300">Ctrl+Enter para agregar rápido</p>
            <button
              onClick={handleAdd}
              disabled={adding || !newText.trim()}
              className="flex items-center gap-2 bg-brand-orange hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-all"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#111]">Instrucciones activas</h2>
          <span className="text-[12px] text-gray-400">{instructions.length} instrucción{instructions.length !== 1 ? "es" : ""}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-brand-orange" size={22} />
          </div>
        ) : instructions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bot size={36} className="text-gray-200 mb-3" />
            <p className="text-gray-400 text-[14px]">Ninguna instrucción todavía</p>
            <p className="text-gray-300 text-[12px] mt-1">Lena usará solo su comportamiento base</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {instructions.map((item, i) => (
              <li key={item.id} className="px-6 py-4">
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      autoFocus
                      className="w-full bg-[#f8f8f9] border border-brand-orange/30 rounded-lg py-2.5 px-3 text-[13px] outline-none resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(item.id)}
                        disabled={!!savingId || !editText.trim()}
                        className="flex items-center gap-1.5 bg-brand-orange hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 text-white px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                      >
                        {savingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Guardar
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all border border-gray-200 hover:border-gray-300"
                      >
                        <X size={12} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 group">
                    <span className="text-[11px] font-bold text-gray-200 mt-0.5 w-5 shrink-0 text-right">{i + 1}</span>
                    <p className="flex-1 text-[13px] text-[#333] leading-relaxed">{item.text}</p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Eliminar"
                      >
                        {deletingId === item.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
