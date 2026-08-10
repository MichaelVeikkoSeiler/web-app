import { desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, zones, plantZoneAssignments, plantDocCases } from "@/lib/db/schema";
import { getWeatherSnapshot, getWeatherHistory } from "@/lib/openmeteo";
import type { PlantDocContext } from "@/lib/plant-doc-types";

/**
 * Sammelt für Plant Doc alle tatsächlich vorhandenen Kontextdaten zu einer
 * Pflanze (keine erfundenen/geschätzten Werte). Wird vor der KI-Analyse
 * einmalig als Snapshot gespeichert.
 */
export async function gatherPlantDocContext(plantId: number): Promise<PlantDocContext> {
  if (!isDbConfigured) {
    throw new Error("Keine Datenbank konfiguriert.");
  }

  const db = getDb();

  const [[plant], zoneRows, previousCaseRows, weatherSnapshot, weatherHistory] =
    await Promise.all([
      db.select().from(plants).where(eq(plants.id, plantId)).limit(1),
      db
        .select({
          name: zones.name,
          light: zones.light,
          orientation: zones.orientation,
          soilType: zones.soilType,
          notes: zones.notes,
        })
        .from(plantZoneAssignments)
        .innerJoin(zones, eq(plantZoneAssignments.zoneId, zones.id))
        .where(eq(plantZoneAssignments.plantId, plantId)),
      db
        .select({
          createdAt: plantDocCases.createdAt,
          primaryCause: plantDocCases.primaryCause,
          status: plantDocCases.status,
        })
        .from(plantDocCases)
        .where(eq(plantDocCases.plantId, plantId))
        .orderBy(desc(plantDocCases.createdAt))
        .limit(5),
      getWeatherSnapshot().catch(() => null),
      getWeatherHistory(14).catch(() => null),
    ]);

  if (!plant) {
    throw new Error("Pflanze nicht gefunden.");
  }

  return {
    plant: {
      scientificName: plant.scientificName,
      germanName: plant.germanName,
      commonName: plant.commonName,
      wateringRhythmDays: plant.wateringRhythmDays,
      wateringNotes: plant.wateringNotes,
      lastWateredAt: plant.lastWateredAt ? plant.lastWateredAt.toISOString() : null,
      bloomPeriodText: plant.bloomPeriodText,
      pruningPeriodText: plant.pruningPeriodText,
      lastPrunedAt: plant.lastPrunedAt ? plant.lastPrunedAt.toISOString() : null,
      fertilizingPeriodText: plant.fertilizingPeriodText,
      lastFertilizedAt: plant.lastFertilizedAt ? plant.lastFertilizedAt.toISOString() : null,
      isFruitOrBerry: plant.isFruitOrBerry,
    },
    zones: zoneRows,
    weather:
      weatherSnapshot && weatherHistory
        ? {
            last14Days: weatherHistory,
            precipitationLast7Days: weatherSnapshot.precipitationLast7Days,
          }
        : null,
    previousCases: previousCaseRows.map((c) => ({
      date: c.createdAt.toISOString(),
      primaryCause: c.primaryCause,
      status: c.status,
    })),
  };
}
