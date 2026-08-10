"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { plantDocCases, plantDocPhotos, plantDocCaseStatusEnum } from "@/lib/db/schema";
import { gatherPlantDocContext } from "@/lib/plant-doc-context";
import { analyzePlantDocCase } from "@/lib/plant-doc-ai";
import { PLANT_DOC_MAX_PHOTOS, type PlantDocAnswers } from "@/lib/plant-doc-types";

export async function startPlantDocCase(
  plantId: number,
  photos: { url: string; role: string | null }[],
  answers: PlantDocAnswers,
): Promise<{ caseId: number }> {
  if (photos.length === 0) {
    throw new Error("Mindestens ein Foto ist erforderlich.");
  }
  if (photos.length > PLANT_DOC_MAX_PHOTOS) {
    throw new Error(`Maximal ${PLANT_DOC_MAX_PHOTOS} Fotos pro Analyse.`);
  }

  const db = getDb();
  const context = await gatherPlantDocContext(plantId);

  const [docCase] = await db
    .insert(plantDocCases)
    .values({
      plantId,
      answers,
      contextSnapshot: context,
    })
    .returning({ id: plantDocCases.id });

  await db
    .insert(plantDocPhotos)
    .values(photos.map((p) => ({ caseId: docCase.id, blobUrl: p.url, role: p.role })));

  after(() => analyzePlantDocCase(docCase.id));

  revalidatePath("/plant-doc");
  revalidatePath(`/plant-doc/${docCase.id}`);
  revalidatePath(`/pflanzen/${plantId}`);

  return { caseId: docCase.id };
}

export async function retryPlantDocAnalysis(caseId: number) {
  const db = getDb();
  await db
    .update(plantDocCases)
    .set({ analysisStatus: "pending", analysisError: null, updatedAt: new Date() })
    .where(eq(plantDocCases.id, caseId));
  after(() => analyzePlantDocCase(caseId));
  revalidatePath(`/plant-doc/${caseId}`);
}

export async function updatePlantDocCaseStatus(
  caseId: number,
  status: (typeof plantDocCaseStatusEnum.enumValues)[number],
) {
  const db = getDb();
  const [docCase] = await db
    .update(plantDocCases)
    .set({ status, updatedAt: new Date() })
    .where(eq(plantDocCases.id, caseId))
    .returning({ plantId: plantDocCases.plantId });

  revalidatePath(`/plant-doc/${caseId}`);
  revalidatePath("/plant-doc");
  if (docCase) revalidatePath(`/pflanzen/${docCase.plantId}`);
}

export async function deletePlantDocCase(caseId: number) {
  const db = getDb();
  const [docCase] = await db
    .select({ plantId: plantDocCases.plantId })
    .from(plantDocCases)
    .where(eq(plantDocCases.id, caseId))
    .limit(1);

  const photos = await db
    .select({ blobUrl: plantDocPhotos.blobUrl })
    .from(plantDocPhotos)
    .where(eq(plantDocPhotos.caseId, caseId));

  await db.delete(plantDocCases).where(eq(plantDocCases.id, caseId));

  if (photos.length > 0) {
    await del(photos.map((p) => p.blobUrl)).catch(() => {});
  }

  revalidatePath("/plant-doc");
  if (docCase) revalidatePath(`/pflanzen/${docCase.plantId}`);
}
