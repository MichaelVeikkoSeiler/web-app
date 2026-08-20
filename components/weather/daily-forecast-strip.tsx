"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { WeatherIcon } from "@/components/weather/weather-icon";
import type { DailyWeather } from "@/lib/openmeteo";

const PAST_VISIBLE = 5;
const FUTURE_VISIBLE = 6;
/** 5 vergangene + heute + 6 kommende Tage. */
const VISIBLE_DAYS = PAST_VISIBLE + 1 + FUTURE_VISIBLE;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function DailyForecastStrip({
  days,
  todayIndex,
}: {
  days: DailyWeather[];
  todayIndex: number;
}) {
  const maxStart = Math.max(0, days.length - VISIBLE_DAYS);
  const [windowStart, setWindowStart] = useState(() =>
    clamp(todayIndex - PAST_VISIBLE, 0, maxStart),
  );

  const canGoBack = windowStart > 0;
  const canGoForward = windowStart < maxStart;

  function goBack() {
    setWindowStart((start) => Math.max(0, start - VISIBLE_DAYS));
  }

  function goForward() {
    setWindowStart((start) => Math.min(maxStart, start + VISIBLE_DAYS));
  }

  const visible = days.slice(windowStart, windowStart + VISIBLE_DAYS);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button
        onClick={goBack}
        disabled={!canGoBack}
        aria-label="Frühere Tage anzeigen"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-warm-white text-forest-muted hover:border-sage disabled:opacity-30 sm:h-10 sm:w-10"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <div className="grid flex-1 grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-3">
        {visible.map((d, i) => {
          const date = new Date(d.date);
          const dayIndex = windowStart + i;
          const isToday = dayIndex === todayIndex;
          const isPast = dayIndex < todayIndex;
          return (
            <div
              key={d.date}
              className={`flex flex-col items-center gap-1 rounded-xl border border-border bg-warm-white px-1.5 py-2.5 sm:gap-2.5 sm:rounded-2xl sm:px-3 sm:py-6 ${
                isPast ? "opacity-70" : ""
              }`}
            >
              <span className="text-[11px] font-semibold text-forest sm:text-sm">
                {isToday ? "Heute" : date.toLocaleDateString("de-CH", { weekday: "short" })}
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

      <button
        onClick={goForward}
        disabled={!canGoForward}
        aria-label="Spätere Tage anzeigen"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-warm-white text-forest-muted hover:border-sage disabled:opacity-30 sm:h-10 sm:w-10"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  );
}
