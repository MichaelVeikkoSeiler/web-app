"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, ChevronDown, Images, Loader2, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { startPlantDocCase } from "@/lib/actions/plant-doc";
import { uploadPlantDocPhoto } from "@/lib/upload-photo";
import { PLANT_DOC_MAX_PHOTOS, type PlantDocAnswers } from "@/lib/plant-doc-types";
import type { ZoneGroup } from "@/lib/plants-query";

type SelectablePlant = {
  id: number;
  name: string;
  photoUrl: string | null;
};

type PhotoEntry = {
  file: File;
  preview: string;
  role: string | null;
};

const LOCATION_OPTIONS = ["Blätter", "Blüten", "Stamm/Äste", "gesamte Pflanze", "Schädlinge sichtbar"];
const OBSERVATION_OPTIONS = [
  "gelbe Blätter",
  "braune Stellen",
  "Flecken",
  "Löcher/Fraßspuren",
  "eingerollte Blätter",
  "welk",
  "trockene Triebe",
  "Belag",
  "unbekannt",
];
const SINCE_OPTIONS = ["heute entdeckt", "wenige Tage", "1–2 Wochen", "länger"];
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "gesamt", label: "Gesamt" },
  { value: "betroffener-bereich", label: "Bereich" },
  { value: "detail", label: "Detail" },
];

export function PlantDocWizard({
  plantGroups,
  initialPlant,
}: {
  plantGroups: ZoneGroup[];
  initialPlant: SelectablePlant | null;
}) {
  const router = useRouter();
  const [selectedPlant, setSelectedPlant] = useState<SelectablePlant | null>(initialPlant);
  const [openZoneIds, setOpenZoneIds] = useState<Set<number | null>>(new Set());

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  const [location, setLocation] = useState<Set<string>>(new Set());
  const [observations, setObservations] = useState<Set<string>>(new Set());
  const [sinceWhen, setSinceWhen] = useState<string | null>(null);
  const [freeText, setFreeText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleZone(zoneId: number | null) {
    setOpenZoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(zoneId)) next.delete(zoneId);
      else next.add(zoneId);
      return next;
    });
  }

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSet(next);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (photos.length >= PLANT_DOC_MAX_PHOTOS) return;
    setPhotos((prev) => [...prev, { file, preview: URL.createObjectURL(file), role: null }]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const entry = prev[index];
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function setPhotoRole(index: number, role: string) {
    setPhotos((prev) =>
      prev.map((p, i) => (i === index ? { ...p, role: p.role === role ? null : role } : p)),
    );
  }

  async function handleSubmit() {
    if (!selectedPlant || photos.length === 0 || !sinceWhen) return;
    setSubmitting(true);
    setError(null);
    try {
      const uploaded: { url: string; role: string | null }[] = [];
      for (const p of photos) {
        const url = await uploadPlantDocPhoto(p.file);
        uploaded.push({ url, role: p.role });
      }
      const answers: PlantDocAnswers = {
        location: [...location],
        observations: [...observations],
        sinceWhen,
        freeText: freeText.trim() ? freeText.trim() : null,
      };
      const { caseId } = await startPlantDocCase(selectedPlant.id, uploaded, answers);
      router.push(`/plant-doc/${caseId}`);
    } catch {
      setError("Der Fall konnte nicht gestartet werden. Bitte erneut versuchen.");
      setSubmitting(false);
    }
  }

  if (!selectedPlant) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-attention/20 text-attention-text">
            <Stethoscope className="h-5 w-5" strokeWidth={2} />
          </span>
          <h1 className="font-display text-2xl text-forest">Plant Doc</h1>
        </div>
        <p className="text-sm text-forest-muted">Für welche Pflanze möchtest du einen Fall starten?</p>

        <div className="flex flex-col gap-2">
          {plantGroups.map((group) => {
            const open = openZoneIds.has(group.zoneId);
            return (
              <div
                key={group.zoneId ?? "none"}
                className="overflow-hidden rounded-2xl border border-border bg-warm-white"
              >
                <button
                  onClick={() => toggleZone(group.zoneId)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-cream">
                    {group.zoneImageUrl ? (
                      <Image
                        src={group.zoneImageUrl}
                        alt=""
                        fill
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-forest-muted/40">
                        <Stethoscope className="h-4 w-4" strokeWidth={1.5} />
                      </span>
                    )}
                  </span>
                  <span className="flex-1 font-display text-base text-forest">
                    {group.zoneName}
                  </span>
                  <span className="text-xs text-forest-muted">{group.plants.length}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-forest-muted transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div className="grid grid-cols-3 gap-2 border-t border-border p-3">
                    {group.plants.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlant(p)}
                        className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-center hover:bg-cream"
                      >
                        <span className="relative aspect-square w-full overflow-hidden rounded-xl bg-cream">
                          {p.photoUrl ? (
                            <Image
                              src={p.photoUrl}
                              alt=""
                              fill
                              sizes="120px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex h-full items-center justify-center text-forest-muted/40">
                              <Stethoscope className="h-5 w-5" strokeWidth={1.5} />
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-forest">{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => router.push("/pflanzen/neu?returnTo=plant-doc")}
          className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-warm-white px-4 py-3 text-left hover:border-sage"
        >
          <span className="text-sm font-medium text-forest">Unbekannte Pflanze fotografieren</span>
          <Camera className="h-4 w-4 shrink-0 text-forest-muted" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-attention/20 text-attention-text">
            <Stethoscope className="h-5 w-5" strokeWidth={2} />
          </span>
          <div>
            <h1 className="font-display text-2xl text-forest">Plant Doc</h1>
            <p className="text-sm text-forest-muted">{selectedPlant.name}</p>
          </div>
        </div>
        {!initialPlant && (
          <button
            onClick={() => setSelectedPlant(null)}
            className="mt-2 text-sm font-medium text-forest-muted hover:text-forest"
          >
            Andere Pflanze wählen
          </button>
        )}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-warm-white p-4">
        <h2 className="text-sm font-semibold text-forest">
          Fotos ({photos.length}/{PLANT_DOC_MAX_PHOTOS})
        </h2>
        <p className="text-xs text-forest-muted">
          Mindestens ein Foto, z. B. Gesamtansicht, betroffener Bereich und eine Detailaufnahme.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-cream">
                <Image src={p.preview} alt="" fill sizes="120px" className="object-cover" unoptimized />
                <button
                  onClick={() => removePhoto(i)}
                  aria-label="Foto entfernen"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-forest/70 text-warm-white hover:bg-attention"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setPhotoRole(i, r.value)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] ${
                      p.role === r.value
                        ? "border-sage bg-sage/15 font-medium text-forest"
                        : "border-border text-forest-muted"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {photos.length < PLANT_DOC_MAX_PHOTOS && (
            <>
              <button
                onClick={() => cameraInputRef.current?.click()}
                aria-label="Foto mit Kamera aufnehmen"
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-forest-muted hover:border-sage"
              >
                <Camera className="h-5 w-5" />
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                aria-label="Foto aus Galerie wählen"
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-border text-forest-muted hover:border-sage"
              >
                <Images className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-warm-white p-4">
        <h2 className="text-sm font-semibold text-forest">Kurzer Check</h2>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-forest-muted">Wo liegt das Problem?</p>
          <div className="flex flex-wrap gap-1.5">
            {LOCATION_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                active={location.has(opt)}
                onClick={() => toggle(location, setLocation, opt)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-forest-muted">Was fällt auf?</p>
          <div className="flex flex-wrap gap-1.5">
            {OBSERVATION_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                active={observations.has(opt)}
                onClick={() => toggle(observations, setObservations, opt)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-forest-muted">Seit wann?</p>
          <div className="flex flex-wrap gap-1.5">
            {SINCE_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} active={sinceWhen === opt} onClick={() => setSinceWhen(opt)} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-forest-muted">Weitere Angaben (optional)</p>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            placeholder="z. B. Besonderheiten, was bereits versucht wurde…"
            className={`${inputClasses} resize-none`}
          />
        </div>
      </section>

      {error && <p className="text-sm text-attention-text">{error}</p>}

      <Button
        className="w-full"
        disabled={submitting || photos.length === 0 || !sinceWhen}
        onClick={handleSubmit}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Wird gestartet…
          </>
        ) : (
          "Analyse starten"
        )}
      </Button>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-sage bg-sage/15 font-medium text-forest"
          : "border-border bg-warm-white text-forest-muted hover:border-sage"
      }`}
    >
      {label}
    </button>
  );
}
