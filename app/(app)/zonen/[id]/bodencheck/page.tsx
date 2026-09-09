import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { SoilCheckWizard } from "@/components/zones/soil-check/soil-check-wizard";

export default async function BodenCheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const zoneId = Number(id);
  if (Number.isNaN(zoneId)) notFound();
  if (!isDbConfigured) notFound();

  const [zone] = await getDb()
    .select({ id: zones.id, name: zones.name })
    .from(zones)
    .where(eq(zones.id, zoneId))
    .limit(1);
  if (!zone) notFound();

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
      <SoilCheckWizard zoneId={zone.id} zoneName={zone.name} />
    </div>
  );
}
