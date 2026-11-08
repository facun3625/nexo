"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useConfirm } from "@/components/admin/confirm-provider";
import { Button } from "@/components/ui/button";
import { deleteDevelopment } from "./actions";

export function DevelopmentRowActions({
  id,
  name,
  showEdit = true,
}: {
  id: string;
  name: string;
  showEdit?: boolean;
}) {
  const confirm = useConfirm();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  async function remove() {
    const accepted = await confirm({
      title: "Eliminar obra",
      description: `¿Querés eliminar “${name}”? Las consultas recibidas conservarán el nombre y el historial.`,
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!accepted) return;
    startTransition(async () => {
      const result = await deleteDevelopment(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Obra eliminada");
      router.push("/admin/gestion/emprendimientos");
      router.refresh();
    });
  }
  return (
    <div className="flex shrink-0 gap-2">
      {showEdit && (
        <Button
          render={<Link href={`/admin/gestion/emprendimientos/${id}`} />}
          size="sm"
          variant="outline"
        >
          <Pencil className="size-3.5" />
          Editar
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={remove}
      >
        <Trash2 className="size-3.5" />
        Eliminar
      </Button>
    </div>
  );
}
