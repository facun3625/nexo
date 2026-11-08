import DOMPurify from "isomorphic-dompurify";

import { cn } from "@/lib/utils";

// El texto se carga desde un editor WYSIWYG en el admin (Tiptap) y se guarda
// como HTML — accá solo lo sanitizamos antes de mostrarlo.
export function RichText({
  html,
  columns,
  className,
}: {
  html: string;
  columns?: boolean;
  className?: string;
}) {
  // style solo trae color/alineación puestos desde el editor Tiptap del
  // admin (Color + TextAlign) — DOMPurify igual filtra cualquier valor
  // peligroso (ej: url(), expression()) dentro de ese atributo.
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "strong", "em", "b", "i", "br", "ul", "ol", "li", "h2", "h3", "blockquote", "span", "img"],
    ALLOWED_ATTR: ["style", "src", "alt"],
  });

  return (
    <div
      className={cn(
        "prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-xl [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        columns && "sm:columns-2 sm:gap-8",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
