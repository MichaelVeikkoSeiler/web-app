import { Droplets } from "lucide-react";
import { WeatherIcon } from "@/components/weather/weather-icon";
import type { DailyWeather } from "@/lib/openmeteo";

const PAST_VISIBLE = 5;
const FUTURE_VISIBLE = 6;
/** 5 vergangene + heute + 6 kommende Tage. */
const VISIBLE_DAYS = PAST_VISIBLE + 1 + FUTURE_VISIBLE;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatDayDate(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.`;
}

export function DailyForecastStrip({
  days,
  todayIndex,
}: {
  days: DailyWeather[];
  todayIndex: number;
}) {
  const maxStart = Math.max(0, days.length - VISIBLE_DAYS);
  const windowStart = clamp(todayIndex - PAST_VISIBLE, 0, maxStart);
  const visible = days.slice(windowStart, windowStart + VISIBLE_DAYS);

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-3">
      {visible.map((d, i) => {
        const date = new Date(d.date);
        const dayIndex = windowStart + i;
        const isToday = dayIndex === todayIndex;
        const isPast = dayIndex < todayIndex;
        return (
          <div
            key={d.date}
            className={`flex flex-col items-center gap-0.5 rounded-xl border px-1.5 py-2 sm:gap-1.5 sm:rounded-2xl sm:px-3 sm:py-5 ${
              isToday
                ? "border-care bg-care/40"
                : `border-border bg-warm-white ${isPast ? "opacity-70" : ""}`
            }`}
          >
            <span
              className={`text-[11px] font-semibold sm:text-sm ${isToday ? "text-care-text" : "text-forest"}`}
            >
              {isToday ? "Heute" : date.toLocaleDateString("de-CH", { weekday: "long" })}
            </span>
            <span className="text-[9px] text-forest-muted sm:text-xs">
              {formatDayDate(date)}
            </span>
            <WeatherIcon code={d.weatherCode} className="h-6 w-6 text-sage sm:h-9 sm:w-9" />
            <span className="text-sm font-semibold text-forest sm:text-lg">
              {Math.round(d.tempMax)}°
            </span>
            <span className="text-xs text-forest-muted sm:text-sm">
              {Math.round(d.tempMin)}°
            </span>
            {d.precipitationSum > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-water-text sm:gap-1 sm:text-xs">
                <Droplets className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {d.precipitationSum.toFixed(1)}mm
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
