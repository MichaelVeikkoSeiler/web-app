import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { plants, plantPhotos, plantZoneAssignments, zones } from "@/lib/db/schema";
import { isMonthInRange } from "@/lib/date-utils";
import { computeHelpFlags } from "@/lib/help-logic";
import { getWeatherSnapshot } from "@/lib/openmeteo";
import type { PlantCardData } from "@/components/plants/plant-card";

export async function getPlantCards(): Promise<PlantCardData[]> {
  const [allPlants, assignments, photos, weather] = await Promise.all([
    db.select().from(plants),
    db
      .select({ plantId: plantZoneAssignments.plantId, zoneName: zones.name })
      .from(plantZoneAssignments)
      .innerJoin(zones, eq(plantZoneAssignments.zoneId, zones.id)),
    db.select().from(plantPhotos).where(eq(plantPhotos.isPrimary, true)),
    getWeatherSnapshot().catch(() => null),
  ]);

  const zoneNamesByPlant = new Map<number, string[]>();
  for (const a of assignments) {
    const list = zoneNamesByPlant.get(a.plantId) ?? [];
    list.push(a.zoneName);
    zoneNamesByPlant.set(a.plantId, list);
  }

  const photoByPlant = new Map<number, string>();
  for (const p of photos) {
    if (!photoByPlant.has(p.plantId)) photoByPlant.set(p.plantId, p.blobUrl);
  }

  const currentMonth = new Date().getMonth() + 1;
  const precipitation = weather?.precipitationLast7Days ?? Infinity;

  return allPlants.map((plant) => {
    const help = computeHelpFlags(plant, precipitation);
    return {
      id: plant.id,
      scientificName: plant.scientificName,
      germanName: plant.germanName,
      commonName: plant.commonName,
      photoUrl: photoByPlant.get(plant.id) ?? null,
      zoneNames: zoneNamesByPlant.get(plant.id) ?? [],
      inBloom: isMonthInRange(currentMonth, plant.bloomStartMonth, plant.bloomEndMonth),
      canHarvest:
        plant.isFruitOrBerry &&
        isMonthInRange(currentMonth, plant.harvestStartMonth, plant.harvestEndMonth),
      needsHelp: help.needsHelp,
    };
  });
}
