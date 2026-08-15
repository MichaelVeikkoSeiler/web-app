"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { retryAnimalEnrichment } from "@/lib/actions/animals";

export function EnrichmentStatusAnimal({
  animalId,
  status,
  error,
}: {
  animalId: number;
  status: "pending" | "done" | "failed";
  error: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "pending") return;
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [status, router]);

  if (status === "done") return null;

  if (status === "pending") {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-sm text-forest-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Beschrieb wird recherchiert…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-attention/20 px-3.5 py-2.5 text-sm text-attention-text">
      <p>Recherche fehlgeschlagen{error ? `: ${error}` : "."}</p>
      <Button
        variant="secondary"
        className="w-fit"
        disabled={pending}
        onClick={() => startTransition(() => retryAnimalEnrichment(animalId))}
      >
        <RotateCcw className="h-4 w-4" /> Erneut versuchen
      </Button>
    </div>
  );
}
