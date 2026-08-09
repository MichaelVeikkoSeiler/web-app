import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Droplets,
  Wind,
} from "lucide-react";
import { getWeatherSnapshot, weatherLabel } from "@/lib/openmeteo";

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0) return <Sun className={className} />;
  if (code === 1 || code === 2) return <CloudSun className={className} />;
  if (code === 3) return <Cloud className={className} />;
  if (code === 45 || code === 48) return <CloudFog className={className} />;
  if (code === 51 || code === 53 || code === 55) return <CloudDrizzle className={className} />;
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className={className} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className={className} />;
  if (code === 95 || code === 96 || code === 99) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

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

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {snapshot.daily.map((d, i) => {
          const date = new Date(d.date);
          return (
            <div
              key={d.date}
              className="flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-warm-white px-3 py-6"
            >
              <span className="text-sm font-semibold text-forest">
                {i === 0 ? "Heute" : date.toLocaleDateString("de-CH", { weekday: "short" })}
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
    </div>
  );
}
