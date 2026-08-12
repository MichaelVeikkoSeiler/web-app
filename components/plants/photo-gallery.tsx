"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Images, Loader2, X } from "lucide-react";
import { uploadPlantPhoto } from "@/lib/upload-photo";
import { savePlantPhoto, deletePlantPhoto } from "@/lib/actions/plants";
import { ImageLightbox } from "@/components/ui/image-lightbox";

type Photo = { id: number; blobUrl: string; isPrimary: boolean };

export function PhotoGallery({ plantId, photos }: { plantId: number; photos: Photo[] }) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPlantPhoto(file);
      startTransition(async () => {
        await savePlantPhoto(plantId, url, photos.length === 0);
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleDelete(photoId: number) {
    setDeletingId(photoId);
    startTransition(async () => {
      await deletePlantPhoto(photoId, plantId);
      setDeletingId(null);
    });
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((p, i) => (
        <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-cream">
          <button
            type="button"
            onClick={() => setLightboxIndex(i)}
            aria-label="Foto vergrössern"
            className="absolute inset-0"
          >
            <Image src={p.blobUrl} alt="" fill sizes="150px" className="object-cover" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(p.id);
            }}
            disabled={pending && deletingId === p.id}
            aria-label="Foto löschen"
            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-forest/70 text-warm-white hover:bg-attention disabled:opacity-50"
          >
            {pending && deletingId === p.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ))}

      <ImageLightbox
        photos={photos}
        initialIndex={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        alt=""
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => cameraInputRef.current?.click()}
        disabled={uploading}
        aria-label="Foto mit Kamera aufnehmen"
        className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-forest-muted hover:border-sage disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
      </button>
      <button
        onClick={() => galleryInputRef.current?.click()}
        disabled={uploading}
        aria-label="Foto aus Galerie wählen"
        className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-forest-muted hover:border-sage disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Images className="h-5 w-5" />}
      </button>
    </div>
  );
}
