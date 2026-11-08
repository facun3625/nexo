"use client";

import { useState, useEffect } from "react";
import { Youtube, X } from "lucide-react";

function toEmbedUrl(input: string): string {
  if (!input) return "";
  // Already embed
  if (input.includes("youtube.com/embed/") || input.includes("player.vimeo.com")) return input;
  // youtu.be/ID
  const short = input.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  // youtube.com/watch?v=ID
  const watch = input.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  // youtube.com/shorts/ID
  const shorts = input.match(/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
  // Vimeo
  const vimeo = input.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return input;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export default function VideoInput({ value, onChange }: Props) {
  const [raw, setRaw] = useState(value || "");
  const embedUrl = toEmbedUrl(raw);
  const isValid = embedUrl.includes("youtube.com/embed") || embedUrl.includes("vimeo.com/video");

  useEffect(() => {
    onChange(toEmbedUrl(raw));
  }, [raw]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Youtube size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Pegá el link de YouTube o Vimeo..."
          className="w-full pl-8 pr-8 py-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-brand-orange bg-white"
        />
        {raw && (
          <button type="button" onClick={() => { setRaw(""); onChange(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
            <X size={13} />
          </button>
        )}
      </div>

      {raw && !isValid && (
        <p className="text-[11px] text-red-400">URL no reconocida. Pegá un link de YouTube o Vimeo.</p>
      )}

      {isValid && (
        <div className="rounded-lg overflow-hidden border border-gray-200 aspect-video">
          <iframe src={embedUrl} className="w-full h-full" allowFullScreen />
        </div>
      )}
    </div>
  );
}
