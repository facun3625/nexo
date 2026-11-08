"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdminTheme } from "@/components/admin/admin-theme-root";

export function ThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();
  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isDark ? "Cambiar a modo día" : "Cambiar a modo noche"}
      onClick={toggleTheme}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
