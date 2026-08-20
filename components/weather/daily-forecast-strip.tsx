"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { WeatherIcon } from "@/components/weather/weather-icon";
import type { DailyWeather } from "@/lib/openmeteo";

const VISIBLE_DAYS = 6;

export function DailyForecastStrip({
  days,
  todayIndex,
}: {
  days: DailyWeather[];
  todayIndex: number;
}) {
  const maxStart = Math.max(0, days.length - VISIBLE_DAYS);
  const [windowStart, setWindowStart] = useState(() => Math.min(todayIndex, maxStart));

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
    <div className="flex items-center gap-2">
      <button
        onClick={goBack}
        disabled={!canGoBack}
        aria-label="Frühere Tage anzeigen"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-warm-white text-forest-muted hover:border-sage disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="grid flex-1 grid-cols-3 gap-3 sm:grid-cols-6">
        {visible.map((d, i) => {
          const date = new Date(d.date);
          const dayIndex = windowStart + i;
          const isToday = dayIndex === todayIndex;
          const isPast = dayIndex < todayIndex;
          return (
            <div
              key={d.date}
              className={`flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-warm-white px-3 py-6 ${
                isPast ? "opacity-70" : ""
              }`}
            >
              <span className="text-sm font-semibold text-forest">
                {isToday ? "Heute" : date.toLocaleDateString("de-CH", { weekday: "short" })}
              </span>
              <WeatherIcon code={d.weatherCode} className="h-9 w-9 text-sage" />
              <span className="text-lg font-semibold text-forest">
                {Math.round(d.tempMax)}°
              </span>
              <span className="text-sm text-forest-muted">{Math.round(d.tempMin)}°</span>
              {d.precipitationSum > 0 && (
                <span className="flex items-center gap-1 text-xs text-water-text">
                  <Droplets className="h-3 w-3" />
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-warm-white text-forest-muted hover:border-sage disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
