import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import {
  plants,
  plantPhotos,
  plantZoneAssignments,
  animals,
  animalPhotos,
  animalZoneAssignments,
  zones,
} from "@/lib/db/schema";
import { PlantQuiz, type QuizSubject, type QuizZone } from "@/components/quiz/plant-quiz";

export default async function QuizPage() {
  const db = getDb();

  const [plantRows, animalRows, plantZoneRows, animalZoneRows, zoneRows] = isDbConfigured
    ? await Promise.all([
        db
          .select({
            id: plants.id,
            germanName: plants.germanName,
            scientificName: plants.scientificName,
            blobUrl: plantPhotos.blobUrl,
          })
          .from(plantPhotos)
          .innerJoin(plants, eq(plantPhotos.plantId, plants.id))
          .where(eq(plantPhotos.isPrimary, true)),
        db
          .select({
            id: animals.id,
            germanName: animals.germanName,
            commonName: animals.commonName,
            scientificName: animals.scientificName,
            blobUrl: animalPhotos.blobUrl,
          })
          .from(animalPhotos)
          .innerJoin(animals, eq(animalPhotos.animalId, animals.id))
          .where(eq(animalPhotos.isPrimary, true)),
        db
          .select({ plantId: plantZoneAssignments.plantId, zoneId: plantZoneAssignments.zoneId })
          .from(plantZoneAssignments),
        db
          .select({ animalId: animalZoneAssignments.animalId, zoneId: animalZoneAssignments.zoneId })
          .from(animalZoneAssignments),
        db.select({ id: zones.id, name: zones.name }).from(zones),
      ])
    : [[], [], [], [], []];

  const plantZonesByPlantId = new Map<number, number[]>();
  for (const row of plantZoneRows) {
    const list = plantZonesByPlantId.get(row.plantId) ?? [];
    list.push(row.zoneId);
    plantZonesByPlantId.set(row.plantId, list);
  }

  const animalZonesByAnimalId = new Map<number, number[]>();
  for (const row of animalZoneRows) {
    const list = animalZonesByAnimalId.get(row.animalId) ?? [];
    list.push(row.zoneId);
    animalZonesByAnimalId.set(row.animalId, list);
  }

  const pool: QuizSubject[] = [
    ...plantRows.map((p) => ({
      id: `plant-${p.id}`,
      kind: "plant" as const,
      name: p.germanName ?? p.scientificName,
      germanName: p.germanName,
      scientificName: p.scientificName,
      imageUrl: p.blobUrl,
      zoneIds: plantZonesByPlantId.get(p.id) ?? [],
    })),
    ...animalRows.map((a) => ({
      id: `animal-${a.id}`,
      kind: "animal" as const,
      name: a.germanName ?? a.commonName ?? a.scientificName,
      germanName: a.germanName ?? a.commonName,
      scientificName: a.scientificName,
      imageUrl: a.blobUrl,
      zoneIds: animalZonesByAnimalId.get(a.id) ?? [],
    })),
  ];

  const zoneOptions: QuizZone[] = zoneRows;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-forest">Quiz</h1>
      <PlantQuiz pool={pool} zones={zoneOptions} />
    </div>
  );
}
