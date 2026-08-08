import { db } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { NewPlantWizard } from "@/components/plants/new-plant-wizard";

export default async function NeuePflanzePage() {
  const allZones = await db
    .select({ id: zones.id, name: zones.name })
    .from(zones)
    .orderBy(zones.name);

  return <NewPlantWizard zones={allZones} />;
}
