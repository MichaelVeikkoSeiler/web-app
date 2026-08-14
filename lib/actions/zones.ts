"use server";

import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { zones, zonePhotos, zoneNotes } from "@/lib/db/schema";

const zoneSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
  light: z.enum(["schattig", "halbschattig", "sonnig"]),
  orientation: z.enum(["N", "O", "S", "W"]),
  soilType: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ZoneInput = z.infer<typeof zoneSchema>;

export async function createZone(input: ZoneInput) {
  const data = zoneSchema.parse(input);
  const db = getDb();
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${zones.orderIndex}), -1)` })
    .from(zones);

  const [zone] = await db
    .insert(zones)
    .values({
      name: data.name,
      light: data.light,
      orientation: data.orientation,
      soilType: data.soilType || null,
      notes: data.notes || null,
      orderIndex: maxOrder + 1,
    })
    .returning();
  revalidatePath("/zonen");
  revalidatePath("/pflanzen");
  revalidatePath("/pflanzen/neu");
  return zone;
}

export async function updateZone(id: number, input: ZoneInput) {
  const data = zoneSchema.parse(input);
  const db = getDb();
  const [zone] = await db
    .update(zones)
    .set({
      name: data.name,
      light: data.light,
      orientation: data.orientation,
      soilType: data.soilType || null,
      notes: data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(zones.id, id))
    .returning();
  revalidatePath("/zonen");
  revalidatePath("/pflanzen");
  return zone;
}

export async function addZonePhoto(zoneId: number, blobUrl: string, isPrimary: boolean) {
  const db = getDb();
  if (isPrimary) {
    await db.update(zonePhotos).set({ isPrimary: false }).where(eq(zonePhotos.zoneId, zoneId));
  }
  await db.insert(zonePhotos).values({ zoneId, blobUrl, isPrimary });
  revalidatePath("/zonen");
  revalidatePath(`/zonen/${zoneId}`);
  revalidatePath("/pflanzen");
  revalidatePath("/pflanzen/neu");
}

export async function deleteZonePhoto(photoId: number, zoneId: number) {
  const db = getDb();
  const [photo] = await db
    .select()
    .from(zonePhotos)
    .where(eq(zonePhotos.id, photoId))
    .limit(1);
  if (!photo) return;

  await db.delete(zonePhotos).where(eq(zonePhotos.id, photoId));
  await del(photo.blobUrl).catch(() => {});

  if (photo.isPrimary) {
    const [next] = await db
      .select({ id: zonePhotos.id })
      .from(zonePhotos)
      .where(eq(zonePhotos.zoneId, zoneId))
      .limit(1);
    if (next) {
      await db.update(zonePhotos).set({ isPrimary: true }).where(eq(zonePhotos.id, next.id));
    }
  }

  revalidatePath("/zonen");
  revalidatePath(`/zonen/${zoneId}`);
  revalidatePath("/pflanzen");
  revalidatePath("/pflanzen/neu");
}

export async function deleteZone(id: number) {
  const db = getDb();
  const photos = await db
    .select({ blobUrl: zonePhotos.blobUrl })
    .from(zonePhotos)
    .where(eq(zonePhotos.zoneId, id));

  await db.delete(zones).where(eq(zones.id, id));

  if (photos.length > 0) {
    await del(photos.map((p) => p.blobUrl)).catch(() => {});
  }

  revalidatePath("/zonen");
  revalidatePath("/pflanzen");
}

export async function addZoneNote(zoneId: number, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await getDb().insert(zoneNotes).values({ zoneId, text: trimmed });
  revalidatePath(`/zonen/${zoneId}`);
  revalidatePath("/");
}

export async function deleteZoneNote(zoneId: number, noteId: number) {
  await getDb().delete(zoneNotes).where(eq(zoneNotes.id, noteId));
  revalidatePath(`/zonen/${zoneId}`);
  revalidatePath("/");
}

export async function reorderZones(orderedIds: number[]) {
  const db = getDb();
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(zones).set({ orderIndex: index }).where(eq(zones.id, id)),
    ),
  );
  revalidatePath("/zonen");
}
