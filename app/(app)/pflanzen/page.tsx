import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos } from "@/lib/db/schema";
import {
  getPlantsHeroImageUrl,
  setPlantsHeroImage,
  clearPlantsHeroImage,
} from "@/lib/actions/settings";
import { PlantList } from "@/components/plants/plant-list";
import { HeroBanner } from "@/components/layout/hero-banner";

export default async function PflanzenPage() {
  const [allPlants, primaryPhotos, heroImageUrl] = isDbConfigured
    ? await Promise.all([
        getDb().select().from(plants),
        getDb()
          .select({ plantId: plantPhotos.plantId, blobUrl: plantPhotos.blobUrl })
          .from(plantPhotos)
          .where(eq(plantPhotos.isPrimary, true)),
        getPlantsHeroImageUrl(),
      ])
    : [[], [], null];

  const photoByPlant = new Map(primaryPhotos.map((p) => [p.plantId, p.blobUrl]));

  const tiles = allPlants
    .map((p) => ({
      id: p.id,
      name: p.germanName ?? p.scientificName,
      imageUrl: photoByPlant.get(p.id) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Pflanzen"
        uploadLabel="Bild hochladen"
        onUpload={setPlantsHeroImage}
        onDelete={clearPlantsHeroImage}
      />
      <PlantList plants={tiles} />
    </div>
  );
}
