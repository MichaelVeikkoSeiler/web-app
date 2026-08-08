"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { zones } from "@/lib/db/schema";

const zoneSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich"),
  number: z.coerce.number().int().optional().nullable(),
  light: z.enum(["schattig", "halbschattig", "sonnig"]),
  orientation: z.enum(["N", "O", "S", "W"]),
  soilType: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ZoneInput = z.infer<typeof zoneSchema>;

export async function createZone(input: ZoneInput) {
  const data = zoneSchema.parse(input);
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${zones.orderIndex}), -1)` })
    .from(zones);

  const [zone] = await db
    .insert(zones)
    .values({
      name: data.name,
      number: data.number ?? null,
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
  const [zone] = await db
    .update(zones)
    .set({
      name: data.name,
      number: data.number ?? null,
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

export async function deleteZone(id: number) {
  await db.delete(zones).where(eq(zones.id, id));
  revalidatePath("/zonen");
  revalidatePath("/pflanzen");
}

export async function reorderZones(orderedIds: number[]) {
  await Promise.all(
    orderedIds.map((id, index) =>
      db.update(zones).set({ orderIndex: index }).where(eq(zones.id, id)),
    ),
  );
  revalidatePath("/zonen");
}
