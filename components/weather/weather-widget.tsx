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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-warm-white p-8 text-center sm:flex-row sm:justify-between sm:p-10 sm:text-left">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <p className="text-sm font-medium uppercase tracking-wide text-forest-muted">
            Müntschemier
          </p>
          <p className="font-display text-8xl leading-none text-forest">
            {Math.round(snapshot.current.temperature)}°
          </p>
          <p className="text-lg text-forest-muted">
            {weatherLabel(snapshot.current.weatherCode)}
          </p>
        </div>

        <WeatherIcon
          code={snapshot.current.weatherCode}
          className="h-32 w-32 shrink-0 text-sage"
        />

        <div className="flex gap-3 sm:flex-col sm:items-end">
          <div className="flex items-center gap-1.5 rounded-full bg-water/40 px-3.5 py-2 text-sm text-water-text">
            <Droplets className="h-4 w-4" />
            {snapshot.precipitationLast7Days.toFixed(0)} mm / 7 Tage
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-cream px-3.5 py-2 text-sm text-forest-muted">
            <Wind className="h-4 w-4" />
            {Math.round(snapshot.current.windSpeed)} km/h
          </div>
        </div>
      </div>

      <DailyForecastStrip days={snapshot.daily} todayIndex={snapshot.todayIndex} />
    </div>
  );
}
