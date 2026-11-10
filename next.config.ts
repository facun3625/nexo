import { WORDPRESS_REDIRECTS } from "./src/lib/wordpress-redirects";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // deploy.sh buildea a una carpeta aparte y recién después la reemplaza, así
  // el servidor viejo sigue serviendo mientras arma el build nuevo. Sin la
  // env var (dev, o un build fuera de deploy.sh) queda en el ".next" de
  // siempre.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Configuración compartida por catálogo, servicios y consultas.
  images: {
    // Logos de tenant (header/footer) se aceptan en SVG y se sanitizan con
    // DOMPurify antes de subirse (ver saveUploadedFile en lib/storage.ts) —
    // por eso es seguro habilitar la optimización de SVG acá. attachment +
    // CSP es la config que recomienda la doc de Next para este caso: si
    // igual quedara algo raro en el archivo, no se ejecuta al servirlo.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Foto de perfil de Google (login con Google) — sin esto, next/image
    // rechaza cualquier URL externa que no esté en esta lista.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Fotos/videos de propiedades (Cloudflare R2, bucket "gerelli"). El
        // subdominio pub-*.r2.dev es aleatorio por bucket, y el día que se
        // conecte un dominio propio (cdn.gerellicorrenti.com.ar) va a haber
        // que agregarlo acá también.
        protocol: "https",
        hostname: "*.r2.dev",
      },
    ],
  },
  // Next indexa public/ al arrancar: una foto subida después queda en 404
  // hasta el próximo reinicio. Los uploads se sirven entonces por una ruta
  // que lee del disco en cada request (api/uploads/[...path]) — este rewrite
  // mantiene intactas las URLs /uploads/... ya guardadas en la base.
  async rewrites() {
    return [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }];
  },
  // Emprendimientos pasó a ser Obras, dentro de Arquitectura. Los links
  // viejos (compartidos, indexados) siguen funcionando.
  async redirects() {
    return [
      { source: "/emprendimientos", destination: "/arquitectura/obras", permanent: true },
      { source: "/emprendimientos/:id", destination: "/arquitectura/obras/:id", permanent: true },
      ...WORDPRESS_REDIRECTS,
      // Acceso a los correos del dominio (webmail del hosting). No es
      // permanente: si cambia el servidor, el navegador no queda con el viejo.
      {
        source: "/webmail",
        destination: "https://vps-1620597-x.dattaweb.com:2094/login.php",
        permanent: false,
      },
    ];
  },
  experimental: {
    // Next 16 aplica además un buffer de 10 MB en proxy. Debe coincidir con
    // el límite de Server Actions o un multipart grande llega truncado y
    // Busboy responde "Unexpected end of form".
    // 55 MB por el video de portada (/api/admin/cover-video, hasta 50 MB).
    proxyClientMaxBodySize: "55mb",
    // Default de Next es 1MB — una foto de celular (comprobante de
    // transferencia, foto de producto) lo pasa fácil. Tiene que ir de la
    // mano con el client_max_body_size de Nginx (ver README).
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
