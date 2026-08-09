import { getPlantsGroupedByZone } from "@/lib/plants-query";
import { PlantsOverview } from "@/components/plants/plants-overview";

export default async function PflanzenPage() {
  const { totalCount, groups } = await getPlantsGroupedByZone();

  return <PlantsOverview totalCount={totalCount} groups={groups} />;
}
