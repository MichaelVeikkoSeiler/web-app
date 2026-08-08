import { db } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { getPlantCards } from "@/lib/plants-query";
import { PlantsOverview } from "@/components/plants/plants-overview";

export default async function PflanzenPage() {
  const [plantCards, allZones] = await Promise.all([
    getPlantCards(),
    db.select({ id: zones.id, name: zones.name }).from(zones).orderBy(zones.name),
  ]);

  return <PlantsOverview plants={plantCards} zones={allZones} />;
}
