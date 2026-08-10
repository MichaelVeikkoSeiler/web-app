"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, Loader2, RotateCcw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import {
  retryPlantDocAnalysis,
  updatePlantDocCaseStatus,
  deletePlantDocCase,
} from "@/lib/actions/plant-doc";
import type { plantDocCases, plantDocPhotos } from "@/lib/db/schema";
import { STATUS_META, CONFIDENCE_CLASS, type PlantDocStatus } from "@/lib/plant-doc-status";

type DocCase = typeof plantDocCases.$inferSelect;
type DocPhoto = typeof plantDocPhotos.$inferSelect;
type Status = PlantDocStatus;

export function CaseResult({
  docCase,
  photos,
  plantName,
}: {
  docCase: DocCase;
  photos: DocPhoto[];
  plantName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (docCase.analysisStatus !== "pending") return;
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [docCase.analysisStatus, router]);

  function handleDelete() {
    startTransition(async () => {
      await deletePlantDocCase(docCase.id);
      router.push("/plant-doc");
    });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <p className="text-sm text-forest-muted">{plantName}</p>
        <h1 className="font-display text-2xl text-forest">Plant-Doc-Fall</h1>
        <p className="text-xs text-forest-muted">
          {docCase.createdAt.toLocaleDateString("de-CH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-cream">
              <Image src={p.blobUrl} alt="" fill sizes="150px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {docCase.analysisStatus === "pending" && (
        <div className="flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm text-forest-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyse läuft…
        </div>
      )}

      {docCase.analysisStatus === "failed" && (
        <div className="flex flex-col gap-2 rounded-xl bg-attention/20 px-3.5 py-2.5 text-sm text-attention-text">
          <p>Analyse fehlgeschlagen{docCase.analysisError ? `: ${docCase.analysisError}` : "."}</p>
          <Button
            variant="secondary"
            className="w-fit"
            disabled={pending}
            onClick={() => startTransition(() => retryPlantDocAnalysis(docCase.id))}
          >
            <RotateCcw className="h-4 w-4" /> Erneut versuchen
          </Button>
        </div>
      )}

      {docCase.analysisStatus === "done" && (
        <>
          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-warm-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              {docCase.confidence && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    CONFIDENCE_CLASS[docCase.confidence] ?? "bg-cream text-forest-muted"
                  }`}
                >
                  {docCase.confidence}
                </span>
              )}
              {docCase.primaryCauseCategory && (
                <span className="rounded-full bg-cream px-3 py-1 text-xs text-forest-muted">
                  {docCase.primaryCauseCategory}
                </span>
              )}
            </div>
            <h2 className="font-display text-lg text-forest">
              {docCase.primaryCause ?? "Keine eindeutige Ursache"}
            </h2>
            {docCase.reasoning && (
              <p className="text-sm leading-relaxed text-forest">{docCase.reasoning}</p>
            )}
          </section>

          {docCase.needsMoreInfo && (
            <section className="flex flex-col gap-2 rounded-2xl bg-attention/15 p-4 text-sm text-attention-text">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Für eine verlässliche Einschätzung fehlen Informationen
              </div>
              {docCase.missingInfoSuggestions && docCase.missingInfoSuggestions.length > 0 && (
                <ul className="flex flex-col gap-1 pl-1">
                  {docCase.missingInfoSuggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Search className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {docCase.otherCauses && docCase.otherCauses.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-forest">Andere mögliche Ursachen</h2>
              <ul className="flex flex-col gap-1">
                {docCase.otherCauses.map((c, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-border bg-warm-white px-3.5 py-2 text-sm text-forest"
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {docCase.recommendations && docCase.recommendations.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-forest">Was jetzt tun?</h2>
              <ul className="flex flex-col gap-2">
                {docCase.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-forest">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage/30 text-xs font-semibold text-forest">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{r}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {docCase.recheckAfterDays != null && (
            <p className="text-sm text-forest-muted">
              Erneut prüfen: in ca. {docCase.recheckAfterDays}{" "}
              {docCase.recheckAfterDays === 1 ? "Tag" : "Tagen"}
            </p>
          )}

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-forest">Status</h2>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUS_META) as Status[]).map((s) => (
                <button
                  key={s}
                  disabled={pending}
                  onClick={() => startTransition(() => updatePlantDocCaseStatus(docCase.id, s))}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-opacity ${
                    STATUS_META[s].className
                  } ${docCase.status === s ? "" : "opacity-50 hover:opacity-80"}`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Link href="/plant-doc" className="text-sm font-medium text-forest-muted hover:text-forest">
          Zur Übersicht
        </Link>
        <button
          onClick={() => setConfirmDeleteOpen(true)}
          className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-attention-text hover:bg-attention/15"
        >
          <Trash2 className="h-4 w-4" /> Fall löschen
        </button>
      </div>

      <Sheet
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title="Fall wirklich löschen"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-forest-muted">
            Der Fall inkl. aller Fotos wird unwiderruflich gelöscht.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={pending}
            >
              Nein
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={pending}>
              {pending ? "Wird gelöscht…" : "OK"}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
