"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/admin/confirm-provider";
import type { Role } from "@/generated/prisma/client";
import { deleteUser, setUserRole } from "./actions";

export function UserRoleToggle({
  id,
  role,
  disabled,
}: {
  id: string;
  role: Role;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(checked: boolean) {
    const nextRole: Role = checked ? "ADMIN" : "CUSTOMER";
    startTransition(async () => {
      try {
        const actionResult = await setUserRole(id, nextRole);
        if ("error" in actionResult) {
          toast.error(actionResult.error);
          return;
        }
        toast.success(nextRole === "ADMIN" ? "Ahora es admin" : "Ahora es cliente");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo cambiar el rol");
      }
    });
  }

  return <Switch checked={role === "ADMIN"} disabled={disabled || pending} onCheckedChange={toggle} />;
}

export function UserDeleteButton({
  id,
  label,
  disabled,
  onDeleted,
}: {
  id: string;
  label: string;
  disabled?: boolean;
  onDeleted?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();
  const router = useRouter();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={disabled || pending}
      className="text-destructive hover:text-destructive"
      onClick={async () => {
        const ok = await confirm({
          title: "Borrar usuario",
          description: `¿Borrar a ${label}? Esta acción no se puede deshacer.`,
          confirmLabel: "Borrar",
          destructive: true,
        });
        if (!ok) return;
        startTransition(async () => {
          try {
            const actionResult = await deleteUser(id);
            if ("error" in actionResult) {
              toast.error(actionResult.error);
              return;
            }
            toast.success("Usuario borrado");
            if (onDeleted) onDeleted();
            else router.refresh();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "No se pudo borrar");
          }
        });
      }}
    >
      Borrar
    </Button>
  );
}
