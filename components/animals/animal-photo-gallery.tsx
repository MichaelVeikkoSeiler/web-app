"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Camera, Images, Loader2, X } from "lucide-react";
import { uploadAnimalPhoto } from "@/lib/upload-photo";
import { saveAnimalPhoto, deleteAnimalPhoto, reorderAnimalPhotos } from "@/lib/actions/animals";
import { ImageLightbox } from "@/components/ui/image-lightbox";

type Photo = { id: number; blobUrl: string; isPrimary: boolean; orderIndex: number; createdAt: Date };

const LONG_PRESS_MS = 350;
const MOVE_CANCEL_PX = 8;

export function AnimalPhotoGallery({ animalId, photos }: { animalId: number; photos: Photo[] }) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [items, setItems] = useState(photos);
  const [prevPhotos, setPrevPhotos] = useState(photos);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [, startReorderTransition] = useTransition();

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const draggedRef = useRef(false);
  const draggingIdRef = useRef<number | null>(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  if (photos !== prevPhotos && draggingId === null) {
    setPrevPhotos(photos);
    setItems(photos);
  }

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function idAtPoint(x: number, y: number) {
    const el = document.elementFromPoint(x, y)?.closest("[data-photo-id]");
    const id = el?.getAttribute("data-photo-id");
    return id ? Number(id) : null;
  }

  function handlePointerDown(e: React.PointerEvent, photoId: number) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    movedRef.current = false;
    const target = e.currentTarget;

    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      if (movedRef.current) return;
      target.setPointerCapture(e.pointerId);
      draggingIdRef.current = photoId;
      draggedRef.current = true;
      setDraggingId(photoId);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (draggingIdRef.current == null) {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);
      if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
        movedRef.current = true;
        clearLongPressTimer();
      }
      return;
    }
    e.preventDefault();
    const overId = idAtPoint(e.clientX, e.clientY);
    if (overId != null && overId !== draggingIdRef.current) {
      setItems((current) => {
        const from = current.findIndex((p) => p.id === draggingIdRef.current);
        const to = current.findIndex((p) => p.id === overId);
        if (from === -1 || to === -1) return current;
        const next = [...current];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    }
  }

  function endDrag() {
    clearLongPressTimer();
    const wasDragging = draggingIdRef.current != null;
    draggingIdRef.current = null;
    setDraggingId(null);
    if (wasDragging) {
      startReorderTransition(() => reorderAnimalPhotos(animalId, items.map((p) => p.id)));
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadAnimalPhoto(file);
      startTransition(async () => {
        await saveAnimalPhoto(animalId, url, photos.length === 0);
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleDelete(photoId: number) {
    setDeletingId(photoId);
    startTransition(async () => {
      await deleteAnimalPhoto(photoId, animalId);
      setDeletingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length > 1 && (
        <p className="text-xs text-forest-muted">
          Foto kurz gedrückt halten zum Umsortieren. Das erste Foto wird zum Auftaktbild.
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((p, i) => {
          const isDragging = draggingId === p.id;
          return (
            <div
              key={p.id}
              data-photo-id={p.id}
              onPointerDown={(e) => handlePointerDown(e, p.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={isDragging ? { touchAction: "none" } : undefined}
              className={`relative aspect-square select-none overflow-hidden rounded-xl bg-cream transition-shadow ${
                isDragging ? "relative z-20 opacity-70 shadow-lg" : ""
              }`}
            >
              <button
                type="button"
                onClick={(e) => {
                  if (draggedRef.current || movedRef.current) {
                    e.preventDefault();
                    draggedRef.current = false;
                    return;
                  }
                  setLightboxIndex(i);
                }}
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
          );
        })}

        <ImageLightbox
          photos={items}
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
    </div>
  );
}
