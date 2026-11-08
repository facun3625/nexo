"use client";

import { useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { AlignCenter, AlignLeft, AlignRight, Bold as BoldIcon, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const COLORS = [
  { label: "Predeterminado", value: null },
  { label: "Negro", value: "#18181b" },
  { label: "Naranja", value: "#208ab1" },
  { label: "Rojo", value: "#dc2626" },
  { label: "Azul", value: "#2563eb" },
  { label: "Verde", value: "#16a34a" },
];

type SizeKey = "p" | "h3" | "h2";
const SIZE_LABELS: Record<SizeKey, string> = {
  p: "Normal",
  h3: "Subtítulo",
  h2: "Título",
};

// Editor WYSIWYG (Tiptap) genérico: negrita, tamaño, color, alineación e
// imágenes — lo que ves es lo que se guarda, sin sintaxis de por medio.
// Usado tanto en "Sobre nosotros" como en el pop-up de bienvenida.
export function RichTextEditor({
  html,
  onChangeHtml,
  onUploadImage,
  placeholder,
  minHeight = "min-h-32",
  toolbarExtra,
}: {
  html: string;
  onChangeHtml: (html: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
  placeholder?: string;
  minHeight?: string;
  toolbarExtra?: React.ReactNode;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["paragraph", "heading"] }),
      Image.configure({ HTMLAttributes: { class: "rounded-xl" } }),
    ],
    content: html || "<p></p>",
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChangeHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          minHeight,
          "rounded-b-lg border border-t-0 px-3 py-2 text-sm outline-none prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-2 [&_img]:max-w-full [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5",
        ),
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
  });

  const currentSize: SizeKey = editor?.isActive("heading", { level: 2 })
    ? "h2"
    : editor?.isActive("heading", { level: 3 })
      ? "h3"
      : "p";

  function setSize(size: SizeKey) {
    if (!editor) return;
    if (size === "p") editor.chain().focus().setParagraph().run();
    else editor.chain().focus().toggleHeading({ level: size === "h2" ? 2 : 3 }).run();
  }

  async function handleFile(file: File | null) {
    if (!file || !onUploadImage || !editor) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border bg-muted/40 p-1.5">
        <Select value={currentSize} onValueChange={(v) => v && setSize(v as SizeKey)}>
          <SelectTrigger size="sm" className="h-8 w-28 text-xs">
            <SelectValue>{SIZE_LABELS[currentSize]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SIZE_LABELS) as SizeKey[]).map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {SIZE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="mx-0.5 h-4 w-px bg-border" />

        <Button
          type="button"
          variant={editor?.isActive("bold") ? "default" : "outline"}
          size="icon-xs"
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          aria-label="Negrita"
        >
          <BoldIcon className="size-3.5" />
        </Button>

        <span className="mx-0.5 h-4 w-px bg-border" />

        {(["left", "center", "right"] as const).map((align) => {
          const Icon = align === "left" ? AlignLeft : align === "center" ? AlignCenter : AlignRight;
          return (
            <Button
              key={align}
              type="button"
              variant={editor?.isActive({ textAlign: align }) ? "default" : "outline"}
              size="icon-xs"
              disabled={!editor}
              onClick={() => editor?.chain().focus().setTextAlign(align).run()}
              aria-label={`Alinear ${align === "left" ? "izquierda" : align === "center" ? "centro" : "derecha"}`}
            >
              <Icon className="size-3.5" />
            </Button>
          );
        })}

        <span className="mx-0.5 h-4 w-px bg-border" />

        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c.label}
              type="button"
              title={c.label}
              onClick={() =>
                c.value
                  ? editor?.chain().focus().setColor(c.value).run()
                  : editor?.chain().focus().unsetColor().run()
              }
              className={cn(
                "size-5 shrink-0 rounded-full border transition-transform hover:scale-110",
                c.value ? "border-border/50" : "border-border bg-background bg-[repeating-linear-gradient(45deg,var(--border)_0,var(--border)_1px,transparent_1px,transparent_4px)]",
              )}
              style={c.value ? { backgroundColor: c.value } : undefined}
            />
          ))}
        </div>

        {onUploadImage && (
          <>
            <span className="mx-0.5 h-4 w-px bg-border" />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Insertar imagen"
            >
              <ImageIcon className="size-3.5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </>
        )}

        {toolbarExtra}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
