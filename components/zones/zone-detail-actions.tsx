"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { ZoneForm } from "@/components/zones/zone-form";
import { deleteZone, type ZoneInput } from "@/lib/actions/zones";

export function ZoneDetailActions({ zone }: { zone: { id: number } & ZoneInput }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      await deleteZone(zone.id);
      router.push("/zonen");
    });
  }

  return (
    <div className="flex gap-2">
      <Button variant="secondary" onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" />
        Bearbeiten
      </Button>
      <button
        onClick={() => setConfirmOpen(true)}
        className="flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-attention-text hover:bg-attention/15"
      >
        <Trash2 className="h-4 w-4" />
        Zone entfernen
      </button>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Zone bearbeiten">
        <ZoneForm zone={zone} onDone={() => setEditing(false)} />
      </Sheet>

      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Zone wirklich entfernen"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-forest-muted">
            Zuordnungen von Pflanzen zu dieser Zone werden ebenfalls entfernt.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Nein
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={confirmDelete}
              disabled={pending}
            >
              {pending ? "Wird entfernt…" : "OK"}
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
