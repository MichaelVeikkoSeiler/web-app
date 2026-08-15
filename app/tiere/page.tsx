import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { animals, animalPhotos } from "@/lib/db/schema";
import {
  getAnimalsHeroImageUrl,
  setAnimalsHeroImage,
  clearAnimalsHeroImage,
} from "@/lib/actions/settings";
import { AnimalList } from "@/components/animals/animal-list";
import { HeroBanner } from "@/components/layout/hero-banner";

export default async function TierePage() {
  const [allAnimals, primaryPhotos, heroImageUrl] = isDbConfigured
    ? await Promise.all([
        getDb().select().from(animals),
        getDb()
          .select({ animalId: animalPhotos.animalId, blobUrl: animalPhotos.blobUrl })
          .from(animalPhotos)
          .where(eq(animalPhotos.isPrimary, true)),
        getAnimalsHeroImageUrl(),
      ])
    : [[], [], null];

  const photoByAnimal = new Map(primaryPhotos.map((p) => [p.animalId, p.blobUrl]));

  const tiles = allAnimals
    .map((a) => ({
      id: a.id,
      name: a.germanName ?? a.scientificName,
      imageUrl: photoByAnimal.get(a.id) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Tiere"
        uploadLabel="Bild hochladen"
        onUpload={setAnimalsHeroImage}
        onDelete={clearAnimalsHeroImage}
      />
      <AnimalList animals={tiles} />
    </div>
  );
}
