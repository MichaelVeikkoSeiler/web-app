import { WeatherWidget } from "@/components/weather/weather-widget";

export default function WetterPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-forest">Wetter</h1>
      <WeatherWidget />
    </div>
  );
}
