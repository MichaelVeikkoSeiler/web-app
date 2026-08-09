import { getPlantsGroupedByZone } from "@/lib/plants-query";
import { PlantsOverview } from "@/components/plants/plants-overview";

export default async function PflanzenPage() {
  const groups = await getPlantsGroupedByZone();

  return <PlantsOverview groups={groups} />;
}
