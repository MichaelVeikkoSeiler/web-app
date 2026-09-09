import { getDb, isDbConfigured } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { NewPlantWizard } from "@/components/plants/new-plant-wizard";
import { isDemoMode } from "@/lib/access-token";
import { redirect } from "next/navigation";

export default async function NeuePflanzePage({
  searchParams,
}: {
  searchParams: Promise<{ zoneId?: string; returnTo?: string }>;
}) {
  // Im Schaufenster gar nicht erst öffnen: Der Assistent würde beim ersten Foto
  // scheitern. Die Hinweisseite erklärt stattdessen, warum es hier nicht geht.
  if (isDemoMode()) redirect("/demo-hinweis");

  const { zoneId, returnTo } = await searchParams;
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
      returnTo={returnTo ?? null}
    />
  );
}
