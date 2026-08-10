"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { zones, zoneSoilChecks } from "@/lib/db/schema";
import { evaluateSoilCheck } from "@/lib/soil-check-logic";
import type { SoilCheckAnswers } from "@/lib/soil-check-types";

function assertPlausibleAnswers(answers: SoilCheckAnswers) {
  if (!Number.isFinite(answers.ph) || answers.ph < 3 || answers.ph > 10) {
    throw new Error("pH-Wert ausserhalb des plausiblen Bereichs.");
  }
  const d = answers.drainage;
  if (!Number.isFinite(d.remainingLevelCm) || d.remainingLevelCm < 0 || d.remainingLevelCm > d.startLevelCm) {
    throw new Error("Wasserstand ausserhalb des plausiblen Bereichs.");
  }
  if (!Number.isFinite(d.elapsedMinutes) || d.elapsedMinutes < 0 || d.elapsedMinutes > 24 * 60) {
    throw new Error("Messdauer der Versickerung ist unplausibel.");
  }
}

export async function submitSoilCheck(zoneId: number, answers: SoilCheckAnswers): Promise<{ checkId: number }> {
  assertPlausibleAnswers(answers);

  const db = getDb();
  const profile = evaluateSoilCheck(answers);

  const [check] = await db
    .insert(zoneSoilChecks)
    .values({
      zoneId,
      answers,
      soilTexture: profile.soilTexture,
      phValue: profile.phValue,
      phClassification: profile.phClassification,
      drainageClass: profile.drainageClass,
      infiltrationCmPerHour: profile.infiltrationCmPerHour,
      waterRetentionClass: profile.waterRetentionClass,
      stoneContentClass: profile.stoneContentClass,
      organicMatterIndicator: profile.organicMatterIndicator,
      summaryText: profile.summaryText,
    })
    .returning({ id: zoneSoilChecks.id });

  // zones.soilType erst hier, nach erfolgreichem Speichern des Checks, synchronisieren.
  await db.update(zones).set({ soilType: profile.soilTexture, updatedAt: new Date() }).where(eq(zones.id, zoneId));

  revalidatePath(`/zonen/${zoneId}`);
  revalidatePath("/zonen");

  return { checkId: check.id };
}

export async function getLatestSoilCheck(zoneId: number) {
  if (!isDbConfigured) return null;
  const [row] = await getDb()
    .select()
    .from(zoneSoilChecks)
    .where(eq(zoneSoilChecks.zoneId, zoneId))
    .orderBy(desc(zoneSoilChecks.createdAt))
    .limit(1);
  return row ?? null;
}
