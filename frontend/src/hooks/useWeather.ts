import { useEffect, useState } from 'react'
import { fetchCurrentWeather, type WeatherSnapshot } from '@/services/weather'

// Module-level cache (keyed to ~1km precision) so the same destination
// rendered across multiple cards/pages (Dashboard, Trips list, Workspace)
// doesn't re-fetch on every mount.
const cache = new Map<string, WeatherSnapshot>()

export function useWeather(lat?: number, lon?: number) {
  const [data, setData] = useState<WeatherSnapshot | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (lat == null || lon == null) {
      setData(null)
      return
    }

    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`
    const cached = cache.get(key)
    if (cached) {
      setData(cached)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    fetchCurrentWeather(lat, lon, controller.signal)
      .then((snapshot) => {
        cache.set(key, snapshot)
        setData(snapshot)
      })
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') setData(null)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [lat, lon])

  return { data, loading }
}
