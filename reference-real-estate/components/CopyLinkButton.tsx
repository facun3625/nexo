"use client";

import { useState } from "react";
import { Link, Check } from "lucide-react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-[12px] py-2.5 rounded-lg transition-colors"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Link size={14} />}
      {copied ? "¡Link copiado!" : "Copiar link"}
    </button>
  );
}
