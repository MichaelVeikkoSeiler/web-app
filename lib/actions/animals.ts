"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { del } from "@vercel/blob";
import { eq, ilike, and, sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { animals, animalZoneAssignments, animalPhotos, animalNotes, zones } from "@/lib/db/schema";
import { identifyAnimalPhotoWithVision, type AnimalCandidate } from "@/lib/animal-vision-id";
import { enrichAnimal } from "@/lib/animal-enrichment";

export async function identifyAnimal(formData: FormData): Promise<{
  candidates: AnimalCandidate[];
  error?: string;
}> {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { candidates: [], error: "Kein Foto empfangen." };
  }

  const candidates = await identifyAnimalPhotoWithVision(file).catch(() => []);
  if (candidates.length === 0) {
    return { candidates: [], error: "Keine passende Art gefunden. Bitte Art manuell suchen." };
  }
  return { candidates };
}

export async function findExistingAnimal(scientificName: string) {
  if (!isDbConfigured) return null;
  const db = getDb();
  const [animal] = await db
    .select()
    .from(animals)
    .where(ilike(animals.scientificName, scientificName))
    .limit(1);

  if (!animal) return null;

  const assignedZones = await db
    .select({ id: zones.id, name: zones.name })
    .from(animalZoneAssignments)
    .innerJoin(zones, eq(animalZoneAssignments.zoneId, zones.id))
    .where(eq(animalZoneAssignments.animalId, animal.id));

  return { animal, assignedZones };
}

export async function createAnimalAndAssign(input: {
  scientificName: string;
  commonName?: string;
  zoneIds: number[];
}) {
  const db = getDb();
  const [animal] = await db
    .insert(animals)
    .values({
      scientificName: input.scientificName,
      commonName: input.commonName || null,
      enrichmentStatus: "pending",
    })
    .returning();

  if (input.zoneIds.length > 0) {
    await db
      .insert(animalZoneAssignments)
      .values(input.zoneIds.map((zoneId) => ({ animalId: animal.id, zoneId })));
  }

  after(() => enrichAnimal(animal.id));

  revalidatePath("/tiere");
  revalidatePath("/zonen");
  revalidatePath("/");
  return animal;
}

export async function addZoneAssignmentsAnimal(animalId: number, zoneIds: number[]) {
  if (zoneIds.length === 0) return;
  const db = getDb();
  await db
    .insert(animalZoneAssignments)
    .values(zoneIds.map((zoneId) => ({ animalId, zoneId })))
    .onConflictDoNothing();
  revalidatePath("/tiere");
  revalidatePath(`/tiere/${animalId}`);
  revalidatePath("/zonen");
  for (const zoneId of zoneIds) {
    revalidatePath(`/zonen/${zoneId}`);
  }
}

export async function removeZoneAssignmentAnimal(animalId: number, zoneId: number) {
  const db = getDb();
  await db
    .delete(animalZoneAssignments)
    .where(
      and(
        eq(animalZoneAssignments.animalId, animalId),
        eq(animalZoneAssignments.zoneId, zoneId),
      ),
    );
  revalidatePath("/tiere");
  revalidatePath(`/tiere/${animalId}`);
}

export async function saveAnimalPhoto(animalId: number, blobUrl: string, isPrimary: boolean) {
  const db = getDb();
  if (isPrimary) {
    await db.update(animalPhotos).set({ isPrimary: false }).where(eq(animalPhotos.animalId, animalId));
  }
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${animalPhotos.orderIndex}), -1)` })
    .from(animalPhotos)
    .where(eq(animalPhotos.animalId, animalId));
  await db.insert(animalPhotos).values({ animalId, blobUrl, isPrimary, orderIndex: maxOrder + 1 });
  revalidatePath(`/tiere/${animalId}`);
  revalidatePath("/tiere");
}

export async function setAnimalPhotoTakenAt(animalId: number, photoId: number, takenAt: Date) {
  await getDb()
    .update(animalPhotos)
    .set({ takenAt })
    .where(eq(animalPhotos.id, photoId));
  revalidatePath(`/tiere/${animalId}`);
}

export async function deleteAnimalPhoto(photoId: number, animalId: number) {
  const db = getDb();
  const [photo] = await db
    .select()
    .from(animalPhotos)
    .where(eq(animalPhotos.id, photoId))
    .limit(1);
  if (!photo) return;

  await db.delete(animalPhotos).where(eq(animalPhotos.id, photoId));
  await del(photo.blobUrl).catch(() => {});

  if (photo.isPrimary) {
    const [next] = await db
      .select({ id: animalPhotos.id })
      .from(animalPhotos)
      .where(eq(animalPhotos.animalId, animalId))
      .orderBy(animalPhotos.orderIndex)
      .limit(1);
    if (next) {
      await db.update(animalPhotos).set({ isPrimary: true }).where(eq(animalPhotos.id, next.id));
    }
  }

  revalidatePath(`/tiere/${animalId}`);
  revalidatePath("/tiere");
  revalidatePath("/");
}

export async function reorderAnimalPhotos(animalId: number, orderedPhotoIds: number[]) {
  const db = getDb();
  await Promise.all(
    orderedPhotoIds.map((photoId, index) =>
      db
        .update(animalPhotos)
        .set({ orderIndex: index, isPrimary: index === 0 })
        .where(eq(animalPhotos.id, photoId)),
    ),
  );
  revalidatePath(`/tiere/${animalId}`);
  revalidatePath("/tiere");
  revalidatePath("/");
}

export async function addAnimalNote(animalId: number, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await getDb().insert(animalNotes).values({ animalId, text: trimmed });
  revalidatePath(`/tiere/${animalId}`);
  revalidatePath("/");
}

export async function deleteAnimalNote(animalId: number, noteId: number) {
  await getDb().delete(animalNotes).where(eq(animalNotes.id, noteId));
  revalidatePath(`/tiere/${animalId}`);
  revalidatePath("/");
}

export async function deleteAnimal(animalId: number) {
  const db = getDb();
  const photos = await db
    .select({ blobUrl: animalPhotos.blobUrl })
    .from(animalPhotos)
    .where(eq(animalPhotos.animalId, animalId));

  if (photos.length > 0) {
    await del(photos.map((p) => p.blobUrl)).catch(() => {});
  }

  await db.delete(animals).where(eq(animals.id, animalId));

  revalidatePath("/tiere");
  revalidatePath("/");
}

export async function searchSpeciesAnimal(query: string): Promise<{ scientificName: string }[]> {
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
      if (item.kingdom && item.kingdom !== "Animalia") continue;
      if (seen.has(item.canonicalName)) continue;
      seen.add(item.canonicalName);
      names.push(item.canonicalName);
    }
    return names.map((scientificName) => ({ scientificName }));
  } catch {
    return [];
  }
}

export async function correctAnimalSpecies(
  animalId: number,
  scientificName: string,
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = scientificName.trim();
  if (!trimmed) return { ok: false, error: "Bitte eine Tierart auswählen." };

  const db = getDb();
  try {
    await db
      .update(animals)
      .set({
        scientificName: trimmed,
        germanName: null,
        commonName: null,
        factsText: null,
        enrichmentStatus: "pending",
        enrichmentError: null,
        updatedAt: new Date(),
      })
      .where(eq(animals.id, animalId));
  } catch {
    return { ok: false, error: "Diese Tierart ist bereits erfasst." };
  }

  revalidatePath(`/tiere/${animalId}`);
  revalidatePath("/tiere");
  revalidatePath("/");
  after(() => enrichAnimal(animalId));
  return { ok: true };
}

export async function retryAnimalEnrichment(animalId: number) {
  const db = getDb();
  await db
    .update(animals)
    .set({ enrichmentStatus: "pending", enrichmentError: null })
    .where(eq(animals.id, animalId));
  revalidatePath(`/tiere/${animalId}`);
  after(() => enrichAnimal(animalId));
}
