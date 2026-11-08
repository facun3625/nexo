"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";

export function ToggleRow({
  title,
  description,
  enabled,
  disabled,
  onToggle,
}: {
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: (checked: boolean) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <Switch
        checked={enabled}
        disabled={disabled || pending}
        onCheckedChange={(checked) =>
          startTransition(async () => {
            try {
              await onToggle(checked);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Error");
            }
          })
        }
      />
    </div>
  );
}
