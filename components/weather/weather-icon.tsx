import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSunRain,
  CloudMoonRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";

export function WeatherIcon({
  code,
  isDay = true,
  className,
}: {
  code: number;
  isDay?: boolean;
  className?: string;
}) {
  if (code === 0) return isDay ? <Sun className={className} /> : <Moon className={className} />;
  if (code === 1 || code === 2)
    return isDay ? <CloudSun className={className} /> : <CloudMoon className={className} />;
  if (code === 3) return <Cloud className={className} />;
  if (code === 45 || code === 48) return <CloudFog className={className} />;
  if (code === 51 || code === 53 || code === 55) return <CloudDrizzle className={className} />;
  if ([61, 63, 65, 66, 67].includes(code)) return <CloudRain className={className} />;
  // Schauer (80–82) sind konvektiv und laut WMO-Definition typischerweise mit
  // Sonnenphasen durchmischt, im Unterschied zu durchgehendem Regen (61–67).
  // Nachts entsprechend mit Mond statt Sonne.
  if ([80, 81, 82].includes(code))
    return isDay ? <CloudSunRain className={className} /> : <CloudMoonRain className={className} />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className={className} />;
  if (code === 95 || code === 96 || code === 99) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}
