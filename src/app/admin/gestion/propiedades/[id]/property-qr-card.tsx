import Link from "next/link";
import QRCode from "qrcode";
import { DownloadIcon, QrCodeIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { propertyQrUrl } from "@/lib/qr";

// El QR no se guarda: se arma a partir de la propiedad, así existe desde
// que se crea y su dirección nunca cambia.
export async function PropertyQrDetails({
  tenantId,
  propertyId,
  code,
  published,
}: {
  tenantId: string;
  propertyId: string;
  code: string;
  published: boolean;
}) {
  const url = propertyQrUrl(propertyId);
  const options = { margin: 2, errorCorrectionLevel: "M" as const };
  const [png, svg, opens] = await Promise.all([
    QRCode.toDataURL(url, { ...options, width: 1024 }),
    QRCode.toString(url, { ...options, type: "svg" }),
    prisma.estateQrVisit.count({ where: { tenantId, propertyId } }),
  ]);
  const filename = `qr-${code.replace(/[^\w-]+/g, "-")}`;
  const buttonClass = "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted";
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL generada acá */}
      <img src={png} alt={`QR de la propiedad ${code}`} width={144} height={144} className="size-36 shrink-0 rounded-xl border bg-white" />
      <div className="min-w-0 space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <QrCodeIcon className="size-5" />
          QR de la propiedad
        </h2>
        <p className="text-sm text-muted-foreground">
          Quien lo escanee deja nombre, apellido y teléfono antes de ver la propiedad.{" "}
          <Link href={`/admin/gestion/aperturas-qr?propiedad=${propertyId}`} className="underline">
            {opens === 1 ? "1 apertura" : `${opens} aperturas`}
          </Link>
        </p>
        <p className="break-all font-mono text-xs text-muted-foreground">{url}</p>
        {!published && (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            La propiedad no está publicada: quien escanee el QR va a ver que no está disponible.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <a href={png} download={`${filename}.png`} className={buttonClass}>
            <DownloadIcon className="size-4" />
            PNG
          </a>
          <a href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} download={`${filename}.svg`} className={buttonClass}>
            <DownloadIcon className="size-4" />
            SVG (para imprenta)
          </a>
        </div>
      </div>
    </div>
  );
}
