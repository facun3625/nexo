"use client";
import { useEffect, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { toggleFavorite } from "@/app/propiedades/actions";
import { isLocalFavorite, toggleLocalFavorite } from "@/lib/local-favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  propertyId,
  initialFavorited,
  className,
}: {
  propertyId: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const { status } = useSession();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  // El servidor no puede saber qué guardó un visitante anónimo (vive en su
  // localStorage) — se corrige acá apenas monta en el navegador.
  useEffect(() => {
    if (status !== "authenticated") setFavorited(isLocalFavorite(propertyId));
  }, [status, propertyId]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      setFavorited(toggleLocalFavorite(propertyId));
      return;
    }
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const result = await toggleFavorite(propertyId);
      if ("error" in result) {
        setFavorited(!next);
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? "Sacar de favoritos" : "Guardar en favoritos"}
      aria-pressed={favorited}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-[background-color,color,box-shadow] duration-200 hover:bg-white hover:shadow-md disabled:opacity-50",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-4 text-foreground transition-colors",
          favorited && "fill-primary text-primary",
        )}
      />
    </button>
  );
}
