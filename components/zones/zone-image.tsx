"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Loader2, MapPin, Trash2 } from "lucide-react";
import { uploadZoneImage } from "@/lib/upload-photo";
import { saveZoneImage, clearZoneImage } from "@/lib/actions/zones";

export function ZoneImage({
  zoneId,
  imageUrl,
  name,
}: {
  zoneId: number;
  imageUrl: string | null;
  name: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadZoneImage(file);
      startTransition(async () => {
        await saveZoneImage(zoneId, url);
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleDelete() {
    setDeleting(true);
    startTransition(async () => {
      await clearZoneImage(zoneId);
      setDeleting(false);
    });
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-warm-white sm:aspect-video">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 672px) 100vw, 672px"
          className="object-cover"
          priority
        />
      ) : (
        <div className="flex h-full items-center justify-center text-forest-muted/40">
          <MapPin className="h-16 w-16" strokeWidth={1.25} />
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <div className="absolute bottom-3 right-3 flex gap-2">
        {imageUrl && (
          <button
            onClick={handleDelete}
            disabled={uploading || pending}
            aria-label="Bild löschen"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-forest/80 text-warm-white backdrop-blur-sm hover:bg-attention disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || pending}
          className="flex h-11 items-center gap-2 rounded-full bg-forest/80 px-4 text-sm font-medium text-warm-white backdrop-blur-sm hover:bg-forest disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          {imageUrl ? "Bild ändern" : "Bild hinzufügen"}
        </button>
      </div>
    </div>
  );
}
