"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { del } from "@vercel/blob";
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

export async function addHeroImage(url: string): Promise<HeroPhoto> {
  const db = getDb();
  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${heroImages.orderIndex}), -1)` })
    .from(heroImages);
  const [row] = await db
    .insert(heroImages)
    .values({ blobUrl: url, orderIndex: maxOrder + 1 })
    .returning({ id: heroImages.id, blobUrl: heroImages.blobUrl });
  revalidatePath("/");
  return row;
}

export async function deleteHeroImage(id: number) {
  const db = getDb();
  const [row] = await db
    .select({ blobUrl: heroImages.blobUrl })
    .from(heroImages)
    .where(eq(heroImages.id, id))
    .limit(1);
  if (!row) return;

  await db.delete(heroImages).where(eq(heroImages.id, id));
  await del(row.blobUrl).catch(() => {});
  revalidatePath("/");
}

export async function getPlantsHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.plantsHeroImageUrl ?? null;
}

export async function setPlantsHeroImage(url: string) {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.plantsHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .insert(settings)
    .values({ id: 1, plantsHeroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { plantsHeroImageUrl: url, updatedAt: new Date() },
    });

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/pflanzen");
}

export async function clearPlantsHeroImage() {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.plantsHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .update(settings)
    .set({ plantsHeroImageUrl: null, updatedAt: new Date() })
    .where(eq(settings.id, 1));

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/pflanzen");
}

export async function getAnimalsHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.animalsHeroImageUrl ?? null;
}

export async function setAnimalsHeroImage(url: string) {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.animalsHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .insert(settings)
    .values({ id: 1, animalsHeroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { animalsHeroImageUrl: url, updatedAt: new Date() },
    });

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/tiere");
}

export async function clearAnimalsHeroImage() {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.animalsHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .update(settings)
    .set({ animalsHeroImageUrl: null, updatedAt: new Date() })
    .where(eq(settings.id, 1));

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/tiere");
}

export async function getZonesHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.zonesHeroImageUrl ?? null;
}

export async function setZonesHeroImage(url: string) {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.zonesHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .insert(settings)
    .values({ id: 1, zonesHeroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { zonesHeroImageUrl: url, updatedAt: new Date() },
    });

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/zonen");
}

export async function clearZonesHeroImage() {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.zonesHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .update(settings)
    .set({ zonesHeroImageUrl: null, updatedAt: new Date() })
    .where(eq(settings.id, 1));

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/zonen");
}

export async function getBesonderheitenHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.besonderheitenHeroImageUrl ?? null;
}

export async function setBesonderheitenHeroImage(url: string) {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.besonderheitenHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .insert(settings)
    .values({ id: 1, besonderheitenHeroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { besonderheitenHeroImageUrl: url, updatedAt: new Date() },
    });

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/besonderheiten");
}

export async function clearBesonderheitenHeroImage() {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.besonderheitenHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .update(settings)
    .set({ besonderheitenHeroImageUrl: null, updatedAt: new Date() })
    .where(eq(settings.id, 1));

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/besonderheiten");
}

export async function getWetterHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.wetterHeroImageUrl ?? null;
}

export async function setWetterHeroImage(url: string) {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.wetterHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .insert(settings)
    .values({ id: 1, wetterHeroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { wetterHeroImageUrl: url, updatedAt: new Date() },
    });

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/wetter");
}

export async function clearWetterHeroImage() {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.wetterHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .update(settings)
    .set({ wetterHeroImageUrl: null, updatedAt: new Date() })
    .where(eq(settings.id, 1));

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/wetter");
}

export async function getPlantDocHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.plantDocHeroImageUrl ?? null;
}

export async function setPlantDocHeroImage(url: string) {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.plantDocHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .insert(settings)
    .values({ id: 1, plantDocHeroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { plantDocHeroImageUrl: url, updatedAt: new Date() },
    });

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/plant-doc");
}

export async function clearPlantDocHeroImage() {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.plantDocHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .update(settings)
    .set({ plantDocHeroImageUrl: null, updatedAt: new Date() })
    .where(eq(settings.id, 1));

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/plant-doc");
}

export async function getDiversHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.diversHeroImageUrl ?? null;
}

export async function setDiversHeroImage(url: string) {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.diversHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .insert(settings)
    .values({ id: 1, diversHeroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { diversHeroImageUrl: url, updatedAt: new Date() },
    });

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/divers");
}

export async function clearDiversHeroImage() {
  const db = getDb();
  const [existing] = await db
    .select({ url: settings.diversHeroImageUrl })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);

  await db
    .update(settings)
    .set({ diversHeroImageUrl: null, updatedAt: new Date() })
    .where(eq(settings.id, 1));

  if (existing?.url) await del(existing.url).catch(() => {});
  revalidatePath("/divers");
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
  revalidatePath("/tiere");
  revalidatePath("/tiere/neu");
  revalidatePath("/zonen");
  revalidatePath("/wetter");
}
