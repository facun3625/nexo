"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/admin/confirm-provider";
import { deleteConversation, setConversationHandled } from "./actions";

export function ConversationActions({ id, handled }: { id: string; handled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  function toggleHandled() {
    startTransition(async () => {
      await setConversationHandled(id, !handled);
      router.refresh();
    });
  }

  async function remove() {
    const ok = await confirm({
      title: "¿Eliminar esta conversación?",
      description: "Se borra la conversación y los datos de contacto que dejó. No se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await deleteConversation(id);
      toast.success("Conversación eliminada");
      router.push("/admin/conversaciones");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={toggleHandled}>
        {handled ? "Volver a pendiente" : "Marcar como atendida"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={remove}
        className="text-destructive hover:text-destructive"
      >
        Eliminar
      </Button>
    </div>
  );
}
