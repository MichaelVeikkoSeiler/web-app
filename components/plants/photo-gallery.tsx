"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Loader2 } from "lucide-react";
import { uploadPlantPhoto } from "@/lib/upload-photo";
import { savePlantPhoto } from "@/lib/actions/plants";

type Photo = { id: number; blobUrl: string; isPrimary: boolean };

export function PhotoGallery({ plantId, photos }: { plantId: number; photos: Photo[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

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

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {photos.map((p) => (
        <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-cream">
          <Image src={p.blobUrl} alt="" fill sizes="150px" className="object-cover" />
        </div>
      ))}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-forest-muted hover:border-sage disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
