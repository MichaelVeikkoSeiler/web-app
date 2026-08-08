import { Droplets } from "lucide-react";
import { getWeatherSnapshot, weatherLabel } from "@/lib/openmeteo";

export async function WeatherWidget() {
  let snapshot;
  try {
    snapshot = await getWeatherSnapshot();
  } catch {
    return (
      <div className="rounded-2xl border border-border bg-warm-white p-5 text-sm text-forest-muted">
        Wetterdaten aktuell nicht verfügbar.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-warm-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-forest-muted">
            Müntschemier
          </p>
          <p className="font-display text-3xl text-forest">
            {Math.round(snapshot.current.temperature)}°
          </p>
          <p className="text-sm text-forest-muted">
            {weatherLabel(snapshot.current.weatherCode)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-water/40 px-3 py-1.5 text-sm text-water-text">
          <Droplets className="h-4 w-4" />
          {snapshot.precipitationLast7Days.toFixed(0)} mm / 7 Tage
        </div>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {snapshot.daily.map((d) => {
          const date = new Date(d.date);
          return (
            <div
              key={d.date}
              className="flex min-w-16 shrink-0 flex-col items-center gap-1 rounded-xl bg-cream px-2 py-2.5"
            >
              <span className="text-xs font-medium text-forest-muted">
                {date.toLocaleDateString("de-CH", { weekday: "short" })}
              </span>
              <span className="text-sm font-semibold text-forest">
                {Math.round(d.tempMax)}°
              </span>
              <span className="text-xs text-forest-muted">{Math.round(d.tempMin)}°</span>
              {d.precipitationSum > 0 && (
                <span className="text-xs text-water-text">{d.precipitationSum.toFixed(1)}mm</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
