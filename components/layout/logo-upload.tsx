"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Plus, Loader2 } from "lucide-react";
import { uploadHeroImage as uploadImage } from "@/lib/upload-photo";
import { setLogoImage } from "@/lib/actions/settings";

export function LogoUpload({ initialUrl }: { initialUrl: string | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadedUrl = await uploadImage(file);
      setUrl(uploadedUrl);
      startTransition(() => setLogoImage(uploadedUrl));
    } catch {
      // Logo-Upload ist ein Detail ohne Fehler-UI - kann jederzeit erneut versucht werden.
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <button
      onClick={() => fileInputRef.current?.click()}
      disabled={uploading}
      aria-label={url ? "Logo ändern" : "Logo hochladen"}
      className="relative flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-transparent bg-warm-white text-forest-muted hover:border-sage disabled:opacity-50 sm:h-[51px] sm:w-[51px]"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {uploading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : url ? (
        <Image src={url} alt="Logo" fill sizes="51px" className="object-cover" />
      ) : (
        <Plus className="h-5 w-5" strokeWidth={2.25} />
      )}
    </button>
  );
}
