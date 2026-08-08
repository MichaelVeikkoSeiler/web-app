"use server";

import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/lib/db";
import { settings } from "@/lib/db/schema";

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

export async function getHeroImageUrl(): Promise<string | null> {
  if (!isDbConfigured) return null;
  const [row] = await getDb().select().from(settings).limit(1);
  return row?.heroImageUrl ?? null;
}

export async function setHeroImage(url: string) {
  await getDb()
    .insert(settings)
    .values({ id: 1, heroImageUrl: url })
    .onConflictDoUpdate({
      target: settings.id,
      set: { heroImageUrl: url, updatedAt: new Date() },
    });
  revalidatePath("/");
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
