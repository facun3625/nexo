"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, LayoutDashboard } from "lucide-react";
import LoginModal from "./LoginModal";

export default function AccesoButton({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("login") === "1") setOpen(true);
  }, [searchParams]);

  const cls = "flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20 cursor-pointer";

  if (isLoggedIn) {
    return (
      <a href="/admin" className={cls}>
        <LayoutDashboard size={10} />
        Dashboard
      </a>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className={cls}>
        <Lock size={10} />
        Acceso
      </button>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
