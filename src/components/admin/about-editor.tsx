"use client";

import { Columns2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { uploadRichTextImage } from "@/app/admin/configuracion/actions";

async function handleUploadImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);
  const result = await uploadRichTextImage(formData);
  if (typeof result !== "string") throw new Error(result.error);
  return result;
}

export function AboutEditor({
  html,
  columns,
  onChangeHtml,
  onChangeColumns,
  onUploadImage = handleUploadImage,
}: {
  html: string;
  columns: boolean;
  onChangeHtml: (html: string) => void;
  onChangeColumns: (columns: boolean) => void;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  return (
    <RichTextEditor
      html={html}
      onChangeHtml={onChangeHtml}
      onUploadImage={onUploadImage}
      toolbarExtra={
        <>
          <span className="mx-0.5 h-4 w-px bg-border" />
          <button
            type="button"
            onClick={() => onChangeColumns(!columns)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              columns ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
            )}
          >
            <Columns2 className="size-3.5" />
            Dos columnas
          </button>
        </>
      }
    />
  );
}
