import { WeatherWidget } from "@/components/weather/weather-widget";
import {
  getWetterHeroImageUrl,
  setWetterHeroImage,
  clearWetterHeroImage,
} from "@/lib/actions/settings";
import { HeroBanner } from "@/components/layout/hero-banner";

export default async function WetterPage() {
  const heroImageUrl = await getWetterHeroImageUrl();

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Wetter"
        uploadLabel="Bild hochladen"
        onUpload={setWetterHeroImage}
        onDelete={clearWetterHeroImage}
      />

      <h1 className="font-display text-2xl text-forest">Wetter</h1>
      <WeatherWidget />
    </div>
  );
}
