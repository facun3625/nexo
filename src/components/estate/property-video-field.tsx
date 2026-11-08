"use client";
import { useState } from "react";
import { inputClass } from "@/components/estate/form-field-class";
import { VideoPlayer } from "@/components/estate/video-player";

export function PropertyVideoField({
  defaultValue,
  onDirty,
}: {
  defaultValue: string;
  onDirty: () => void;
}) {
  const [url, setUrl] = useState(defaultValue);
  const trimmed = url.trim();

  return (
    <div className="space-y-3">
      <input
        type="url"
        name="videoUrl"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          onDirty();
        }}
        placeholder="https://youtube.com/… , vimeo.com/… , drive.google.com/… , dropbox.com/…"
        className={inputClass}
      />
      {trimmed && <VideoPlayer url={trimmed} className="max-w-md" />}
    </div>
  );
}
