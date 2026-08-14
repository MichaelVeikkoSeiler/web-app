import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos } from "@/lib/db/schema";
import { PlantQuiz } from "@/components/quiz/plant-quiz";

export default async function QuizPage() {
  const rows = isDbConfigured
    ? await getDb()
        .select({
          id: plants.id,
          germanName: plants.germanName,
          scientificName: plants.scientificName,
          blobUrl: plantPhotos.blobUrl,
        })
        .from(plantPhotos)
        .innerJoin(plants, eq(plantPhotos.plantId, plants.id))
        .where(eq(plantPhotos.isPrimary, true))
    : [];

  const pool = rows.map((p) => ({
    id: p.id,
    name: p.germanName ?? p.scientificName,
    imageUrl: p.blobUrl,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-forest">Quiz</h1>
      <PlantQuiz pool={pool} />
    </div>
  );
}
