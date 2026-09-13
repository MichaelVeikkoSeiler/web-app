import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { zones } from "@/lib/db/schema";
import { SoilCheckWizard } from "@/components/zones/soil-check/soil-check-wizard";
import { isDemoMode } from "@/lib/access-token";
import { redirect } from "next/navigation";

export default async function BodenCheckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Im Schaufenster gar nicht erst öffnen: Der Assistent würde beim ersten Foto
  // scheitern. Die Hinweisseite erklärt stattdessen, warum es hier nicht geht.
  if (isDemoMode()) redirect("/demo-hinweis");

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
    // Mobil: Kopfzeile (71px + 16px Abstand) UND die feste Navigationsleiste unten
    // (65px + max(0.75rem, iPhone-Rand)) abziehen, sonst liegt der Hauptknopf des
    // Assistenten teilweise hinter der Leiste. Ab sm gibt es die Leiste nicht.
    <div className="flex min-h-[calc(100dvh-10.25rem-max(0.75rem,env(safe-area-inset-bottom)))] flex-col sm:min-h-[calc(100dvh-8rem)]">
      <SoilCheckWizard zoneId={zone.id} zoneName={zone.name} />
    </div>
  );
}
