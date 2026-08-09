import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plants, plantPhotos, plantZoneAssignments, zones } from "@/lib/db/schema";
import { computeHelpFlags } from "@/lib/help-logic";
import { getWeatherSnapshot } from "@/lib/openmeteo";

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

export async function getPlantsGroupedByZone(): Promise<ZoneGroup[]> {
  if (!isDbConfigured) return [];

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

  return nonEmptyGroups;
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
