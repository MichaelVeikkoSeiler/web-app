import { Sparkles } from "lucide-react";
import { getPlantHighlights } from "@/lib/plants-query";
import {
  getBesonderheitenHeroImageUrl,
  setBesonderheitenHeroImage,
  clearBesonderheitenHeroImage,
} from "@/lib/actions/settings";
import { HeroBanner } from "@/components/layout/hero-banner";
import { HighlightSections } from "@/components/besonderheiten/highlight-sections";

export default async function BesonderheitenPage() {
  const [highlights, heroImageUrl] = await Promise.all([
    getPlantHighlights(),
    getBesonderheitenHeroImageUrl(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Speziell"
        uploadLabel="Bild hochladen"
        onUpload={setBesonderheitenHeroImage}
        onDelete={clearBesonderheitenHeroImage}
      />

      <h1 className="flex items-center gap-2 font-display text-2xl text-forest">
        <Sparkles className="h-6 w-6 text-forest-muted" strokeWidth={1.75} />
        Speziell
      </h1>

      <HighlightSections highlights={highlights} />
    </div>
  );
}
