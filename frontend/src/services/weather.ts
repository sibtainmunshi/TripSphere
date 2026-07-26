import { CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Cloud, Sun, type LucideIcon } from 'lucide-react'

// Real, free forecast via Open-Meteo — same "genuinely free, no API key"
// principle already used for maps/geocoding (3.md's stack). Current
// conditions only; no forecast history or multi-day data needed here.
const BASE_URL = 'https://api.open-meteo.com/v1/forecast'

export interface WeatherSnapshot {
  temperatureC: number
  code: number
  label: string
}

// WMO weather interpretation codes — the standard Open-Meteo returns.
// https://open-meteo.com/en/docs
const CODE_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
}

export function getWeatherIcon(code: number): LucideIcon {
  if (code === 0) return Sun
  if (code <= 2) return CloudSun
  if (code === 3) return Cloud
  if (code === 45 || code === 48) return CloudFog
  if (code >= 51 && code <= 55) return CloudDrizzle
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return CloudRain
  if (code >= 71 && code <= 75) return CloudSnow
  if (code >= 95) return CloudLightning
  return Cloud
}

export async function fetchCurrentWeather(lat: number, lon: number, signal?: AbortSignal): Promise<WeatherSnapshot> {
  const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Weather lookup failed')

  const data: { current: { temperature_2m: number; weather_code: number } } = await response.json()
  const code = data.current.weather_code
  return {
    temperatureC: Math.round(data.current.temperature_2m),
    code,
    label: CODE_LABELS[code] ?? 'Weather unavailable',
  }
}
