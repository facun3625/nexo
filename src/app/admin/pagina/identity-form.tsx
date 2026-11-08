"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StoreSettings } from "@/lib/settings";
import { ImageField } from "./image-field";
import { removeStoreImage, updateIdentity } from "./actions";

// Mismos valores que DEFAULT_*_COLOR en @/lib/settings — no se importan de
// ahí porque ese módulo carga Prisma (server-only) y esto es "use client".
const DEFAULT_HEADER_BG_COLOR = "#3d3d3d";
const DEFAULT_MENU_BG_COLOR = "#1e658c";
const DEFAULT_FOOTER_BG_COLOR = "#3d3d3d";
const DEFAULT_BUTTON_COLOR = "#1e658c";
const DEFAULT_BADGE_COLOR = "#1e658c";

function ColorField({
  name,
  label,
  hint,
  defaultValue,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border p-0.5"
          aria-label={label}
        />
        <Input
          id={name}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={7}
          className="w-28 font-mono uppercase"
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function IdentityForm({ settings }: { settings: StoreSettings }) {
  const [pending, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoUrl);
  const [footerLogoPreview, setFooterLogoPreview] = useState<string | null>(settings.footerLogoUrl);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(settings.faviconUrl);
  const [logoHeight, setLogoHeight] = useState(settings.logoHeight);
  const [footerLogoHeight, setFooterLogoHeight] = useState(settings.footerLogoHeight);

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          try {
            const actionResult = await updateIdentity(formData);
            if ("error" in actionResult) {
              toast.error(actionResult.error);
              return;
            }
            toast.success("Identidad guardada");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error al guardar");
          }
        })
      }
      className="flex flex-col gap-5 rounded-lg border p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="storeName">Nombre del negocio</Label>
        <Input id="storeName" name="storeName" defaultValue={settings.storeName} required />
      </div>

      <ImageField
        label="Logo"
        name="logo"
        shape="logo"
        preview={logoPreview}
        onPreviewChange={setLogoPreview}
        heightPx={logoHeight}
        onRemove={
          settings.logoUrl
            ? async () => {
                const actionResult = await removeStoreImage("store_logo_url");
                if ("error" in actionResult) {
                  toast.error(actionResult.error);
                  return;
                }
                setLogoPreview(null);
                toast.success("Logo eliminado");
              }
            : undefined
        }
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="logoHeight">Tamaño del logo</Label>
          <span className="text-xs text-muted-foreground">{logoHeight}px de alto</span>
        </div>
        <input
          id="logoHeight"
          name="logoHeight"
          type="range"
          min={32}
          max={120}
          step={4}
          value={logoHeight}
          onChange={(e) => setLogoHeight(Number(e.target.value))}
          className="accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          La vista previa de arriba ya muestra el tamaño real que va a tener en el header.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t pt-5">
        <ImageField
          label="Logo del footer"
          name="footerLogo"
          shape="logo"
          preview={footerLogoPreview}
          onPreviewChange={setFooterLogoPreview}
          heightPx={footerLogoHeight}
          onRemove={
            settings.footerLogoUrl
              ? async () => {
                  const actionResult = await removeStoreImage("store_footer_logo_url");
                  if ("error" in actionResult) {
                    toast.error(actionResult.error);
                    return;
                  }
                  setFooterLogoPreview(null);
                  toast.success("Logo del footer eliminado");
                }
              : undefined
          }
        />
        <p className="text-xs text-muted-foreground">
          Opcional. Si no subís uno, el footer usa el mismo logo del header.
        </p>
        <div className="mt-2 flex items-center justify-between">
          <Label htmlFor="footerLogoHeight">Tamaño del logo en el footer</Label>
          <span className="text-xs text-muted-foreground">{footerLogoHeight}px de alto</span>
        </div>
        <input
          id="footerLogoHeight"
          name="footerLogoHeight"
          type="range"
          min={32}
          max={120}
          step={4}
          value={footerLogoHeight}
          onChange={(e) => setFooterLogoHeight(Number(e.target.value))}
          className="accent-primary"
        />
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-sm">
        <span>
          <span className="font-medium">Mostrar el nombre junto al logo</span>
          <span className="block text-xs text-muted-foreground">
            Apagalo si tu logo ya incluye el nombre escrito (como este).
          </span>
        </span>
        <input
          type="checkbox"
          name="showNameInHeader"
          defaultChecked={settings.showNameInHeader}
          className="size-5 shrink-0 accent-primary"
        />
      </label>

      <ImageField
        label="Favicon (ícono de la pestaña del navegador)"
        name="favicon"
        shape="circle"
        preview={faviconPreview}
        onPreviewChange={setFaviconPreview}
        onRemove={
          settings.faviconUrl
            ? async () => {
                const actionResult = await removeStoreImage("store_favicon_url");
                if ("error" in actionResult) {
                  toast.error(actionResult.error);
                  return;
                }
                setFaviconPreview(null);
                toast.success("Favicon eliminado");
              }
            : undefined
        }
      />

      <div className="flex flex-col gap-2 border-t pt-5">
        <Label htmlFor="addToCartLabel">Texto del botón &quot;Agregar&quot;</Label>
        <Input
          id="addToCartLabel"
          name="addToCartLabel"
          placeholder="Agregar"
          defaultValue={settings.addToCartLabel}
        />
        <p className="text-xs text-muted-foreground">
          Aparece en cada publicación del catálogo y en el carrito.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-t pt-5">
        <div>
          <p className="text-sm font-semibold">Colores del sitio</p>
          <p className="text-xs text-muted-foreground">
            El color de letra sobre cada fondo se ajusta solo (blanco sobre fondos oscuros, negro
            sobre claros).
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            name="headerBgColor"
            label="Fondo del header"
            hint="Barra superior, donde va el logo."
            defaultValue={settings.headerBgColor || DEFAULT_HEADER_BG_COLOR}
          />
          <ColorField
            name="menuBgColor"
            label="Fondo del menú"
            hint="Barra de navegación, debajo del header."
            defaultValue={settings.menuBgColor || DEFAULT_MENU_BG_COLOR}
          />
          <ColorField
            name="footerBgColor"
            label="Fondo del footer"
            hint="Pie de página, al final del sitio."
            defaultValue={settings.footerBgColor || DEFAULT_FOOTER_BG_COLOR}
          />
          <ColorField
            name="buttonColor"
            label="Color de botones"
            defaultValue={settings.buttonColor || DEFAULT_BUTTON_COLOR}
          />
          <ColorField
            name="badgeColor"
            label="Color de etiquetas"
            hint="Ej: la etiqueta Venta/Alquiler sobre las fotos."
            defaultValue={settings.badgeColor || DEFAULT_BADGE_COLOR}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="self-start">
        Guardar cambios
      </Button>
    </form>
  );
}
