"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ImagePlus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AboutEditor } from "@/components/admin/about-editor";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveDevelopment, uploadDevelopmentTextImage } from "./actions";

type FieldType =
  | "TEXT"
  | "TEXTAREA"
  | "EMAIL"
  | "PHONE"
  | "NUMBER"
  | "DATE"
  | "SELECT";
type Field = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string;
};
type Picture = { key: string; id?: string; url: string; file?: File };
type Development = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: string | null;
  longitude: string | null;
  developer: string;
  stage: string;
  progress: number | null;
  estimatedDelivery: string | null;
  description: string;
  descriptionColumns: boolean;
  amenities: string[];
  financing: string;
  videoUrl: string | null;
  formTitle: string;
  submitLabel: string;
  published: boolean;
  categoryId: string | null;
  fields: {
    label: string;
    type: FieldType;
    required: boolean;
    options: string[];
  }[];
  images: { id: string; url: string }[];
};

const PropertyLocationPicker = dynamic(
  () =>
    import("@/components/estate/property-location-picker").then(
      (module) => module.PropertyLocationPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
        Cargando mapa…
      </div>
    ),
  },
);

const TYPES: [FieldType, string][] = [
  ["TEXT", "Texto corto"],
  ["TEXTAREA", "Texto largo"],
  ["EMAIL", "Email"],
  ["PHONE", "Teléfono"],
  ["NUMBER", "Número"],
  ["DATE", "Fecha"],
  ["SELECT", "Lista de opciones"],
];
const STAGES = [
  ["PROJECT", "Proyecto"],
  ["PRE_SALE", "Preventa"],
  ["UNDER_CONSTRUCTION", "En obra"],
  ["READY", "Entrega inmediata"],
  ["DELIVERED", "Entregado"],
] as const;
const newKey = () => crypto.randomUUID();
function move<T>(items: T[], index: number, delta: number) {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

async function optimizeImage(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo procesar la imagen");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value
          ? resolve(value)
          : reject(new Error("No se pudo comprimir la imagen")),
      "image/webp",
      0.82,
    ),
  );
  return new File(
    [blob],
    `${file.name.replace(/\.[^.]+$/, "") || "imagen"}.webp`,
    { type: "image/webp" },
  );
}

const NO_CATEGORY = "none";

export function DevelopmentEditor({
  development,
  categories,
}: {
  development?: Development;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [published, setPublished] = useState(development?.published ?? true);
  const [description, setDescription] = useState(
    development?.description ?? "",
  );
  const [descriptionColumns, setDescriptionColumns] = useState(
    development?.descriptionColumns ?? false,
  );
  const [stage, setStage] = useState(development?.stage ?? "PROJECT");
  const [categoryId, setCategoryId] = useState(
    development?.categoryId ?? NO_CATEGORY,
  );
  const [optimizing, setOptimizing] = useState(false);
  const [fields, setFields] = useState<Field[]>(
    development?.fields.map((field) => ({
      ...field,
      key: newKey(),
      options: field.options.join(", "),
    })) ?? [
      {
        key: newKey(),
        label: "Nombre y apellido",
        type: "TEXT",
        required: true,
        options: "",
      },
      {
        key: newKey(),
        label: "Teléfono",
        type: "PHONE",
        required: true,
        options: "",
      },
      {
        key: newKey(),
        label: "Email",
        type: "EMAIL",
        required: false,
        options: "",
      },
      {
        key: newKey(),
        label: "Mensaje",
        type: "TEXTAREA",
        required: false,
        options: "",
      },
    ],
  );
  const [pictures, setPictures] = useState<Picture[]>(
    development?.images.map((image) => ({ ...image, key: newKey() })) ?? [],
  );

  async function addPictures(files: FileList | null) {
    if (!files?.length) return;
    setOptimizing(true);
    try {
      const selected = Array.from(files)
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, 20 - pictures.length);
      const optimized = await Promise.all(selected.map(optimizeImage));
      setPictures((current) => [
        ...current,
        ...optimized.map((file) => ({
          key: newKey(),
          file,
          url: URL.createObjectURL(file),
        })),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudieron procesar las imágenes",
      );
    } finally {
      setOptimizing(false);
    }
  }

  async function uploadTextImage(file: File) {
    const data = new FormData();
    data.set("file", file);
    const result = await uploadDevelopmentTextImage(data);
    if (typeof result !== "string") throw new Error(result.error);
    return result;
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const data = new FormData(formRef.current!);
    data.set("published", String(published));
    data.set("stage", stage);
    data.set("categoryId", categoryId === NO_CATEGORY ? "" : categoryId);
    data.set("description", description);
    data.set("descriptionColumns", String(descriptionColumns));
    data.set(
      "fields",
      JSON.stringify(
        fields.map(({ label, type, required, options }) => ({
          label,
          type,
          required,
          options: options
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
        })),
      ),
    );
    data.set(
      "existingImages",
      JSON.stringify(
        pictures.flatMap((picture, order) =>
          picture.id ? [{ id: picture.id, order }] : [],
        ),
      ),
    );
    data.set(
      "newImages",
      JSON.stringify(
        pictures.flatMap((picture, order) =>
          picture.file ? [{ key: picture.key, order }] : [],
        ),
      ),
    );
    pictures.forEach((picture) => {
      if (picture.file) data.set(`image_${picture.key}`, picture.file);
    });
    startTransition(async () => {
      const result = await saveDevelopment(development?.id ?? null, data);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Obra guardada");
      router.push("/admin/gestion/emprendimientos");
      router.refresh();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className="flex max-w-5xl flex-col gap-6"
    >
      <section className="grid gap-4 rounded-xl border p-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre de la obra</Label>
          <Input
            id="name"
            name="name"
            defaultValue={development?.name}
            required
          />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div>
            <p className="text-sm font-medium">Publicado</p>
            <p className="text-xs text-muted-foreground">
              Lo hace visible en el sitio y habilita la sección pública
            </p>
          </div>
          <Switch checked={published} onCheckedChange={setPublished} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Ubicación / dirección</Label>
          <Input
            id="address"
            name="address"
            defaultValue={development?.address}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            name="city"
            defaultValue={development?.city}
            required
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label>Ubicación en el mapa</Label>
          <PropertyLocationPicker
            initialLat={development?.latitude ?? undefined}
            initialLng={development?.longitude ?? undefined}
            onDirty={() => {}}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="developer">Desarrollista</Label>
          <Input
            id="developer"
            name="developer"
            defaultValue={development?.developer}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Categoría</Label>
          <Select
            value={categoryId}
            onValueChange={(value) => value && setCategoryId(value)}
            items={[
              { value: NO_CATEGORY, label: "Sin categoría" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>Sin categoría</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!categories.length && (
            <p className="text-xs text-muted-foreground">
              Creá categorías desde el listado de Obras.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label>Etapa</Label>
          <Select
            value={stage}
            onValueChange={(value) => value && setStage(value)}
            items={STAGES.map(([value, label]) => ({ value, label }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="progress">Avance de obra (%)</Label>
          <Input
            id="progress"
            name="progress"
            type="number"
            min="0"
            max="100"
            defaultValue={development?.progress ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="estimatedDelivery">Entrega estimada</Label>
          <Input
            id="estimatedDelivery"
            name="estimatedDelivery"
            defaultValue={development?.estimatedDelivery ?? ""}
            placeholder="Ejemplo: diciembre de 2027"
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label>Descripción</Label>
          <AboutEditor
            html={description}
            columns={descriptionColumns}
            onChangeHtml={setDescription}
            onChangeColumns={setDescriptionColumns}
            onUploadImage={uploadTextImage}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="amenities">Amenities</Label>
          <Input
            id="amenities"
            name="amenities"
            defaultValue={development?.amenities.join(", ")}
            placeholder="Pileta, SUM, gimnasio, seguridad"
          />
          <p className="text-xs text-muted-foreground">Separalos con comas.</p>
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="financing">Opciones de financiación</Label>
          <Textarea
            id="financing"
            name="financing"
            rows={4}
            defaultValue={development?.financing}
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="videoUrl">Video opcional</Label>
          <Input
            id="videoUrl"
            name="videoUrl"
            type="url"
            defaultValue={development?.videoUrl ?? ""}
            placeholder="YouTube, Vimeo, Google Drive o Dropbox"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border p-5">
        <div>
          <h2 className="font-semibold">Imágenes</h2>
          <p className="text-xs text-muted-foreground">
            La primera imagen es la portada. Podés cambiarla reordenando la
            galería.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {pictures.map((picture, index) => (
            <div
              key={picture.key}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
            >
              <Image
                src={picture.url}
                alt=""
                fill
                className="object-cover"
                unoptimized={picture.url.startsWith("blob:")}
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-center rounded-lg bg-black/60">
                <button
                  type="button"
                  className="p-2 text-white"
                  onClick={() => setPictures((items) => move(items, index, -1))}
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-white"
                  onClick={() =>
                    setPictures((items) =>
                      items.filter((item) => item.key !== picture.key),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </button>
                <button
                  type="button"
                  className="p-2 text-white"
                  onClick={() => setPictures((items) => move(items, index, 1))}
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {pictures.length < 20 && (
          <label className="flex cursor-pointer items-center gap-2 self-start rounded-md border px-3 py-2 text-sm">
            <ImagePlus className="size-4" />
            {optimizing ? "Optimizando…" : "Agregar imágenes"}
            <input
              hidden
              multiple
              disabled={optimizing}
              type="file"
              accept="image/*"
              onChange={async (event) => {
                await addPictures(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border p-5">
        <h2 className="font-semibold">Formulario de consulta</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="formTitle">Título</Label>
            <Input
              id="formTitle"
              name="formTitle"
              defaultValue={
                development?.formTitle ?? "Consultá por esta obra"
              }
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="submitLabel">Texto del botón</Label>
            <Input
              id="submitLabel"
              name="submitLabel"
              defaultValue={development?.submitLabel ?? "Enviar consulta"}
              required
            />
          </div>
        </div>
        {fields.map((field, index) => (
          <div
            key={field.key}
            className="grid items-center gap-2 rounded-lg bg-muted/40 p-3 md:grid-cols-[1fr_180px_auto_auto]"
          >
            <Input
              aria-label="Nombre del campo"
              value={field.label}
              onChange={(event) =>
                setFields((items) =>
                  items.map((item) =>
                    item.key === field.key
                      ? { ...item, label: event.target.value }
                      : item,
                  ),
                )
              }
              required
            />
            <Select
              value={field.type}
              onValueChange={(value) =>
                value &&
                setFields((items) =>
                  items.map((item) =>
                    item.key === field.key
                      ? { ...item, type: value as FieldType }
                      : item,
                  ),
                )
              }
              items={TYPES.map(([value, label]) => ({ value, label }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={field.required}
                onCheckedChange={(required) =>
                  setFields((items) =>
                    items.map((item) =>
                      item.key === field.key ? { ...item, required } : item,
                    ),
                  )
                }
              />
              Obligatorio
            </label>
            <div className="flex">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setFields((items) => move(items, index, -1))}
              >
                ↑
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() => setFields((items) => move(items, index, 1))}
              >
                ↓
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={() =>
                  setFields((items) =>
                    items.filter((item) => item.key !== field.key),
                  )
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            {field.type === "SELECT" && (
              <Input
                className="md:col-span-4"
                placeholder="Opciones separadas por coma"
                value={field.options}
                onChange={(event) =>
                  setFields((items) =>
                    items.map((item) =>
                      item.key === field.key
                        ? { ...item, options: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() =>
            setFields((items) => [
              ...items,
              {
                key: newKey(),
                label: "",
                type: "TEXT",
                required: false,
                options: "",
              },
            ])
          }
        >
          <Plus className="size-4" />
          Agregar campo
        </Button>
      </section>
      <Button
        type="submit"
        disabled={pending || optimizing}
        className="self-start"
      >
        {pending ? "Guardando…" : "Guardar obra"}
      </Button>
    </form>
  );
}
