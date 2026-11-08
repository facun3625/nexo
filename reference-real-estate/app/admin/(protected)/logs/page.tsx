"use client";

import React, { useState, useEffect } from "react";
import { History, Loader2, UserX, User, Building2, Settings, FileText, Key, LogIn, Plus, Trash2, Edit3 } from "lucide-react";

type AuditLog = {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
};

const ACTION_ICONS: Record<string, any> = {
  CREATE: Plus,
  UPDATE: Edit3,
  DELETE: Trash2,
  LOGIN: LogIn,
  PASSWORD_CHANGE: Key,
};

const ENTITY_ICONS: Record<string, any> = {
  Property: Building2,
  User: User,
  SiteConfig: Settings,
  ContentBlock: FileText,
};

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(true);
        else setLogs(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex p-8 justify-center items-center"><Loader2 className="animate-spin text-brand-orange" /></div>;

  if (error) return (
    <div className="p-8 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <UserX size={32} className="text-red-500" />
      </div>
      <h1 className="text-xl font-bold text-[#111]">Acceso No Autorizado</h1>
      <p className="text-gray-500 mt-2">Sólo un Súper Administrador puede ver los logs de actividad del sistema.</p>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <History size={24} className="text-brand-orange" />
          <h1 className="text-2xl font-semibold text-[#111]">Logs de Actividad</h1>
        </div>
        <p className="text-gray-400 text-[13px]">Registro de modificaciones realizadas por los administradores</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {logs.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-[14px]">No hay actividad registrada aún.</div>
          ) : (
            logs.map((log) => {
              const ActionIcon = ACTION_ICONS[log.action] || History;
              const EntityIcon = ENTITY_ICONS[log.entityType] || FileText;
              
              return (
                <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    log.action === "DELETE" ? "bg-red-100 text-red-500" :
                    log.action === "CREATE" ? "bg-emerald-100 text-emerald-500" :
                    log.action === "LOGIN" ? "bg-blue-100 text-blue-500" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    <ActionIcon size={18} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-[14px] font-semibold text-[#111]">
                        <span className="text-brand-orange">@{log.userName || "System"}</span>
                        {" hizo un "}
                        <span className="uppercase text-[11px] font-bold tracking-wider">{log.action === "PASSWORD_CHANGE" ? "Cambio de Contraseña" : log.action}</span>
                      </div>
                      <div className="text-[11px] text-gray-300 font-medium">
                        {new Date(log.createdAt).toLocaleString("es-AR")}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                        <EntityIcon size={12} className="text-gray-400" />
                        <span className="text-[12px] text-gray-500 italic">
                          En {log.entityType} {log.entityId && `(ID: ${log.entityId.substring(0, 8)}...)`}
                        </span>
                    </div>

                    {log.details && (
                      <div className="bg-gray-50 rounded-lg p-3 text-[11px] text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
