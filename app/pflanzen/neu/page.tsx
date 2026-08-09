import { getDb, isDbConfigured } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { NewPlantWizard } from "@/components/plants/new-plant-wizard";

export default async function NeuePflanzePage({
  searchParams,
}: {
  searchParams: Promise<{ zoneId?: string }>;
}) {
  const { zoneId } = await searchParams;
  const allZones = isDbConfigured
    ? await getDb()
        .select({ id: zones.id, name: zones.name })
        .from(zones)
        .orderBy(zones.name)
    : [];

  const initialZoneId = zoneId ? Number(zoneId) : null;

  return (
    <NewPlantWizard
      zones={allZones}
      initialZoneId={Number.isFinite(initialZoneId) ? initialZoneId : null}
    />
  );
}
