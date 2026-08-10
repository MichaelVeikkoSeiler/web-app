import type { plantDocCaseStatusEnum } from "@/lib/db/schema";

export type PlantDocStatus = (typeof plantDocCaseStatusEnum.enumValues)[number];

export const STATUS_META: Record<PlantDocStatus, { label: string; className: string }> = {
  open: { label: "Offen", className: "bg-attention/25 text-attention-text" },
  watching: { label: "Beobachten", className: "bg-sun/40 text-sun-text" },
  improved: { label: "Verbessert", className: "bg-care/40 text-care-text" },
  unchanged: { label: "Unverändert", className: "bg-cream text-forest-muted" },
  worsened: { label: "Verschlechtert", className: "bg-attention/40 text-attention-text" },
  resolved: { label: "Erledigt", className: "bg-sage/40 text-forest" },
};

export const CONFIDENCE_CLASS: Record<string, string> = {
  "sehr wahrscheinlich": "bg-care/40 text-care-text",
  wahrscheinlich: "bg-sun/40 text-sun-text",
  möglich: "bg-soil/40 text-soil-text",
  "eher unwahrscheinlich": "bg-cream text-forest-muted",
};
