"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

export function FavoritesNavButton({
  iconOnly = false,
}: {
  iconOnly?: boolean;
}) {
  return (
    <Link
      href="/favoritos"
      aria-label="Favoritos"
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium text-current opacity-85 transition-opacity hover:opacity-100",
        iconOnly && "size-9 justify-center rounded-full border border-current/20 p-0",
      )}
    >
      <Heart className="size-4" />
      {!iconOnly && "Favoritos"}
    </Link>
  );
}
