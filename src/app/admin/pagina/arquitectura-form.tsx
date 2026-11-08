"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Plus, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/admin/confirm-provider";
import type { ArqContent } from "@/lib/arquitectura";
import { resetArqContent, saveArqContent, uploadArqImage } from "./actions";

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function useUpload() {
  const [pending, setPending] = useState(false);
  async function upload(file: File | null | undefined): Promise<string | null> {
    if (!file) return null;
    setPending(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const result = await uploadArqImage(fd);
      if ("error" in result) {
        toast.error(result.error);
        return null;
      }
      return result.url;
    } catch {
      toast.error("No se pudo subir la imagen");
      return null;
    } finally {
      setPending(false);
    }
  }
  return { upload, pending };
}

// Foto única con vista previa y botón para reemplazarla.
function ImagePicker({
  label,
  hint,
  value,
  onChange,
  contain = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  contain?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, pending } = useUpload();
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative aspect-[16/9] w-56 overflow-hidden rounded-xl bg-muted">
          {value && (
            <Image src={value} alt={label} fill sizes="224px" className={contain ? "object-contain" : "object-cover"} />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => inputRef.current?.click()}>
            <Upload className="size-3.5" />
            {pending ? "Subiendo…" : value ? "Cambiar foto" : "Subir foto"}
          </Button>
          {hint && <p className="max-w-56 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const url = await upload(e.target.files?.[0]);
          e.target.value = "";
          if (url) onChange(url);
        }}
      />
    </div>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  rows,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {rows ? (
        <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ItemToolbar({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-1">
      <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir">
        <ArrowUp className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Bajar">
        <ArrowDown className="size-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Quitar">
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          Ver página <ExternalLink className="size-3" />
        </a>
      </div>
      {children}
    </section>
  );
}

export function ArquitecturaForm({ content }: { content: ArqContent }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [data, setData] = useState<ArqContent>(content);
  const [saving, startSaving] = useTransition();
  const galleryInput = useRef<HTMLInputElement>(null);
  const gallery = useUpload();

  const eq = data.equipo;
  const sv = data.servicios;
  const setEquipo = (patch: Partial<ArqContent["equipo"]>) => setData((d) => ({ ...d, equipo: { ...d.equipo, ...patch } }));
  const setServicios = (patch: Partial<ArqContent["servicios"]>) => setData((d) => ({ ...d, servicios: { ...d.servicios, ...patch } }));
  const setObras = (patch: Partial<ArqContent["obras"]>) => setData((d) => ({ ...d, obras: { ...d.obras, ...patch } }));

  function save() {
    startSaving(async () => {
      // Las líneas vacías de la lista se limpian recién al guardar, para no
      // pelear con el cursor mientras se escribe.
      const clean = { ...data, equipo: { ...data.equipo, traits: data.equipo.traits.map((t) => t.trim()).filter(Boolean) } };
      const result = await saveArqContent(JSON.stringify(clean));
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Guardado");
      router.refresh();
    });
  }

  async function reset() {
    const ok = await confirm({
      title: "Restablecer contenido",
      description: "Vuelve a los textos y fotos originales (los del sitio anterior). Se pierden los cambios guardados.",
      confirmLabel: "Restablecer",
      destructive: true,
    });
    if (!ok) return;
    startSaving(async () => {
      const result = await resetArqContent();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Contenido restablecido");
      window.location.reload();
    });
  }

  return (
    <div className="flex flex-col gap-6 pt-4">
      <Section title="Equipo" href="/arquitectura/equipo">
        <ImagePicker label="Foto de portada (arriba de todo)" value={eq.heroImage} onChange={(heroImage) => setEquipo({ heroImage })} />
        <Field label="Bajada de la portada" value={eq.subtitle} onChange={(subtitle) => setEquipo({ subtitle })} />
        <Field label="Título" value={eq.introTitle} onChange={(introTitle) => setEquipo({ introTitle })} />
        <Field
          label="Texto de presentación"
          hint="Dejá una línea en blanco para separar párrafos."
          rows={5}
          value={eq.introText}
          onChange={(introText) => setEquipo({ introText })}
        />
        <Field label="Título de la lista" value={eq.traitsTitle} onChange={(traitsTitle) => setEquipo({ traitsTitle })} />
        <Field
          label="Lista (un ítem por línea)"
          rows={6}
          value={eq.traits.join("\n")}
          onChange={(v) => setEquipo({ traits: v.split("\n") })}
        />
        <ImagePicker label="Foto al lado del texto" value={eq.coverImage} onChange={(coverImage) => setEquipo({ coverImage })} />

        <div className="flex flex-col gap-3">
          <Label>Tarjetas</Label>
          {eq.pillars.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={p.title}
                  placeholder="Título"
                  onChange={(e) => setEquipo({ pillars: eq.pillars.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                />
                <ItemToolbar
                  index={i}
                  count={eq.pillars.length}
                  onMove={(dir) => setEquipo({ pillars: move(eq.pillars, i, i + dir) })}
                  onRemove={() => setEquipo({ pillars: eq.pillars.filter((_, j) => j !== i) })}
                />
              </div>
              <Textarea
                rows={3}
                value={p.text}
                placeholder="Texto"
                onChange={(e) => setEquipo({ pillars: eq.pillars.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })}
              />
            </div>
          ))}
          {eq.pillars.length < 6 && (
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setEquipo({ pillars: [...eq.pillars, { title: "", text: "" }] })}>
              <Plus className="size-3.5" /> Agregar tarjeta
            </Button>
          )}
        </div>

        <Field label="Título de la galería" value={eq.galleryTitle} onChange={(galleryTitle) => setEquipo({ galleryTitle })} />
        <div className="flex flex-col gap-3">
          <Label>Fotos de la galería</Label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {eq.gallery.map((url, i) => (
              <div key={`${url}-${i}`} className="flex flex-col gap-1.5">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                  <Image src={url} alt={`Foto ${i + 1}`} fill sizes="200px" className="object-cover" />
                </div>
                <ItemToolbar
                  index={i}
                  count={eq.gallery.length}
                  onMove={(dir) => setEquipo({ gallery: move(eq.gallery, i, i + dir) })}
                  onRemove={() => setEquipo({ gallery: eq.gallery.filter((_, j) => j !== i) })}
                />
              </div>
            ))}
            <button
              type="button"
              disabled={gallery.pending}
              onClick={() => galleryInput.current?.click()}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground hover:bg-muted/40 disabled:opacity-60"
            >
              <ImagePlus className="size-5" />
              {gallery.pending ? "Subiendo…" : "Agregar fotos"}
            </button>
          </div>
          <input
            ref={galleryInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              for (const file of files) {
                const url = await gallery.upload(file);
                if (url) setData((d) => ({ ...d, equipo: { ...d.equipo, gallery: [...d.equipo.gallery, url] } }));
              }
            }}
          />
        </div>
      </Section>

      <Section title="Servicios" href="/arquitectura/servicios">
        <ImagePicker label="Foto de portada" value={sv.heroImage} onChange={(heroImage) => setServicios({ heroImage })} />
        <Field label="Bajada de la portada" value={sv.subtitle} onChange={(subtitle) => setServicios({ subtitle })} />
        <div className="flex flex-col gap-3">
          <Label>Servicios</Label>
          <p className="-mt-1 text-xs text-muted-foreground">
            Dejá una línea en blanco entre párrafos. Las líneas que empiezan con “- ” se muestran como lista con tildes.
          </p>
          {sv.services.map((s, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-xs font-semibold text-primary">{String(i + 1).padStart(2, "0")}</span>
                <Input
                  value={s.title}
                  placeholder="Nombre del servicio"
                  onChange={(e) => setServicios({ services: sv.services.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })}
                />
                <ItemToolbar
                  index={i}
                  count={sv.services.length}
                  onMove={(dir) => setServicios({ services: move(sv.services, i, i + dir) })}
                  onRemove={() => setServicios({ services: sv.services.filter((_, j) => j !== i) })}
                />
              </div>
              <Textarea
                rows={6}
                value={s.body}
                placeholder="Descripción"
                onChange={(e) => setServicios({ services: sv.services.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })}
              />
            </div>
          ))}
          {sv.services.length < 12 && (
            <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setServicios({ services: [...sv.services, { title: "", body: "" }] })}>
              <Plus className="size-3.5" /> Agregar servicio
            </Button>
          )}
        </div>
        <ImagePicker
          label="Imagen final (collage de obras)"
          hint="Se muestra entera, sin recortar."
          contain
          value={sv.collageImage}
          onChange={(collageImage) => setServicios({ collageImage })}
        />
      </Section>

      <Section title="Obras (portada)" href="/arquitectura/obras">
        <p className="-mt-2 text-sm text-muted-foreground">
          Las obras en sí se cargan en Gestión → Obras.
        </p>
        <ImagePicker label="Foto de portada" value={data.obras.heroImage} onChange={(heroImage) => setObras({ heroImage })} />
        <Field label="Bajada de la portada" value={data.obras.subtitle} onChange={(subtitle) => setObras({ subtitle })} />
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-1 py-3 backdrop-blur">
        <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={reset}>
          Restablecer contenido original
        </Button>
        <Button type="button" disabled={saving || gallery.pending} onClick={save}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
