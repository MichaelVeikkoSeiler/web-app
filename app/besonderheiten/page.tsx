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

      <h1 className="font-display text-2xl text-forest">Speziell</h1>

      <HighlightSections highlights={highlights} />
    </div>
  );
}
