import { isMonthInRange, daysSince } from "@/lib/date-utils";

export type PlantForHelp = {
  wateringRhythmDays: number | null;
  lastWateredAt: Date | null;
  pruningStartMonth: number | null;
  pruningEndMonth: number | null;
  fertilizingStartMonth: number | null;
  fertilizingEndMonth: number | null;
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

  const currentMonth = now.getMonth() + 1;
  const needsPruning = isMonthInRange(
    currentMonth,
    plant.pruningStartMonth,
    plant.pruningEndMonth,
  );
  const needsFertilizing = isMonthInRange(
    currentMonth,
    plant.fertilizingStartMonth,
    plant.fertilizingEndMonth,
  );

  return {
    needsWater,
    needsPruning,
    needsFertilizing,
    needsHelp: needsWater || needsPruning || needsFertilizing,
  };
}
