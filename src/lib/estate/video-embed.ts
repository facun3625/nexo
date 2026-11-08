// Interpreta un link externo de video (YouTube, Vimeo, Google Drive,
// Dropbox o un archivo de video directo) y devuelve cómo embeberlo, sin
// subir ni procesar nada en el servidor. Si no reconoce el formato, cae a
// un link simple que abre en otra pestaña.
export type VideoEmbed =
  | { kind: "iframe"; src: string }
  | { kind: "video"; src: string }
  | { kind: "link"; src: string };

export function parseVideoEmbed(rawUrl: string): VideoEmbed | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtube.com" || host === "m.youtube.com") {
    const id =
      url.pathname === "/watch"
        ? url.searchParams.get("v")
        : url.pathname.startsWith("/embed/")
          ? url.pathname.split("/")[2]
          : url.pathname.startsWith("/shorts/")
            ? url.pathname.split("/")[2]
            : null;
    if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    if (id) return { kind: "iframe", src: `https://www.youtube.com/embed/${id}` };
  }

  if (host === "vimeo.com") {
    const id = url.pathname.match(/(\d+)/)?.[1];
    if (id) return { kind: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  if (host === "player.vimeo.com") {
    return { kind: "iframe", src: url.toString() };
  }

  if (host === "drive.google.com") {
    const id = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get("id");
    if (id) return { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview` };
  }

  if (host === "dropbox.com") {
    const direct = new URL(url.toString());
    direct.searchParams.set("raw", "1");
    direct.searchParams.delete("dl");
    return { kind: "video", src: direct.toString() };
  }
  if (host === "dl.dropboxusercontent.com") {
    return { kind: "video", src: url.toString() };
  }

  if (/\.(mp4|webm|ogg|mov)$/i.test(url.pathname)) {
    return { kind: "video", src: url.toString() };
  }

  return { kind: "link", src: url.toString() };
}
