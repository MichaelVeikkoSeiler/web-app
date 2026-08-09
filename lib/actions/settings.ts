"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { settings, heroImages } from "@/lib/db/schema";

export async function getSiteSettings(): Promise<{
  heroImageUrl: string | null;
  logoUrl: string | null;
}> {
  if (!isDbConfigured) return { heroImageUrl: null, logoUrl: null };
  const [row] = await getDb().select().from(settings).limit(1);
  return {
    heroImageUrl: row?.heroImageUrl ?? null,
    logoUrl: row?.logoUrl ?? null,
  };
}

export type HeroPhoto = { id: number; blobUrl: string };

export async function getHeroImages(): Promise<HeroPhoto[]> {
  if (!isDbConfigured) return [];
  const rows = await getDb()
    .select({ id: heroImages.id, blobUrl: heroImages.blobUrl })
    .from(heroImages)
    .orderBy(heroImages.orderIndex);
  return rows;
}

export async function addHeroImage(url: string) {
  const db = getDb();
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${heroImages.orderIndex}), -1)` })
    .from(heroImages);
  await db.insert(heroImages).values({ blobUrl: url, orderIndex: maxOrder + 1 });
  revalidatePath("/");
}

export async function getPlantsHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.plantsHeroImageUrl ?? null;
}

export async function setPlantsHeroImage(url: string) {
  await getDb()
    .insert(settings)
    .values({ id: 1, plantsHeroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { plantsHeroImageUrl: url, updatedAt: new Date() },
    });
  revalidatePath("/pflanzen");
}

export async function getZonesHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.zonesHeroImageUrl ?? null;
}

export async function setZonesHeroImage(url: string) {
  await getDb()
    .insert(settings)
    .values({ id: 1, zonesHeroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { zonesHeroImageUrl: url, updatedAt: new Date() },
    });
  revalidatePath("/zonen");
}

export async function setLogoImage(url: string) {
  await getDb()
    .insert(settings)
    .values({ id: 1, logoUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { logoUrl: url, updatedAt: new Date() },
    });
  revalidatePath("/");
  revalidatePath("/pflanzen");
  revalidatePath("/pflanzen/neu");
  revalidatePath("/zonen");
  revalidatePath("/wetter");
}
