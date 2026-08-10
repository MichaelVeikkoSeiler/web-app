"use client";

import { Button } from "@/components/ui/button";
import type { SoilProfile } from "@/lib/soil-check-types";

const TEXTURE_LABEL: Record<SoilProfile["soilTexture"], string> = {
  sandig: "Sandig",
  "sandig-lehmig": "Sandig-lehmig",
  lehmig: "Lehmig",
  "tonig-lehmig": "Tonig-lehmig",
  tonig: "Tonig",
};

const DRAINAGE_LABEL: Record<SoilProfile["drainageClass"], string> = {
  schnell: "Schnell",
  mittel: "Mittel",
  langsam: "Langsam",
};

const RETENTION_LABEL: Record<SoilProfile["waterRetentionClass"], string> = {
  gering: "Gering",
  mittel: "Mittel",
  gut: "Gut",
};

const STONE_LABEL: Record<SoilProfile["stoneContentClass"], string> = {
  kaum: "Gering",
  einige: "Etwas",
  viele: "Hoch",
  "sehr viele": "Sehr hoch",
};

const ORGANIC_LABEL: Record<SoilProfile["organicMatterIndicator"], string> = {
  mineralisch: "Geringer Hinweis",
  erdig: "Typischer Hinweis",
  humos: "Mittlerer Hinweis",
  "sehr humos": "Starker Hinweis",
  unbekannt: "Nicht einschätzbar",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0">
      <span className="text-sm text-forest-muted">{label}</span>
      <span className="text-sm font-medium text-forest">{value}</span>
    </div>
  );
}

export function ResultScreen({
  zoneName,
  profile,
  submitting,
  error,
  onConfirm,
}: {
  zoneName: string;
  profile: SoilProfile;
  submitting: boolean;
  error: string | null;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl text-forest">Geschafft – du hast deinen Boden untersucht</h1>
        <p className="mt-1 text-sm leading-relaxed text-forest-muted">
          Aus deinen Beobachtungen und Messungen erstellt die App jetzt das Bodenprofil dieser Zone.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-warm-white p-4">
        <Row label="Bodenart" value={TEXTURE_LABEL[profile.soilTexture]} />
        <Row label="pH-Wert" value={`${profile.phValue.toFixed(1).replace(".", ",")} · ${profile.phClassification}`} />
        <Row label="Drainage" value={DRAINAGE_LABEL[profile.drainageClass]} />
        <Row label="Wasserspeicherung" value={RETENTION_LABEL[profile.waterRetentionClass]} />
        <Row label="Steinanteil" value={STONE_LABEL[profile.stoneContentClass]} />
        <Row label="Organisches Material" value={ORGANIC_LABEL[profile.organicMatterIndicator]} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-forest">Was bedeutet das für deinen Garten?</h2>
        <p className="text-sm leading-relaxed text-forest">{profile.summaryText}</p>
      </div>

      <p className="rounded-xl bg-cream px-3.5 py-2.5 text-xs leading-relaxed text-forest-muted">
        Die Ergebnisse beruhen auf deinen eigenen Beobachtungen und einfachen Gartentests. Sie sind eine praktische
        Einschätzung und keine Laboranalyse.
      </p>

      {error && <p className="text-sm text-attention-text">{error}</p>}

      <Button className="w-full" disabled={submitting} onClick={onConfirm}>
        {submitting ? "Wird gespeichert…" : `Bodenprofil für „${zoneName}" übernehmen`}
      </Button>
    </div>
  );
}
