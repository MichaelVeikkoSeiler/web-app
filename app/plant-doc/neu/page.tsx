import { eq, desc } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos } from "@/lib/db/schema";
import { PlantDocWizard } from "@/components/plant-doc/plant-doc-wizard";

export default async function PlantDocNeuPage({
  searchParams,
}: {
  searchParams: Promise<{ plantId?: string }>;
}) {
  const { plantId } = await searchParams;
  const requestedId = plantId ? Number(plantId) : null;

  if (!isDbConfigured) {
    return <PlantDocWizard plants={[]} initialPlant={null} />;
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
          plants={[]}
          initialPlant={{
            id: plant.id,
            name: plant.germanName ?? plant.scientificName,
            scientificName: plant.scientificName,
            photoUrl: photo?.blobUrl ?? null,
          }}
        />
      );
    }
  }

  const allPlants = await db
    .select({
      id: plants.id,
      germanName: plants.germanName,
      scientificName: plants.scientificName,
    })
    .from(plants)
    .orderBy(plants.germanName);

  const primaryPhotos = await db
    .select({ plantId: plantPhotos.plantId, blobUrl: plantPhotos.blobUrl })
    .from(plantPhotos)
    .where(eq(plantPhotos.isPrimary, true));

  const photoByPlantId = new Map(primaryPhotos.map((p) => [p.plantId, p.blobUrl]));

  return (
    <PlantDocWizard
      plants={allPlants.map((p) => ({
        id: p.id,
        name: p.germanName ?? p.scientificName,
        scientificName: p.scientificName,
        photoUrl: photoByPlantId.get(p.id) ?? null,
      }))}
      initialPlant={null}
    />
  );
}
