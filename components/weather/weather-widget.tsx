import { Droplets, Wind } from "lucide-react";
import { getWeatherSnapshot, weatherLabel } from "@/lib/openmeteo";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { DailyForecastStrip } from "@/components/weather/daily-forecast-strip";

export async function WeatherWidget() {
  let snapshot;
  try {
    snapshot = await getWeatherSnapshot();
  } catch {
    return (
      <div className="rounded-3xl border border-border bg-warm-white p-10 text-center text-sm text-forest-muted">
        Wetterdaten aktuell nicht verfügbar.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 sm:gap-4">
      <div className="flex flex-row items-center justify-between gap-2 rounded-2xl border border-border bg-warm-white p-3.5 text-left sm:gap-6 sm:rounded-3xl sm:p-10 sm:text-left">
        <div className="flex flex-col items-start gap-0.5 sm:items-start">
          <p className="text-[10px] font-medium uppercase tracking-wide text-forest-muted sm:text-sm">
            Müntschemier
          </p>
          <p className="font-display text-4xl leading-none text-forest sm:text-8xl">
            {Math.round(snapshot.current.temperature)}°
          </p>
          <p className="text-xs text-forest-muted sm:text-lg">
            {weatherLabel(snapshot.current.weatherCode)}
          </p>
        </div>

        <WeatherIcon
          code={snapshot.current.weatherCode}
          className="h-12 w-12 shrink-0 text-sage sm:h-32 sm:w-32"
        />

        <div className="flex flex-col items-end gap-1.5 sm:flex-col sm:items-end sm:gap-3">
          <div className="flex items-center gap-1 rounded-full bg-water/40 px-2 py-1 text-[10px] text-water-text sm:gap-1.5 sm:px-3.5 sm:py-2 sm:text-sm">
            <Droplets className="h-3 w-3 sm:h-4 sm:w-4" />
            {snapshot.precipitationLast7Days.toFixed(0)}mm/7T
          </div>
          <div className="flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-[10px] text-forest-muted sm:gap-1.5 sm:px-3.5 sm:py-2 sm:text-sm">
            <Wind className="h-3 w-3 sm:h-4 sm:w-4" />
            {Math.round(snapshot.current.windSpeed)} km/h
          </div>
        </div>
      </div>

      <DailyForecastStrip days={snapshot.daily} todayIndex={snapshot.todayIndex} />
    </div>
  );
}
