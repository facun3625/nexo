"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Loader2, CheckCircle, XCircle, ShieldCheck, UserX, UserPlus, Shield, Edit2, Save, X } from "lucide-react";

type User = {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
};

type ToastType = "success" | "error" | null;

function Toast({ type, message }: { type: ToastType; message: string }) {
  if (!type) return null;
  const isSuccess = type === "success";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white text-[14px] font-medium transition-all duration-500 animate-in slide-in-from-bottom-4 fade-in ${
        isSuccess ? "bg-[#1a1a1a] border border-emerald-500/30" : "bg-[#1a1a1a] border border-red-500/30"
      }`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isSuccess ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
        {isSuccess ? <CheckCircle size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-red-400" />}
      </div>
      <div><p className={isSuccess ? "text-emerald-300" : "text-red-300"}>{message}</p></div>
    </div>
  );
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", name: "", role: "admin" });
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", password: "", active: true });
  const [savingEdit, setSavingEdit] = useState(false);

  const [toast, setToast] = useState<{ type: ToastType; message: string }>({ type: null, message: "" });

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(true);
        else setUsers(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: "success", message: "Usuario creado correctamente" });
        setShowAddForm(false);
        setNewUser({ username: "", password: "", name: "", role: "admin" });
        fetchUsers();
      } else {
        setToast({ type: "error", message: data.error || "Error al crear usuario" });
      }
    } catch {
      setToast({ type: "error", message: "Error de conexión" });
    } finally {
      setCreating(false);
    }
  };

  const handleEditInit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      role: user.role,
      active: user.active,
      password: "",
    });
    setShowAddForm(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser.id,
          ...editForm,
        }),
      });
      if (res.ok) {
        setToast({ type: "success", message: "Usuario actualizado" });
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Error al actualizar" });
      }
    } catch {
      setToast({ type: "error", message: "Error de conexión" });
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading) return <div className="flex p-8 justify-center items-center"><Loader2 className="animate-spin text-brand-orange" /></div>;

  if (error) return (
    <div className="p-8 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserX size={32} className="text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-[#111]">Acceso No Autorizado</h1>
      <p className="text-gray-500 mt-2">Sólo un Súper Administrador puede gestionar los usuarios del sistema.</p>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl">
      <Toast type={toast.type} message={toast.message} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck size={24} className="text-brand-orange" />
            <h1 className="text-2xl font-semibold text-[#111]">Usuarios</h1>
          </div>
          <p className="text-gray-400 text-[13px]">Gestiona los administradores del sistema</p>
        </div>
        {!editingUser && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-[#111] hover:bg-black text-white px-5 py-2.5 rounded-lg font-semibold text-[13px] transition-all shadow-md active:scale-[0.98]"
          >
            {showAddForm ? <X size={16} /> : <UserPlus size={16} />}
            {showAddForm ? "Cancelar" : "Nuevo Usuario"}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-[14px] font-semibold text-[#111] mb-5">Agregar Nuevo Administrador</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Nombre Completo</label>
              <input type="text" required value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 px-4 text-[13px] outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Usuario (Login)</label>
              <input type="text" required value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 px-4 text-[13px] outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Contraseña Temporal</label>
              <input type="password" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 px-4 text-[13px] outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-500 mb-1.5 uppercase tracking-wider">Rol de Usuario</label>
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="w-full bg-[#f8f8f9] border border-transparent focus:border-brand-orange/40 focus:bg-white rounded-lg py-2.5 px-4 text-[13px] outline-none transition-all appearance-none cursor-pointer">
                <option value="admin">Administrador Estándar</option>
                <option value="superadmin">Súper Administrador</option>
              </select>
            </div>
            <div className="md:col-span-2 pt-2">
              <button disabled={creating} className="bg-brand-orange hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-semibold text-[13px] transition-all flex items-center gap-2">
                {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                {creating ? "Creando..." : "Crear Usuario"}
              </button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="bg-[#111] rounded-xl border border-white/5 shadow-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[14px] font-semibold text-white">Editar Usuario: @{editingUser.username}</h2>
            <button onClick={() => setEditingUser(null)} className="text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Nombre Completo</label>
              <input type="text" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-white/5 border border-white/10 focus:border-brand-orange/40 focus:bg-white/10 rounded-lg py-2.5 px-4 text-[13px] text-white outline-none transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Rol de Usuario</label>
              <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="w-full bg-white/5 border border-white/10 focus:border-brand-orange/40 focus:bg-white/10 rounded-lg py-2.5 px-4 text-[13px] text-white outline-none transition-all appearance-none cursor-pointer">
                <option value="admin" className="text-black">Administrador Estándar</option>
                <option value="superadmin" className="text-black">Súper Administrador</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Nueva Contraseña <span className="text-white/20 normal-case">(dejar vacío para no cambiar)</span></label>
              <input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} className="w-full bg-white/5 border border-white/10 focus:border-brand-orange/40 focus:bg-white/10 rounded-lg py-2.5 px-4 text-[13px] text-white outline-none transition-all" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-white/40 mb-1.5 uppercase tracking-wider">Estado</label>
              <select value={editForm.active ? "true" : "false"} onChange={(e) => setEditForm({ ...editForm, active: e.target.value === "true" })} className="w-full bg-white/5 border border-white/10 focus:border-brand-orange/40 focus:bg-white/10 rounded-lg py-2.5 px-4 text-[13px] text-white outline-none transition-all appearance-none cursor-pointer">
                <option value="true" className="text-black">Activo</option>
                <option value="false" className="text-black">Inactivo (Sin Acceso)</option>
              </select>
            </div>
            <div className="md:col-span-2 pt-2">
              <button disabled={savingEdit} className="bg-brand-orange hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-semibold text-[13px] transition-all flex items-center gap-2">
                {savingEdit ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {savingEdit ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Usuario / Nombre</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Rol</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Estado</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400">Fecha de Alta</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-[14px] font-semibold text-[#111]">{u.name || "Sin nombre"}</div>
                  <div className="text-[12px] text-gray-400">{u.username}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    u.role === "superadmin" ? "bg-brand-orange/10 text-brand-orange" : "bg-gray-100 text-gray-500"
                  }`}>
                    {u.role === "superadmin" && <Shield size={10} />}
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center w-2 h-2 rounded-full mr-2 ${u.active ? "bg-emerald-500" : "bg-red-500"}`} />
                  <span className="text-[13px] text-gray-600">{u.active ? "Activo" : "Inactivo"}</span>
                </td>
                <td className="px-6 py-4 text-[13px] text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString("es-AR")}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleEditInit(u)}
                    className="p-2 text-gray-400 hover:text-brand-orange hover:bg-brand-orange/5 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
