import Link from "next/link";
import { Pencil } from "lucide-react";
import { auth } from "@/auth";

// Botón "Editar" que solo ve el admin del sitio, igual al de la ficha de
// propiedad.
export async function ArqEditButton({ tenantId, href, label }: { tenantId: string; href: string; label: string }) {
  const session = await auth();
  if (session?.user.role !== "ADMIN" || session.user.tenantId !== tenantId) return null;
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
    >
      <Pencil className="size-4" />
      {label}
    </Link>
  );
}
