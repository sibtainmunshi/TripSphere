import { useEffect, useState } from 'react'
import { fetchNearbyPlaces, type NearbyPlace, type PlaceType } from '@/services/placesApi'

// Module-level cache (keyed to ~1km precision) — same pattern as useAttractions.
const cache = new Map<string, NearbyPlace[]>()

export function useNearbyPlaces(type: PlaceType, lat?: number, lon?: number) {
  const [data, setData] = useState<NearbyPlace[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (lat == null || lon == null) {
      setData([])
      setError(false)
      return
    }

    const key = `${type}:${lat.toFixed(2)},${lon.toFixed(2)}`
    const cached = cache.get(key)
    if (cached) {
      setData(cached)
      setError(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)
    fetchNearbyPlaces(type, lat, lon)
      .then((results) => {
        if (cancelled) return
        cache.set(key, results)
        setData(results)
      })
      .catch(() => {
        if (!cancelled) {
          setData([])
          setError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [type, lat, lon])

  return { data, loading, error }
}
