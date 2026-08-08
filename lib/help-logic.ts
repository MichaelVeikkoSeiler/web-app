import { daysSince, isTaskDueThisPeriod } from "@/lib/date-utils";

export type PlantForHelp = {
  wateringRhythmDays: number | null;
  lastWateredAt: Date | null;
  pruningStartMonth: number | null;
  pruningEndMonth: number | null;
  lastPrunedAt: Date | null;
  fertilizingStartMonth: number | null;
  fertilizingEndMonth: number | null;
  lastFertilizedAt: Date | null;
};

export type HelpFlags = {
  needsWater: boolean;
  needsPruning: boolean;
  needsFertilizing: boolean;
  needsHelp: boolean;
};

/** Unterhalb dieser Niederschlagssumme (mm, letzte 7 Tage) gilt es als "zu wenig Regen". */
const RAIN_THRESHOLD_MM = 5;

export function computeHelpFlags(
  plant: PlantForHelp,
  precipitationLast7Days: number,
  now: Date = new Date(),
): HelpFlags {
  const since = daysSince(plant.lastWateredAt);
  const needsWater = Boolean(
    plant.wateringRhythmDays &&
      (since === null || since > plant.wateringRhythmDays) &&
      precipitationLast7Days < RAIN_THRESHOLD_MM,
  );

  const needsPruning = isTaskDueThisPeriod(
    now,
    plant.pruningStartMonth,
    plant.pruningEndMonth,
    plant.lastPrunedAt,
  );
  const needsFertilizing = isTaskDueThisPeriod(
    now,
    plant.fertilizingStartMonth,
    plant.fertilizingEndMonth,
    plant.lastFertilizedAt,
  );

  return {
    needsWater,
    needsPruning,
    needsFertilizing,
    needsHelp: needsWater || needsPruning || needsFertilizing,
  };
}
