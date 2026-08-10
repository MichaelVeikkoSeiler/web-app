"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Loader2, Pencil, Trash2 } from "lucide-react";
import { uploadHeroImage } from "@/lib/upload-photo";

export function HeroBanner({
  initialUrl,
  alt,
  uploadLabel,
  onUpload,
  onDelete,
}: {
  initialUrl: string | null;
  alt: string;
  uploadLabel: string;
  onUpload: (url: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      startTransition(() => onUpload(uploadedUrl));
    } catch {
      setError("Upload fehlgeschlagen. Ist das Bild kleiner als 30 MB?");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete();
      setUrl(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative left-1/2 -mt-4 w-screen -ml-[50vw] sm:-mt-8 md:static md:left-auto md:ml-0 md:w-full">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-b-3xl bg-warm-white sm:aspect-video">
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
                alt={alt}
                fill
                sizes="(max-width: 767px) 100vw, 1024px"
                className="object-cover"
                priority
              />
              <div className="absolute right-3 top-3 flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={uploading || deleting}
                  aria-label="Bild löschen"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/90 text-forest shadow-sm backdrop-blur hover:bg-attention/20 hover:text-attention-text disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || deleting}
                  aria-label="Bild ändern"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/90 text-forest shadow-sm backdrop-blur hover:bg-warm-white disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Pencil className="h-4 w-4" />
                  )}
                </button>
              </div>
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
                  <span className="text-sm font-medium">{uploadLabel}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-attention-text">{error}</p>}
    </div>
  );
}
