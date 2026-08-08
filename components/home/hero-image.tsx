"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Loader2, Pencil } from "lucide-react";
import { uploadHeroImage } from "@/lib/upload-photo";
import { setHeroImage } from "@/lib/actions/settings";

export function HeroImage({ initialUrl }: { initialUrl: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploadedUrl = await uploadHeroImage(file);
      setUrl(uploadedUrl);
      startTransition(() => setHeroImage(uploadedUrl));
    } catch {
      setError("Upload fehlgeschlagen. Ist das Bild kleiner als 30 MB?");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-warm-white sm:aspect-video">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        {url ? (
          <>
            <Image
              src={url}
              alt="Unser Garten"
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
              priority
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/90 text-forest shadow-sm backdrop-blur hover:bg-warm-white disabled:opacity-50"
              aria-label="Bild ändern"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
            </button>
          </>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-border text-forest-muted disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <>
                <Camera className="h-8 w-8" strokeWidth={1.5} />
                <span className="text-sm font-medium">Gartenbild hochladen</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-attention-text">{error}</p>}
    </div>
  );
}
