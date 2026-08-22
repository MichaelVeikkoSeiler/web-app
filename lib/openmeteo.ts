const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Klar",
  1: "Meist klar",
  2: "Teilweise bewölkt",
  3: "Bedeckt",
  45: "Nebel",
  48: "Reifnebel",
  51: "Leichter Niesel",
  53: "Niesel",
  55: "Starker Niesel",
  61: "Leichter Regen",
  63: "Regen",
  65: "Starker Regen",
  66: "Gefrierender Regen",
  67: "Starker gefrierender Regen",
  71: "Leichter Schneefall",
  73: "Schneefall",
  75: "Starker Schneefall",
  77: "Schneegriesel",
  80: "Leichte Regenschauer",
  81: "Regenschauer",
  82: "Heftige Regenschauer",
  85: "Leichte Schneeschauer",
  86: "Starke Schneeschauer",
  95: "Gewitter",
  96: "Gewitter mit Hagel",
  99: "Gewitter mit starkem Hagel",
};

export function weatherLabel(code: number): string {
  return WEATHER_CODE_LABELS[code] ?? "Unbekannt";
}

export type HourlyWeather = {
  hour: number;
  temp: number;
  weatherCode: number;
  precipitation: number;
};

export type WeatherSnapshot = {
  current: {
    temperature: number;
    precipitation: number;
    weatherCode: number;
    windSpeed: number;
  };
  /** Vergangene Tage (inkl. heute und Vorhersage), chronologisch sortiert. */
  daily: {
    date: string;
    weatherCode: number;
    tempMax: number;
    tempMin: number;
    precipitationSum: number;
  }[];
  /** Index des heutigen Tags innerhalb von `daily`. */
  todayIndex: number;
  /** Niederschlagssumme (mm) der letzten 7 Tage, für die Hilfe-Logik */
  precipitationLast7Days: number;
  /** Stundenwerte 8–19 Uhr je Datum (yyyy-mm-dd), für die Tages-Detailansicht. */
  hourlyByDate: Record<string, HourlyWeather[]>;
};

const PAST_DAYS = 7;

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  const lat = process.env.GARDEN_LAT || "46.976";
  const lon = process.env.GARDEN_LON || "7.130";

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,precipitation,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&hourly=temperature_2m,weather_code,precipitation` +
    `&past_days=${PAST_DAYS}&forecast_days=7&timezone=Europe%2FBerlin`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) {
    throw new Error(`Open-Meteo-Anfrage fehlgeschlagen (${res.status})`);
  }
  const data = await res.json();

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayIndex = data.daily.time.indexOf(todayIso);
  const pastStart = Math.max(0, (todayIndex ?? PAST_DAYS) - PAST_DAYS);
  const precipitationLast7Days: number = data.daily.precipitation_sum
    .slice(pastStart, todayIndex >= 0 ? todayIndex : undefined)
    .reduce((sum: number, v: number) => sum + (v ?? 0), 0);

  const daily = data.daily.time.map((date: string, i: number) => ({
    date,
    weatherCode: data.daily.weather_code[i],
    tempMax: data.daily.temperature_2m_max[i],
    tempMin: data.daily.temperature_2m_min[i],
    precipitationSum: data.daily.precipitation_sum[i],
  }));

  const hourlyByDate: Record<string, HourlyWeather[]> = {};
  for (let i = 0; i < data.hourly.time.length; i++) {
    const [date, timePart] = data.hourly.time[i].split("T");
    const hour = Number(timePart.slice(0, 2));
    if (hour < 8 || hour > 19) continue;
    (hourlyByDate[date] ??= []).push({
      hour,
      temp: data.hourly.temperature_2m[i],
      weatherCode: data.hourly.weather_code[i],
      precipitation: data.hourly.precipitation[i],
    });
  }

  return {
    current: {
      temperature: data.current.temperature_2m,
      precipitation: data.current.precipitation,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
    },
    daily,
    todayIndex: todayIndex >= 0 ? todayIndex : PAST_DAYS,
    precipitationLast7Days,
    hourlyByDate,
  };
}

export type DailyWeather = {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
};

/**
 * Wetter-Historie der letzten `days` Tage (inkl. heute), unabhängig von
 * getWeatherSnapshot() – für Plant Doc, um Hitze-/Frostperioden etc. zu erkennen.
 */
export async function getWeatherHistory(days = 14): Promise<DailyWeather[]> {
  const lat = process.env.GARDEN_LAT || "46.976";
  const lon = process.env.GARDEN_LON || "7.130";

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&past_days=${days}&forecast_days=1&timezone=Europe%2FBerlin`;

  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) {
    throw new Error(`Open-Meteo-Anfrage fehlgeschlagen (${res.status})`);
  }
  const data = await res.json();

  const todayIso = new Date().toISOString().slice(0, 10);

  return data.daily.time
    .map((date: string, i: number) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitationSum: data.daily.precipitation_sum[i],
    }))
    .filter((d: DailyWeather) => d.date <= todayIso);
}
