"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { del } from "@vercel/blob";
import { eq, ilike, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { plants, plantZoneAssignments, plantPhotos, plantNotes, zones } from "@/lib/db/schema";
import { identifyPlantPhoto, type PlantNetCandidate } from "@/lib/plantnet";
import { enrichPlant } from "@/lib/enrichment";

export async function identifyPlant(formData: FormData): Promise<{
  candidates: PlantNetCandidate[];
  error?: string;
}> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { candidates: [], error: "Kein Foto empfangen." };
  }
  try {
    const candidates = await identifyPlantPhoto(file);
    if (candidates.length === 0) {
      return {
        candidates: [],
        error: "Keine passende Art gefunden. Bitte ein anderes Foto versuchen.",
      };
    }
    return { candidates };
  } catch (e) {
    return {
      candidates: [],
      error: e instanceof Error ? e.message : "Unbekannter Fehler bei der Erkennung.",
    };
  }
}

export async function findExistingPlant(scientificName: string) {
  const [plant] = await db
    .select()
    .from(plants)
    .where(ilike(plants.scientificName, scientificName))
    .limit(1);

  if (!plant) return null;

  const assignedZones = await db
    .select({ id: zones.id, name: zones.name })
    .from(plantZoneAssignments)
    .innerJoin(zones, eq(plantZoneAssignments.zoneId, zones.id))
    .where(eq(plantZoneAssignments.plantId, plant.id));

  return { plant, assignedZones };
}

export async function createPlantAndAssign(input: {
  scientificName: string;
  commonName?: string;
  zoneId: number;
}) {
  const [plant] = await db
    .insert(plants)
    .values({
      scientificName: input.scientificName,
      commonName: input.commonName || null,
      enrichmentStatus: "pending",
    })
    .returning();

  await db.insert(plantZoneAssignments).values({
    plantId: plant.id,
    zoneId: input.zoneId,
  });

  after(() => enrichPlant(plant.id));

  revalidatePath("/pflanzen");
  revalidatePath("/");
  return plant;
}

export async function addZoneAssignment(plantId: number, zoneId: number) {
  await db
    .insert(plantZoneAssignments)
    .values({ plantId, zoneId })
    .onConflictDoNothing();
  revalidatePath("/pflanzen");
  revalidatePath(`/pflanzen/${plantId}`);
}

export async function removeZoneAssignment(plantId: number, zoneId: number) {
  await db
    .delete(plantZoneAssignments)
    .where(
      and(
        eq(plantZoneAssignments.plantId, plantId),
        eq(plantZoneAssignments.zoneId, zoneId),
      ),
    );
  revalidatePath("/pflanzen");
  revalidatePath(`/pflanzen/${plantId}`);
}

export async function savePlantPhoto(
  plantId: number,
  blobUrl: string,
  isPrimary: boolean,
) {
  if (isPrimary) {
    await db
      .update(plantPhotos)
      .set({ isPrimary: false })
      .where(eq(plantPhotos.plantId, plantId));
  }
  await db.insert(plantPhotos).values({ plantId, blobUrl, isPrimary });
  revalidatePath(`/pflanzen/${plantId}`);
  revalidatePath("/pflanzen");
}

export async function addNote(plantId: number, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await db.insert(plantNotes).values({ plantId, text: trimmed });
  revalidatePath(`/pflanzen/${plantId}`);
}

export async function deleteNote(noteId: number, plantId: number) {
  await db.delete(plantNotes).where(eq(plantNotes.id, noteId));
  revalidatePath(`/pflanzen/${plantId}`);
}

export async function waterPlant(plantId: number) {
  await db
    .update(plants)
    .set({ lastWateredAt: new Date(), updatedAt: new Date() })
    .where(eq(plants.id, plantId));
  revalidatePath(`/pflanzen/${plantId}`);
  revalidatePath("/pflanzen");
  revalidatePath("/");
}

export async function deletePlant(plantId: number) {
  const photos = await db
    .select({ blobUrl: plantPhotos.blobUrl })
    .from(plantPhotos)
    .where(eq(plantPhotos.plantId, plantId));

  if (photos.length > 0) {
    await del(photos.map((p) => p.blobUrl)).catch(() => {});
  }

  await db.delete(plants).where(eq(plants.id, plantId));

  revalidatePath("/pflanzen");
  revalidatePath("/");
}

export async function retryEnrichment(plantId: number) {
  await db
    .update(plants)
    .set({ enrichmentStatus: "pending", enrichmentError: null })
    .where(eq(plants.id, plantId));
  revalidatePath(`/pflanzen/${plantId}`);
  after(() => enrichPlant(plantId));
}
