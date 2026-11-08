import { parseVideoEmbed } from "@/lib/estate/video-embed";

export function VideoPlayer({ url, className = "" }: { url: string; className?: string }) {
  const embed = parseVideoEmbed(url);
  if (!embed) return null;

  if (embed.kind === "iframe") {
    return (
      <div className={`aspect-video overflow-hidden rounded-xl bg-black ${className}`}>
        <iframe
          src={embed.src}
          title="Video"
          className="size-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (embed.kind === "video") {
    return (
      <video
        controls
        src={embed.src}
        className={`aspect-video w-full rounded-xl bg-black ${className}`}
      />
    );
  }

  return (
    <a
      href={embed.src}
      target="_blank"
      rel="noreferrer"
      className={`inline-block text-sm font-medium text-primary underline ${className}`}
    >
      Ver video
    </a>
  );
}
