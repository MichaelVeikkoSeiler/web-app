"use client";

import { useTransition } from "react";
import { Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { waterPlant } from "@/lib/actions/plants";
import { daysSince } from "@/lib/date-utils";

export function WaterButton({
  plantId,
  lastWateredAt,
}: {
  plantId: number;
  lastWateredAt: Date | string | null;
}) {
  const [pending, startTransition] = useTransition();
  const since = lastWateredAt ? daysSince(new Date(lastWateredAt)) : null;

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={() => startTransition(() => waterPlant(plantId))}
        disabled={pending}
        className="bg-water text-water-text hover:bg-water/70"
      >
        <Droplets className="h-4 w-4" />
        Gegossen
      </Button>
      <span className="text-sm text-forest-muted">
        {since === null
          ? "Noch nicht gegossen"
          : since === 0
            ? "Heute gegossen"
            : `Vor ${since} ${since === 1 ? "Tag" : "Tagen"} gegossen`}
      </span>
    </div>
  );
}
