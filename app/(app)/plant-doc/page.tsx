import Link from "next/link";
import Image from "next/image";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { plantDocCases, plantDocPhotos, plants } from "@/lib/db/schema";
import { Stethoscope } from "lucide-react";
import { STATUS_META } from "@/lib/plant-doc-status";
import {
  getPlantDocHeroImageUrl,
  setPlantDocHeroImage,
  clearPlantDocHeroImage,
} from "@/lib/actions/settings";
import { HeroBanner } from "@/components/layout/hero-banner";
import { NewCaseLink } from "@/components/plant-doc/new-case-link";

export default async function PlantDocOverviewPage() {
  const [cases, heroImageUrl] = await Promise.all([
    isDbConfigured
      ? getDb()
          .select({
            id: plantDocCases.id,
            status: plantDocCases.status,
            analysisStatus: plantDocCases.analysisStatus,
            primaryCause: plantDocCases.primaryCause,
            createdAt: plantDocCases.createdAt,
            plantId: plantDocCases.plantId,
            germanName: plants.germanName,
            scientificName: plants.scientificName,
          })
          .from(plantDocCases)
          .innerJoin(plants, eq(plantDocCases.plantId, plants.id))
          .orderBy(desc(plantDocCases.createdAt))
      : [],
    getPlantDocHeroImageUrl(),
  ]);

  const photoByCaseId = new Map<number, string>();
  if (cases.length > 0) {
    const db = getDb();
    const photos = await db
      .select({ caseId: plantDocPhotos.caseId, blobUrl: plantDocPhotos.blobUrl, id: plantDocPhotos.id })
      .from(plantDocPhotos)
      .where(
        inArray(
          plantDocPhotos.caseId,
          cases.map((c) => c.id),
        ),
      );
    for (const p of photos) {
      if (!photoByCaseId.has(p.caseId)) photoByCaseId.set(p.caseId, p.blobUrl);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <HeroBanner
        initialUrl={heroImageUrl}
        alt="Plant Doc"
        uploadLabel="Bild hochladen"
        onUpload={setPlantDocHeroImage}
        onDelete={clearPlantDocHeroImage}
      />

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-forest">Plant Doc</h1>
        <NewCaseLink />
      </div>

      {cases.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-warm-white p-10 text-center text-forest-muted">
          <Stethoscope className="h-8 w-8" strokeWidth={1.25} />
          <p className="text-sm">Noch keine Plant-Doc-Fälle erfasst.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/plant-doc/${c.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-warm-white px-4 py-3 hover:border-sage"
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream">
                {photoByCaseId.get(c.id) ? (
                  <Image
                    src={photoByCaseId.get(c.id)!}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-forest-muted/40">
                    <Stethoscope className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-forest">{c.germanName ?? c.scientificName}</p>
                <p className="truncate text-sm text-forest-muted">
                  {c.analysisStatus === "pending"
                    ? "Analyse läuft…"
                    : c.analysisStatus === "failed"
                      ? "Analyse fehlgeschlagen"
                      : (c.primaryCause ?? "Keine eindeutige Ursache")}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_META[c.status]?.className ?? "bg-cream text-forest-muted"}`}
              >
                {STATUS_META[c.status]?.label ?? c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
