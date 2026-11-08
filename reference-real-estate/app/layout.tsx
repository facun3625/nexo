import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import TrackPageView from "@/components/TrackPageView";
import ChatWidget from "@/components/ChatWidget";
import { getSiteConfig } from "@/lib/config";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const description =
    (config as any).metaDescription ||
    "Más de 20 años de trayectoria en compra, venta y alquiler de propiedades en Santa Fe, Argentina.";
  const ogImage = (config as any).ogImage || undefined;

  return {
    title: "Penalva Inmobiliaria — Santa Fe, Argentina",
    description,
    openGraph: {
      title: "Penalva Inmobiliaria — Santa Fe, Argentina",
      description,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: "Penalva Inmobiliaria — Santa Fe, Argentina",
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} antialiased`}>
        <TrackPageView />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
