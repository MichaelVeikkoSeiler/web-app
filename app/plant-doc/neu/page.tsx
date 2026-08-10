import { eq, desc } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos } from "@/lib/db/schema";
import { getPlantsGroupedByZone } from "@/lib/plants-query";
import { PlantDocWizard } from "@/components/plant-doc/plant-doc-wizard";

export default async function PlantDocNeuPage({
  searchParams,
}: {
  searchParams: Promise<{ plantId?: string }>;
}) {
  const { plantId } = await searchParams;
  const requestedId = plantId ? Number(plantId) : null;

  if (!isDbConfigured) {
    return <PlantDocWizard plantGroups={[]} initialPlant={null} />;
  }

  const db = getDb();

  if (requestedId && Number.isFinite(requestedId)) {
    const [plant] = await db
      .select({ id: plants.id, germanName: plants.germanName, scientificName: plants.scientificName })
      .from(plants)
      .where(eq(plants.id, requestedId))
      .limit(1);

    if (plant) {
      const [photo] = await db
        .select({ blobUrl: plantPhotos.blobUrl })
        .from(plantPhotos)
        .where(eq(plantPhotos.plantId, plant.id))
        .orderBy(desc(plantPhotos.isPrimary))
        .limit(1);

      return (
        <PlantDocWizard
          plantGroups={[]}
          initialPlant={{
            id: plant.id,
            name: plant.germanName ?? plant.scientificName,
            photoUrl: photo?.blobUrl ?? null,
          }}
        />
      );
    }
  }

  const { groups } = await getPlantsGroupedByZone();

  return <PlantDocWizard plantGroups={groups} initialPlant={null} />;
}
