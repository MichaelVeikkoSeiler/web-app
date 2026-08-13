"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { del } from "@vercel/blob";
import { eq, ilike, and, inArray } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantZoneAssignments, plantPhotos, plantNotes, zones } from "@/lib/db/schema";
import { identifyPlantPhoto, type PlantNetCandidate } from "@/lib/plantnet";
import { identifyPlantPhotoWithVision } from "@/lib/plant-vision-id";
import { enrichPlant } from "@/lib/enrichment";
import { checkZoneConflict } from "@/lib/conflict-analysis";

export async function identifyPlant(formData: FormData): Promise<{
  candidates: PlantNetCandidate[];
  error?: string;
}> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { candidates: [], error: "Kein Foto empfangen." };
  }

  let candidates: PlantNetCandidate[] = [];
  let plantNetError: string | null = null;
  try {
    candidates = await identifyPlantPhoto(file);
  } catch (e) {
    plantNetError = e instanceof Error ? e.message : "Unbekannter Fehler bei der Erkennung.";
  }

  if (candidates.length === 0) {
    // PlantNet hat nichts gefunden oder ist ausgefallen -> KI-Bilderkennung als Fallback versuchen.
    const aiCandidates = await identifyPlantPhotoWithVision(file).catch(() => []);
    if (aiCandidates.length > 0) {
      return { candidates: aiCandidates };
    }
    return {
      candidates: [],
      error: plantNetError ?? "Keine passende Art gefunden. Bitte Art manuell suchen.",
    };
  }

  return { candidates };
}

export async function findExistingPlant(scientificName: string) {
  if (!isDbConfigured) return null;
  const db = getDb();
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
  zoneIds: number[];
}) {
  const db = getDb();
  const [plant] = await db
    .insert(plants)
    .values({
      scientificName: input.scientificName,
      commonName: input.commonName || null,
      enrichmentStatus: "pending",
    })
    .returning();

  if (input.zoneIds.length > 0) {
    await db
      .insert(plantZoneAssignments)
      .values(input.zoneIds.map((zoneId) => ({ plantId: plant.id, zoneId })));
    await db
      .update(zones)
      .set({ conflictStatus: "pending" })
      .where(inArray(zones.id, input.zoneIds));
    for (const zoneId of input.zoneIds) {
      after(() => checkZoneConflict(zoneId));
    }
  }

  after(() => enrichPlant(plant.id));

  revalidatePath("/pflanzen");
  revalidatePath("/zonen");
  revalidatePath("/");
  return plant;
}

export async function addZoneAssignment(plantId: number, zoneId: number) {
  const db = getDb();
  await db
    .insert(plantZoneAssignments)
    .values({ plantId, zoneId })
    .onConflictDoNothing();
  await db.update(zones).set({ conflictStatus: "pending" }).where(eq(zones.id, zoneId));
  after(() => checkZoneConflict(zoneId));
  revalidatePath("/pflanzen");
  revalidatePath(`/pflanzen/${plantId}`);
  revalidatePath("/zonen");
  revalidatePath(`/zonen/${zoneId}`);
}

export async function addZoneAssignments(plantId: number, zoneIds: number[]) {
  if (zoneIds.length === 0) return;
  const db = getDb();
  await db
    .insert(plantZoneAssignments)
    .values(zoneIds.map((zoneId) => ({ plantId, zoneId })))
    .onConflictDoNothing();
  await db.update(zones).set({ conflictStatus: "pending" }).where(inArray(zones.id, zoneIds));
  for (const zoneId of zoneIds) {
    after(() => checkZoneConflict(zoneId));
  }
  revalidatePath("/pflanzen");
  revalidatePath(`/pflanzen/${plantId}`);
  revalidatePath("/zonen");
  for (const zoneId of zoneIds) {
    revalidatePath(`/zonen/${zoneId}`);
  }
}

export async function removeZoneAssignment(plantId: number, zoneId: number) {
  const db = getDb();
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
  const db = getDb();
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

export async function deletePlantPhoto(photoId: number, plantId: number) {
  const db = getDb();
  const [photo] = await db
    .select()
    .from(plantPhotos)
    .where(eq(plantPhotos.id, photoId))
    .limit(1);
  if (!photo) return;

  await db.delete(plantPhotos).where(eq(plantPhotos.id, photoId));
  await del(photo.blobUrl).catch(() => {});

  if (photo.isPrimary) {
    const [next] = await db
      .select({ id: plantPhotos.id })
      .from(plantPhotos)
      .where(eq(plantPhotos.plantId, plantId))
      .limit(1);
    if (next) {
      await db.update(plantPhotos).set({ isPrimary: true }).where(eq(plantPhotos.id, next.id));
    }
  }

  revalidatePath(`/pflanzen/${plantId}`);
  revalidatePath("/pflanzen");
  revalidatePath("/");
}

export async function addNote(plantId: number, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await getDb().insert(plantNotes).values({ plantId, text: trimmed });
  revalidatePath(`/pflanzen/${plantId}`);
}

export async function deleteNote(noteId: number, plantId: number) {
  await getDb().delete(plantNotes).where(eq(plantNotes.id, noteId));
  revalidatePath(`/pflanzen/${plantId}`);
}

export async function waterPlant(plantId: number) {
  const db = getDb();
  await db
    .update(plants)
    .set({ lastWateredAt: new Date(), updatedAt: new Date() })
    .where(eq(plants.id, plantId));
  revalidatePath(`/pflanzen/${plantId}`);
  revalidatePath("/pflanzen");
  revalidatePath("/");
}

export async function markPruned(plantId: number) {
  const db = getDb();
  await db
    .update(plants)
    .set({ lastPrunedAt: new Date(), updatedAt: new Date() })
    .where(eq(plants.id, plantId));
  revalidatePath(`/pflanzen/${plantId}`);
  revalidatePath("/pflanzen");
  revalidatePath("/");
}

export async function markFertilized(plantId: number) {
  const db = getDb();
  await db
    .update(plants)
    .set({ lastFertilizedAt: new Date(), updatedAt: new Date() })
    .where(eq(plants.id, plantId));
  revalidatePath(`/pflanzen/${plantId}`);
  revalidatePath("/pflanzen");
  revalidatePath("/");
}

export async function deletePlant(plantId: number) {
  const db = getDb();
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

export async function searchSpecies(query: string): Promise<{ scientificName: string }[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  try {
    const url = `https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(trimmed)}&rank=SPECIES&limit=8`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{
      canonicalName?: string;
      kingdom?: string;
    }>;

    const names: string[] = [];
    const seen = new Set<string>();
    for (const item of data) {
      if (!item.canonicalName) continue;
      if (item.kingdom && item.kingdom !== "Plantae") continue;
      if (seen.has(item.canonicalName)) continue;
      seen.add(item.canonicalName);
      names.push(item.canonicalName);
    }
    return names.map((scientificName) => ({ scientificName }));
  } catch {
    return [];
  }
}

export async function correctPlantSpecies(
  plantId: number,
  scientificName: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = scientificName.trim();
  if (!trimmed) return { ok: false, error: "Bitte eine Pflanzenart auswählen." };

  const db = getDb();
  try {
    await db
      .update(plants)
      .set({
        scientificName: trimmed,
        germanName: null,
        commonName: null,
        factsText: null,
        isFruitOrBerry: false,
        bloomPeriodText: null,
        bloomStartMonth: null,
        bloomEndMonth: null,
        harvestPeriodText: null,
        harvestStartMonth: null,
        harvestEndMonth: null,
        pruningPeriodText: null,
        pruningStartMonth: null,
        pruningEndMonth: null,
        fertilizingPeriodText: null,
        fertilizingStartMonth: null,
        fertilizingEndMonth: null,
        wateringRhythmDays: null,
        wateringNotes: null,
        enrichmentStatus: "pending",
        enrichmentError: null,
        updatedAt: new Date(),
      })
      .where(eq(plants.id, plantId));
  } catch {
    return { ok: false, error: "Diese Pflanzenart ist bereits erfasst." };
  }

  revalidatePath(`/pflanzen/${plantId}`);
  revalidatePath("/pflanzen");
  revalidatePath("/");
  after(() => enrichPlant(plantId));
  return { ok: true };
}

export async function retryEnrichment(plantId: number) {
  const db = getDb();
  await db
    .update(plants)
    .set({ enrichmentStatus: "pending", enrichmentError: null })
    .where(eq(plants.id, plantId));
  revalidatePath(`/pflanzen/${plantId}`);
  after(() => enrichPlant(plantId));
}
