"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, FileText } from "lucide-react";

interface Block {
  key: string;
  label: string;
  page: string;
  multiline: boolean;
  value: string;
}

interface Props {
  blocks: Block[];
  saveBlock: (key: string, value: string) => Promise<void>;
}

const PAGE_LABELS: Record<string, string> = {
  home: "Inicio",
  nosotros: "Nosotros",
  tasacion: "Tasación",
  consorcios: "Consorcios",
  obras: "Obras",
  footer: "Footer",
  email: "Email de alertas",
};

export default function ContenidoClient({ blocks, saveBlock }: Props) {
  const pages = [...new Set(blocks.map((b) => b.page))];
  const [activeTab, setActiveTab] = useState(pages[0]);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(blocks.map((b) => [b.key, b.value]))
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  const handleSave = (key: string) => {
    setPending((p) => ({ ...p, [key]: true }));
    startTransition(async () => {
      await saveBlock(key, values[key]);
      setPending((p) => ({ ...p, [key]: false }));
      setSaved((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000);
    });
  };

  const activeBlocks = blocks.filter((b) => b.page === activeTab);

  return (
    <div className="p-8 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <FileText size={20} className="text-brand-orange" />
        <div>
          <h1 className="text-xl font-bold text-[#111]">Contenido del sitio</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">
            Editá los textos e imágenes de cada página. Los cambios se reflejan de inmediato.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setActiveTab(page)}
            className={`px-5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
              activeTab === page
                ? "bg-white text-[#111] shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {PAGE_LABELS[page] ?? page}
          </button>
        ))}
      </div>

      {/* Blocks for active tab */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {activeBlocks.map((block) => (
          <div key={block.key} className="px-6 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                {block.label}
              </label>
              {block.multiline ? (
                <textarea
                  rows={3}
                  value={values[block.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [block.key]: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] text-[#111] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={values[block.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [block.key]: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] text-[#111] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange transition-colors"
                />
              )}
              {block.key.includes("_img") && (
                <div className="mt-3 flex items-start gap-4">
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 group/img">
                    {values[block.key] ? (
                      <img 
                        src={values[block.key]} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="cursor-pointer flex items-center gap-2 bg-white border border-gray-200 hover:border-brand-orange text-gray-600 hover:text-brand-orange px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all shadow-sm">
                      <Loader2 size={13} className={pending[`u_${block.key}`] ? "animate-spin" : "hidden"} />
                      <span>{pending[`u_${block.key}`] ? "Subiendo..." : "Subir desde PC"}</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        disabled={pending[`u_${block.key}`]}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setPending(p => ({ ...p, [`u_${block.key}`]: true }));
                          const formData = new FormData();
                          formData.append("file", file);

                          try {
                            const res = await fetch("/api/upload", {
                              method: "POST",
                              body: formData,
                            });
                            if (res.ok) {
                              const { url } = await res.json();
                              setValues(v => ({ ...v, [block.key]: url }));
                            }
                          } catch (err) {
                            console.error("Upload failed", err);
                          } finally {
                            setPending(p => ({ ...p, [`u_${block.key}`]: false }));
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-gray-400 max-w-[150px]">
                      Recomendado: JPG o PNG. Tamaño máx 2MB.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => handleSave(block.key)}
              disabled={pending[block.key]}
              className={`mt-6 shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                saved[block.key]
                  ? "bg-green-50 text-green-600 border border-green-200"
                  : "bg-brand-orange text-white hover:bg-orange-700"
              }`}
            >
              {pending[block.key] ? (
                <Loader2 size={13} className="animate-spin" />
              ) : saved[block.key] ? (
                <><Check size={13} /> Guardado</>
              ) : (
                "Guardar"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
