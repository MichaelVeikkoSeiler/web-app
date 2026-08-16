"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";

type LightboxPhoto = { id: number; blobUrl: string; createdAt?: Date; takenAt?: Date | null };

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const dateFormat: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };

export function ImageLightbox({
  photos,
  initialIndex,
  open,
  onClose,
  alt,
  onSetTakenAt,
}: {
  photos: LightboxPhoto[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  alt: string;
  onSetTakenAt?: (photoId: number, takenAt: Date) => Promise<void>;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(initialIndex);
  const [editingDate, setEditingDate] = useState(false);
  const [dateValue, setDateValue] = useState("");
  const [savingDate, startSavingDate] = useTransition();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    setEditingDate(false);
  }, [index]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  if (!open || photos.length === 0) return null;

  function goTo(i: number) {
    setIndex((i + photos.length) % photos.length);
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

  const current = photos[index];

  function startEditing() {
    if (!onSetTakenAt) return;
    setDateValue(toDateInputValue(current.takenAt ?? current.createdAt ?? new Date()));
    setEditingDate(true);
  }

  function saveDate() {
    if (!onSetTakenAt || !dateValue) return;
    const [year, month, day] = dateValue.split("-").map(Number);
    const takenAt = new Date(year, month - 1, day);
    startSavingDate(async () => {
      await onSetTakenAt(current.id, takenAt);
      setEditingDate(false);
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest/90 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={photos.length > 1 ? onTouchStart : undefined}
      onTouchEnd={photos.length > 1 ? onTouchEnd : undefined}
    >
      <div
        className="relative h-full w-full max-w-3xl p-4 sm:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          key={current.id}
          src={current.blobUrl}
          alt={alt}
          fill
          sizes="100vw"
          className="object-contain"
        />
      </div>

      <button
        onClick={onClose}
        aria-label="Schliessen"
        className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
      >
        <X className="h-5 w-5" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goTo(index - 1);
            }}
            aria-label="Vorheriges Foto"
            className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goTo(index + 1);
            }}
            aria-label="Nächstes Foto"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-forest/60 text-warm-white backdrop-blur-sm hover:bg-forest/80"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {(current.createdAt || current.takenAt || photos.length > 1) && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2">
          {editingDate ? (
            <div
              className="flex items-center gap-1.5 rounded-full bg-forest/60 py-1 pl-3 pr-1.5 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="date"
                autoFocus
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="bg-transparent text-xs text-warm-white [color-scheme:dark]"
              />
              <button
                onClick={saveDate}
                disabled={savingDate}
                aria-label="Datum speichern"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warm-white/20 text-warm-white hover:bg-warm-white/30 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            (current.takenAt || current.createdAt) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
                disabled={!onSetTakenAt}
                className="rounded-full bg-forest/60 px-3 py-1.5 text-xs text-warm-white backdrop-blur-sm disabled:cursor-default"
              >
                {current.takenAt
                  ? `Fotografiert am ${current.takenAt.toLocaleDateString("de-CH", dateFormat)}`
                  : `Hochgeladen am ${current.createdAt!.toLocaleDateString("de-CH", dateFormat)}`}
              </button>
            )
          )}
          {photos.length > 1 && (
            <div className="flex gap-1.5">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(i);
                  }}
                  aria-label={`Foto ${i + 1} anzeigen`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-4 bg-warm-white" : "w-1.5 bg-warm-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
