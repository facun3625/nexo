"use client";

import { useActionState } from "react";
import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  sendDevelopmentInquiry,
  type DevelopmentInquiryState,
} from "./actions";

type Field = {
  id: string;
  label: string;
  type: "TEXT" | "TEXTAREA" | "EMAIL" | "PHONE" | "NUMBER" | "DATE" | "SELECT";
  required: boolean;
  options: string[];
};

export function DevelopmentInquiryForm({
  developmentId,
  title,
  submitLabel,
  fields,
}: {
  developmentId: string;
  title: string;
  submitLabel: string;
  fields: Field[];
}) {
  const action = sendDevelopmentInquiry.bind(null, developmentId);
  const [state, formAction, pending] = useActionState(action, {
    ok: false,
    message: "",
  } as DevelopmentInquiryState);
  if (state.ok)
    return (
      <div className="flex items-start gap-4 rounded-2xl border bg-card p-6 shadow-sm">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CircleCheck className="size-6" />
        </span>
        <div>
          <h2 className="font-semibold">Consulta enviada</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recibimos tus datos. La inmobiliaria se pondrá en contacto con vos.
          </p>
        </div>
      </div>
    );
  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm lg:p-7"
    >
      <h2 className="text-xl font-semibold">{title}</h2>
      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-2">
          <Label htmlFor={field.id}>
            {field.label}
            {field.required && " *"}
          </Label>
          {field.type === "TEXTAREA" ? (
            <Textarea
              id={field.id}
              name={field.id}
              required={field.required}
              rows={4}
            />
          ) : field.type === "SELECT" ? (
            <Select
              name={field.id}
              required={field.required}
              items={field.options.map((value) => ({ value, label: value }))}
            >
              <SelectTrigger id={field.id} className="h-11 w-full rounded-xl">
                <SelectValue placeholder="Seleccionar…" />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={field.id}
              name={field.id}
              required={field.required}
              type={
                (
                  {
                    EMAIL: "email",
                    PHONE: "tel",
                    NUMBER: "number",
                    DATE: "date",
                  } as Record<string, string>
                )[field.type] ?? "text"
              }
            />
          )}
        </div>
      ))}
      {state.message && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando…" : submitLabel}
      </Button>
    </form>
  );
}
