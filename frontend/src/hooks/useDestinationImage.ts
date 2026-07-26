import { useEffect, useState } from 'react'
import { getDestinationImage } from '@/features/trip/destinationImagery'
import { fetchDestinationSummary } from '@/services/wikipedia'
import { useDebouncedValue } from './useDebouncedValue'

// Module-level cache — once a destination's real Wikipedia photo (or the
// honest "none found") is resolved, every card/hero showing that same trip
// reuses it instead of re-fetching.
const cache = new Map<string, string | null>()

// Real trip-card/hero photo for any destination name, not just the two with
// hand-picked local project photography (Manali/Udaipur — see
// destinationImagery.ts). Returns the local match instantly if there is one;
// otherwise starts as null (today's honest gradient fallback) and upgrades
// to a real Wikipedia photo once fetched — never fabricates a mismatched
// placeholder in between.
export function useDestinationImage(destination: string): string | null {
  const localMatch = getDestinationImage(destination)
  const [remoteImage, setRemoteImage] = useState<string | null>(null)
  // Debounced so typing a destination in a search field doesn't fire a
  // Wikipedia lookup on every keystroke — only once typing settles.
  const debouncedDestination = useDebouncedValue(destination, 400)

  useEffect(() => {
    if (localMatch || !debouncedDestination) return

    if (cache.has(debouncedDestination)) {
      setRemoteImage(cache.get(debouncedDestination) ?? null)
      return
    }

    const controller = new AbortController()
    fetchDestinationSummary(debouncedDestination, controller.signal)
      .then((summary) => {
        cache.set(debouncedDestination, summary.image)
        setRemoteImage(summary.image)
      })
      .catch(() => {
        // Network hiccup or aborted — leave it at null (gradient fallback)
        // rather than retry-looping; the cache simply stays unset so the
        // next mount can try again.
      })

    return () => controller.abort()
  }, [debouncedDestination, localMatch])

  return localMatch ?? remoteImage
}
