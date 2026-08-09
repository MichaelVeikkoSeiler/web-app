import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos, plantZoneAssignments, zones } from "@/lib/db/schema";
import { computeHelpFlags } from "@/lib/help-logic";
import { getWeatherSnapshot } from "@/lib/openmeteo";
import { isMonthInRange, isTaskDueThisPeriod } from "@/lib/date-utils";

export type PlantListItem = {
  id: number;
  name: string;
  photoUrl: string | null;
};

export type ZoneGroup = {
  zoneId: number | null;
  zoneName: string;
  zoneImageUrl: string | null;
  plants: PlantListItem[];
};

export type PlantsOverviewData = {
  totalCount: number;
  groups: ZoneGroup[];
};

export async function getPlantsGroupedByZone(): Promise<PlantsOverviewData> {
  if (!isDbConfigured) return { totalCount: 0, groups: [] };

  const db = getDb();
  const [allPlants, allZones, assignments, photos] = await Promise.all([
    db.select().from(plants),
    db
      .select({ id: zones.id, name: zones.name, imageUrl: zones.imageUrl })
      .from(zones)
      .orderBy(zones.orderIndex),
    db
      .select({ plantId: plantZoneAssignments.plantId, zoneId: plantZoneAssignments.zoneId })
      .from(plantZoneAssignments),
    db.select().from(plantPhotos).where(eq(plantPhotos.isPrimary, true)),
  ]);

  const photoByPlant = new Map<number, string>();
  for (const p of photos) {
    if (!photoByPlant.has(p.plantId)) photoByPlant.set(p.plantId, p.blobUrl);
  }

  const zoneIdsByPlant = new Map<number, number[]>();
  for (const a of assignments) {
    const list = zoneIdsByPlant.get(a.plantId) ?? [];
    list.push(a.zoneId);
    zoneIdsByPlant.set(a.plantId, list);
  }

  function toListItem(plant: (typeof allPlants)[number]): PlantListItem {
    return {
      id: plant.id,
      name: plant.germanName ?? plant.scientificName,
      photoUrl: photoByPlant.get(plant.id) ?? null,
    };
  }

  const groups: ZoneGroup[] = allZones.map((z) => ({
    zoneId: z.id,
    zoneName: z.name,
    zoneImageUrl: z.imageUrl,
    plants: [],
  }));
  const groupByZoneId = new Map(groups.map((g) => [g.zoneId, g]));
  const unassigned: PlantListItem[] = [];

  for (const plant of allPlants) {
    const zoneIds = zoneIdsByPlant.get(plant.id) ?? [];
    if (zoneIds.length === 0) {
      unassigned.push(toListItem(plant));
      continue;
    }
    for (const zoneId of zoneIds) {
      groupByZoneId.get(zoneId)?.plants.push(toListItem(plant));
    }
  }

  for (const group of groups) {
    group.plants.sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  unassigned.sort((a, b) => a.name.localeCompare(b.name, "de"));

  const nonEmptyGroups = groups.filter((g) => g.plants.length > 0);
  if (unassigned.length > 0) {
    nonEmptyGroups.push({
      zoneId: null,
      zoneName: "Ohne Zone",
      zoneImageUrl: null,
      plants: unassigned,
    });
  }

  return { totalCount: allPlants.length, groups: nonEmptyGroups };
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

export type HighlightPlant = { plantId: number; plantName: string };

export type PlantHighlights = {
  mostFrequentWatering: (HighlightPlant & { rhythmDays: number })[];
  leastFrequentWatering: (HighlightPlant & { rhythmDays: number })[];
  bloomingThisMonth: HighlightPlant[];
  pruningThisMonth: HighlightPlant[];
};

export async function getPlantHighlights(): Promise<PlantHighlights> {
  if (!isDbConfigured) {
    return {
      mostFrequentWatering: [],
      leastFrequentWatering: [],
      bloomingThisMonth: [],
      pruningThisMonth: [],
    };
  }

  const db = getDb();
  const allPlants = await db.select().from(plants);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const withRhythm = allPlants.filter(
    (p): p is typeof p & { wateringRhythmDays: number } => p.wateringRhythmDays != null,
  );
  const minRhythm = withRhythm.length > 0 ? Math.min(...withRhythm.map((p) => p.wateringRhythmDays)) : null;
  const maxRhythm = withRhythm.length > 0 ? Math.max(...withRhythm.map((p) => p.wateringRhythmDays)) : null;

  function toHighlight(plant: (typeof allPlants)[number]): HighlightPlant {
    return { plantId: plant.id, plantName: plant.germanName ?? plant.scientificName };
  }

  const mostFrequentWatering = withRhythm
    .filter((p) => p.wateringRhythmDays === minRhythm)
    .map((p) => ({ ...toHighlight(p), rhythmDays: p.wateringRhythmDays }));

  const leastFrequentWatering = withRhythm
    .filter((p) => p.wateringRhythmDays === maxRhythm)
    .map((p) => ({ ...toHighlight(p), rhythmDays: p.wateringRhythmDays }));

  const bloomingThisMonth = allPlants
    .filter((p) => isMonthInRange(currentMonth, p.bloomStartMonth, p.bloomEndMonth))
    .map(toHighlight);

  const pruningThisMonth = allPlants
    .filter((p) => isTaskDueThisPeriod(now, p.pruningStartMonth, p.pruningEndMonth, p.lastPrunedAt))
    .map(toHighlight);

  for (const list of [mostFrequentWatering, leastFrequentWatering, bloomingThisMonth, pruningThisMonth]) {
    list.sort((a, b) => a.plantName.localeCompare(b.plantName, "de"));
  }

  return { mostFrequentWatering, leastFrequentWatering, bloomingThisMonth, pruningThisMonth };
}
