import { getDb, isDbConfigured } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { NewAnimalWizard } from "@/components/animals/new-animal-wizard";

export default async function NeuesTierPage({
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
    <NewAnimalWizard
      zones={allZones}
      initialZoneId={Number.isFinite(initialZoneId) ? initialZoneId : null}
    />
  );
}
