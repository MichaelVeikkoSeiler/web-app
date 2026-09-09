import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos } from "@/lib/db/schema";
import { Detektiv } from "@/components/spiele/detektiv";
import type { PlantCompareRow } from "@/lib/plant-compare";

export default async function DetektivPage() {
  const rows = isDbConfigured
    ? await getDb()
        .select({
          id: plants.id,
          germanName: plants.germanName,
          scientificName: plants.scientificName,
          blobUrl: plantPhotos.blobUrl,
          bloomStartMonth: plants.bloomStartMonth,
          bloomEndMonth: plants.bloomEndMonth,
          wateringRhythmDays: plants.wateringRhythmDays,
          careDifficulty: plants.careDifficulty,
        })
        .from(plantPhotos)
        .innerJoin(plants, eq(plantPhotos.plantId, plants.id))
        .where(eq(plantPhotos.isPrimary, true))
    : [];

  const pool: PlantCompareRow[] = rows.map((p) => ({
    id: p.id,
    name: p.germanName ?? p.scientificName,
    imageUrl: p.blobUrl,
    bloomStartMonth: p.bloomStartMonth,
    bloomEndMonth: p.bloomEndMonth,
    wateringRhythmDays: p.wateringRhythmDays,
    careDifficulty: p.careDifficulty,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-forest">Detektiv</h1>
      <Detektiv pool={pool} />
    </div>
  );
}
