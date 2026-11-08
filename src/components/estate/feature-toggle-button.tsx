"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { toggleEstatePropertyFeatured } from "@/app/admin/gestion/actions";
import { cn } from "@/lib/utils";

export function FeatureToggleButton({ id, featured }: { id: string; featured: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={featured}
      aria-label={featured ? "Quitar de destacadas" : "Enviar a destacadas"}
      title={featured ? "Quitar de destacadas" : "Enviar a destacadas"}
      onClick={() =>
        start(async () => {
          const result = await toggleEstatePropertyFeatured(id);
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          router.refresh();
        })
      }
      className={cn(
        "rounded-lg border p-2 transition-colors disabled:opacity-50",
        featured
          ? "border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Star className={cn("size-4", featured && "fill-current")} />
    </button>
  );
}
