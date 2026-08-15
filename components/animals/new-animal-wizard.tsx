"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Images, Loader2, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/field";
import { ZoneMultiSelect } from "@/components/zones/zone-multi-select";
import {
  identifyAnimal,
  findExistingAnimal,
  createAnimalAndAssign,
  addZoneAssignmentsAnimal,
  saveAnimalPhoto,
  searchSpeciesAnimal,
} from "@/lib/actions/animals";
import { uploadAnimalPhoto } from "@/lib/upload-photo";
import type { AnimalCandidate } from "@/lib/animal-vision-id";

type Zone = { id: number; name: string };
type ExistingCheck = Awaited<ReturnType<typeof findExistingAnimal>>;

type Step =
  | { name: "capture" }
  | { name: "identifying" }
  | { name: "candidates"; candidates: AnimalCandidate[]; error?: string }
  | { name: "checking"; candidate: AnimalCandidate }
  | { name: "existing"; candidate: AnimalCandidate; existing: NonNullable<ExistingCheck> }
  | { name: "new-zone"; candidate: AnimalCandidate }
  | { name: "saving" };

export function NewAnimalWizard({
  zones,
  initialZoneId = null,
}: {
  zones: Zone[];
  initialZoneId?: number | null;
}) {
  const router = useRouter();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [step, setStep] = useState<Step>({ name: "capture" });
  const [saveError, setSaveError] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setStep({ name: "capture" });
  }

  async function runIdentify() {
    if (!photoFile) return;
    setStep({ name: "identifying" });
    const formData = new FormData();
    formData.append("photo", photoFile);
    const result = await identifyAnimal(formData);
    setStep({ name: "candidates", candidates: result.candidates, error: result.error });
  }

  async function pickCandidate(candidate: AnimalCandidate) {
    setStep({ name: "checking", candidate });
    const existing = await findExistingAnimal(candidate.scientificName);

    if (initialZoneId) {
      if (existing) {
        const alreadyInZone = existing.assignedZones.some((z) => z.id === initialZoneId);
        if (alreadyInZone) {
          await confirmSameZone(existing.animal.id);
        } else {
          await confirmAdditionalZone(existing.animal.id, [initialZoneId]);
        }
      } else {
        await confirmNewAnimal(candidate, [initialZoneId]);
      }
      return;
    }

    if (existing) {
      setStep({ name: "existing", candidate, existing });
    } else {
      setStep({ name: "new-zone", candidate });
    }
  }

  async function finishWithPhoto(animalId: number) {
    if (photoFile) {
      try {
        const url = await uploadAnimalPhoto(photoFile);
        await saveAnimalPhoto(animalId, url, true);
      } catch {
        // Tier ist bereits gespeichert – Foto kann später über die Detailseite ergänzt werden.
      }
    }
    router.push(`/tiere/${animalId}`);
  }

  async function confirmSameZone(animalId: number) {
    setStep({ name: "saving" });
    await finishWithPhoto(animalId);
  }

  async function confirmAdditionalZone(animalId: number, zoneIds: number[]) {
    setStep({ name: "saving" });
    setSaveError(null);
    try {
      await addZoneAssignmentsAnimal(animalId, zoneIds);
      await finishWithPhoto(animalId);
    } catch {
      setSaveError("Zuordnung fehlgeschlagen. Bitte erneut versuchen.");
      setStep({ name: "capture" });
    }
  }

  async function confirmNewAnimal(candidate: AnimalCandidate, zoneIds: number[]) {
    setStep({ name: "saving" });
    setSaveError(null);
    try {
      const animal = await createAnimalAndAssign({
        scientificName: candidate.scientificName,
        commonName: candidate.commonNames[0],
        zoneIds,
      });
      await finishWithPhoto(animal.id);
    } catch {
      setSaveError("Anlegen fehlgeschlagen. Bitte erneut versuchen.");
      setStep({ name: "capture" });
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="font-display text-2xl text-forest">Tier hinzufügen</h1>

      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-warm-white p-5">
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

        {photoPreview ? (
          <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl bg-cream">
            <Image src={photoPreview} alt="Aufgenommenes Foto" fill className="object-cover" unoptimized />
          </div>
        ) : (
          <div className="flex aspect-square w-full max-w-xs flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-forest-muted">
            <Camera className="h-10 w-10" strokeWidth={1.5} />
            <span className="text-sm font-medium">Foto aufnehmen oder wählen</span>
          </div>
        )}

        <div className="flex w-full gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => cameraInputRef.current?.click()}>
            <Camera className="h-4 w-4" /> Kamera
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => galleryInputRef.current?.click()}>
            <Images className="h-4 w-4" /> Galerie
          </Button>
        </div>

        {photoPreview && step.name === "capture" && (
          <Button className="w-full" onClick={runIdentify}>
            Erkennen
          </Button>
        )}
      </div>

      {step.name === "identifying" && (
        <StatusBox icon={<Loader2 className="h-5 w-5 animate-spin" />} text="Tier wird erkannt…" />
      )}

      {step.name === "candidates" && (
        <div className="flex flex-col gap-3">
          {step.error && (
            <p className="rounded-xl bg-attention/20 px-4 py-3 text-sm text-attention-text">
              {step.error}
            </p>
          )}
          {step.candidates.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-forest-muted">
                Welche Art ist es? (KI-Vorschlag)
              </h2>
              {step.candidates.map((c) => (
                <button
                  key={c.scientificName}
                  onClick={() => pickCandidate(c)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-warm-white px-4 py-3 text-left hover:border-sage"
                >
                  <span>
                    <span className="block font-medium italic text-forest">
                      {c.scientificName}
                    </span>
                    {c.commonNames[0] && (
                      <span className="block text-sm text-forest-muted">
                        {c.commonNames[0]}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-full bg-sun/40 px-2.5 py-1 text-xs font-semibold text-sun-text">
                    KI
                  </span>
                </button>
              ))}
            </>
          )}

          <ManualSpeciesSearch onSelect={(scientificName) => pickCandidate(makeManualCandidate(scientificName))} />
        </div>
      )}

      {step.name === "checking" && (
        <StatusBox icon={<Loader2 className="h-5 w-5 animate-spin" />} text="Prüfe, ob das Tier schon erfasst ist…" />
      )}

      {step.name === "existing" && (
        <ExistingAnimalStep
          candidate={step.candidate}
          existing={step.existing}
          zones={zones}
          onSameZone={() => confirmSameZone(step.existing.animal.id)}
          onNewZone={(zoneIds) => confirmAdditionalZone(step.existing.animal.id, zoneIds)}
        />
      )}

      {step.name === "new-zone" && (
        <NewAnimalZoneStep
          candidate={step.candidate}
          zones={zones}
          onConfirm={(zoneIds) => confirmNewAnimal(step.candidate, zoneIds)}
        />
      )}

      {step.name === "saving" && (
        <StatusBox icon={<Loader2 className="h-5 w-5 animate-spin" />} text="Wird gespeichert…" />
      )}

      {saveError && <p className="text-sm text-attention-text">{saveError}</p>}
    </div>
  );
}

function StatusBox({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-warm-white px-4 py-4 text-sm text-forest-muted">
      {icon}
      {text}
    </div>
  );
}

function makeManualCandidate(scientificName: string): AnimalCandidate {
  return { scientificName, commonNames: [] };
}

function ManualSpeciesSearch({ onSelect }: { onSelect: (scientificName: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ scientificName: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length === 0) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const r = await searchSpeciesAnimal(query);
      setResults(r);
      setSearching(false);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 self-start text-sm font-medium text-forest-muted hover:text-forest"
      >
        <Search className="h-4 w-4" />
        Art nicht dabei? Manuell eingeben
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-warm-white p-4">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tierart suchen…"
        className={inputClasses}
      />

      {searching && (
        <div className="flex items-center gap-2 text-sm text-forest-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Suche…
        </div>
      )}

      {!searching && results.length > 0 && (
        <div className="flex flex-col gap-1">
          {results.map((r) => (
            <button
              key={r.scientificName}
              onClick={() => onSelect(r.scientificName)}
              className="rounded-xl px-3 py-2 text-left text-sm italic text-forest hover:bg-cream"
            >
              {r.scientificName}
            </button>
          ))}
        </div>
      )}

      {!searching && query.trim().length > 0 && results.length === 0 && (
        <p className="text-sm text-forest-muted">Keine Treffer.</p>
      )}
    </div>
  );
}

function ExistingAnimalStep({
  candidate,
  existing,
  zones,
  onSameZone,
  onNewZone,
}: {
  candidate: AnimalCandidate;
  existing: NonNullable<ExistingCheck>;
  zones: Zone[];
  onSameZone: () => void;
  onNewZone: (zoneIds: number[]) => void;
}) {
  const [showZonePicker, setShowZonePicker] = useState(false);
  const availableZones = zones.filter(
    (z) => !existing.assignedZones.some((az) => az.id === z.id),
  );
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function toggleZone(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-warm-white p-4">
      <p className="text-sm text-forest">
        <span className="font-medium italic">{candidate.scientificName}</span> ist
        bereits erfasst, aktuell zugeordnet zu:
      </p>
      <div className="flex flex-wrap gap-2">
        {existing.assignedZones.map((z) => (
          <span key={z.id} className="rounded-full bg-care/40 px-3 py-1 text-sm text-care-text">
            {z.name}
          </span>
        ))}
      </div>

      {!showZonePicker ? (
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onSameZone}>
            <Check className="h-4 w-4" /> Dasselbe Tier, gleiche Zone
          </Button>
          {availableZones.length > 0 && (
            <Button variant="secondary" onClick={() => setShowZonePicker(true)}>
              Zusätzlich anderen Zonen zuordnen
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2 pt-2">
          <ZoneMultiSelect zones={availableZones} selected={selectedIds} onToggle={toggleZone} />
          <Button
            disabled={selectedIds.size === 0}
            onClick={() => onNewZone([...selectedIds])}
          >
            Zonen zuordnen
          </Button>
        </div>
      )}
    </div>
  );
}

function NewAnimalZoneStep({
  candidate,
  zones,
  onConfirm,
}: {
  candidate: AnimalCandidate;
  zones: Zone[];
  onConfirm: (zoneIds: number[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function toggleZone(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-warm-white p-4">
      <p className="text-sm text-forest">
        Neues Tier: <span className="font-medium italic">{candidate.scientificName}</span>
      </p>
      {zones.length === 0 ? (
        <>
          <p className="text-sm text-forest-muted">
            Optional: noch keine Zone vorhanden. Ihr könnt das Tier auch ohne Zone anlegen.
          </p>
          <Button onClick={() => onConfirm([])}>Tier anlegen</Button>
        </>
      ) : (
        <>
          <ZoneMultiSelect zones={zones} selected={selectedIds} onToggle={toggleZone} />
          <Button onClick={() => onConfirm([...selectedIds])}>
            Tier anlegen{selectedIds.size > 0 ? " und Zonen zuordnen" : ""}
          </Button>
        </>
      )}
    </div>
  );
}
