import { useEffect, useState } from 'react'
import { fetchNearbyAttractions, isAbortError, type Attraction } from '@/services/attractions'

// Module-level cache (keyed to ~1km precision) — same pattern as useWeather,
// so revisiting the same destination in a planning session doesn't re-fetch.
const cache = new Map<string, Attraction[]>()

export function useAttractions(lat?: number, lon?: number) {
  const [data, setData] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (lat == null || lon == null) {
      setData([])
      setError(false)
      return
    }

    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`
    const cached = cache.get(key)
    if (cached) {
      setData(cached)
      setError(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(false)
    fetchNearbyAttractions(lat, lon, controller.signal)
      .then((results) => {
        cache.set(key, results)
        setData(results)
      })
      .catch((err) => {
        if (!isAbortError(err)) {
          setData([])
          setError(true)
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [lat, lon])

  return { data, loading, error }
}
