import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos, plantZoneAssignments, zones } from "@/lib/db/schema";
import { isMonthInRange } from "@/lib/date-utils";
import { computeHelpFlags } from "@/lib/help-logic";
import { getWeatherSnapshot } from "@/lib/openmeteo";
import type { PlantCardData } from "@/components/plants/plant-card";

export async function getPlantCards(): Promise<PlantCardData[]> {
  if (!isDbConfigured) return [];

  const db = getDb();
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

export type TodoItem = {
  plantId: number;
  plantName: string;
  type: "water" | "prune" | "fertilize";
  label: string;
};

export async function getTodoItems(): Promise<TodoItem[]> {
  if (!isDbConfigured) return [];

  const db = getDb();
  const [allPlants, weather] = await Promise.all([
    db.select().from(plants),
    getWeatherSnapshot().catch(() => null),
  ]);
  const precipitation = weather?.precipitationLast7Days ?? Infinity;
  const now = new Date();

  const items: TodoItem[] = [];
  for (const plant of allPlants) {
    const help = computeHelpFlags(plant, precipitation, now);
    const plantName = plant.germanName ?? plant.scientificName;
    if (help.needsWater) {
      items.push({ plantId: plant.id, plantName, type: "water", label: "Giessen" });
    }
    if (help.needsPruning) {
      items.push({ plantId: plant.id, plantName, type: "prune", label: "Rückschnitt" });
    }
    if (help.needsFertilizing) {
      items.push({ plantId: plant.id, plantName, type: "fertilize", label: "Düngen" });
    }
  }
  return items;
}
