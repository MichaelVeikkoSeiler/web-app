"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { uploadHeroImage } from "@/lib/upload-photo";
import { addHeroImage, deleteHeroImage, type HeroPhoto } from "@/lib/actions/settings";

export function HeroImage({ initialPhotos }: { initialPhotos: HeroPhoto[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [{ photos, index }, setState] = useState<{ photos: HeroPhoto[]; index: number }>({
    photos: initialPhotos,
    index: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const current = photos[index];

  function goTo(i: number) {
    setState((prev) => {
      if (prev.photos.length === 0) return prev;
      return { ...prev, index: (i + prev.photos.length) % prev.photos.length };
    });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const tempId = -Date.now();
    try {
      const url = await uploadHeroImage(file);
      setState((prev) => {
        const nextPhotos = [...prev.photos, { id: tempId, blobUrl: url }];
        return { photos: nextPhotos, index: nextPhotos.length - 1 };
      });
      const saved = await addHeroImage(url);
      setState((prev) => ({
        ...prev,
        photos: prev.photos.map((p) => (p.id === tempId ? saved : p)),
      }));
    } catch {
      setError("Upload fehlgeschlagen. Ist das Bild kleiner als 30 MB?");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete() {
    if (!current || current.id < 0) return;
    const id = current.id;
    setDeletingId(id);
    try {
      await deleteHeroImage(id);
      setState((prev) => {
        const nextPhotos = prev.photos.filter((p) => p.id !== id);
        const nextIndex = nextPhotos.length === 0 ? 0 : Math.min(prev.index, nextPhotos.length - 1);
        return { photos: nextPhotos, index: nextIndex };
      });
    } finally {
      setDeletingId(null);
    }
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    const SWIPE_THRESHOLD = 40;
    if (delta > SWIPE_THRESHOLD) goTo(index - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(index + 1);
  }

  const deleting = current ? deletingId === current.id : false;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative left-1/2 -mt-4 w-screen -ml-[50vw] sm:-mt-8 md:static md:left-auto md:ml-0 md:w-full">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-b-3xl bg-warm-white sm:aspect-video"
          onTouchStart={photos.length > 1 ? onTouchStart : undefined}
          onTouchEnd={photos.length > 1 ? onTouchEnd : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          {current ? (
            <Image
              key={current.id}
              src={current.blobUrl}
              alt="Unser Garten"
              fill
              sizes="(max-width: 767px) 100vw, 1024px"
              className="object-cover"
              priority
            />
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

          {current && (
            <div className="absolute right-3 top-3 flex gap-2">
              <button
                onClick={handleDelete}
                disabled={uploading || deleting || current.id < 0}
                aria-label="Foto löschen"
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
                aria-label="Foto hinzufügen"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-white/90 text-forest shadow-sm backdrop-blur hover:bg-warm-white disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button
                onClick={() => goTo(index - 1)}
                aria-label="Vorheriges Foto"
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => goTo(index + 1)}
                aria-label="Nächstes Foto"
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => goTo(i)}
                    aria-label={`Foto ${i + 1} anzeigen`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? "w-4 bg-warm-white" : "w-1.5 bg-warm-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-attention-text">{error}</p>}
    </div>
  );
}
