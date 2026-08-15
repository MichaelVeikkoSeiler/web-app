"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { deleteAnimal } from "@/lib/actions/animals";

export function DeleteAnimalButton({ animalId }: { animalId: number }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      await deleteAnimal(animalId);
      router.push("/tiere");
    });
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        className="flex min-h-11 items-center justify-center gap-2 self-start rounded-full px-5 text-sm font-medium text-attention-text hover:bg-attention/15"
      >
        <Trash2 className="h-4 w-4" />
        Tier entfernen
      </button>

      <Sheet
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Tier wirklich entfernen"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-forest-muted">
            Das Tier inkl. aller Fotos, Notizen und Zonenzuordnungen wird
            unwiderruflich gelöscht.
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
    </>
  );
}
