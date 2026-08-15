"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { inputClasses } from "@/components/ui/field";
import { searchSpeciesAnimal, correctAnimalSpecies } from "@/lib/actions/animals";

export function SpeciesCorrectionAnimal({ animalId }: { animalId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ scientificName: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
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

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setError(null);
  }

  function handleSelect(scientificName: string) {
    setError(null);
    startTransition(async () => {
      const result = await correctAnimalSpecies(animalId, scientificName);
      if (result.ok) {
        close();
        router.refresh();
      } else {
        setError(result.error ?? "Fehler beim Speichern.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Tierart korrigieren"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-forest-muted hover:bg-cream"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <Sheet open={open} onClose={close} title="Tierart korrigieren">
        <div className="flex flex-col gap-3">
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
                  disabled={pending}
                  onClick={() => handleSelect(r.scientificName)}
                  className="rounded-xl px-3 py-2 text-left text-sm italic text-forest hover:bg-cream disabled:opacity-50"
                >
                  {r.scientificName}
                </button>
              ))}
            </div>
          )}

          {!searching && query.trim().length > 0 && results.length === 0 && (
            <p className="text-sm text-forest-muted">Keine Treffer.</p>
          )}

          {pending && (
            <div className="flex items-center gap-2 text-sm text-forest-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Wird gespeichert…
            </div>
          )}

          {error && <p className="text-sm text-attention-text">{error}</p>}
        </div>
      </Sheet>
    </>
  );
}
