import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plantDocCases, plantDocPhotos, plants } from "@/lib/db/schema";
import { CaseResult } from "@/components/plant-doc/case-result";

export default async function PlantDocCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const id = Number(caseId);
  if (Number.isNaN(id)) notFound();
  if (!isDbConfigured) notFound();

  const db = getDb();
  const [docCase] = await db.select().from(plantDocCases).where(eq(plantDocCases.id, id)).limit(1);
  if (!docCase) notFound();

  const [plant, photos] = await Promise.all([
    db
      .select({ germanName: plants.germanName, scientificName: plants.scientificName })
      .from(plants)
      .where(eq(plants.id, docCase.plantId))
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select()
      .from(plantDocPhotos)
      .where(eq(plantDocPhotos.caseId, id))
      .orderBy(asc(plantDocPhotos.id)),
  ]);

  return (
    <CaseResult
      docCase={docCase}
      photos={photos}
      plantName={plant ? (plant.germanName ?? plant.scientificName) : "Unbekannte Pflanze"}
    />
  );
}
