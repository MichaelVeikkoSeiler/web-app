import { getPlantsGroupedByZone } from "@/lib/plants-query";
import {
  getPlantsHeroImageUrl,
  setPlantsHeroImage,
  clearPlantsHeroImage,
} from "@/lib/actions/settings";
import { PlantsOverview } from "@/components/plants/plants-overview";
import { HeroBanner } from "@/components/layout/hero-banner";

export default async function PflanzenPage() {
  const [{ totalCount, groups }, heroImageUrl] = await Promise.all([
    getPlantsGroupedByZone(),
    getPlantsHeroImageUrl(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Pflanzen"
        uploadLabel="Bild hochladen"
        onUpload={setPlantsHeroImage}
        onDelete={clearPlantsHeroImage}
      />
      <PlantsOverview totalCount={totalCount} groups={groups} />
    </div>
  );
}
