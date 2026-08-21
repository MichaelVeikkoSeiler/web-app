"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { playPlantDocSound } from "@/lib/sounds";

export function NewCaseLink() {
  return (
    <Link
      href="/plant-doc/neu"
      onClick={() => playPlantDocSound()}
      className="flex min-h-11 items-center gap-2 rounded-full bg-sage px-5 text-sm font-semibold text-forest shadow-sm hover:bg-sage-dark hover:text-warm-white"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} /> Neuer Fall
    </Link>
  );
}
