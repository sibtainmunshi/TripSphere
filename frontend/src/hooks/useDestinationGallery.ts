import { useEffect, useState } from 'react'
import { fetchDestinationGallery, type GalleryImage } from '@/services/destinationGallery'
import { useDebouncedValue } from './useDebouncedValue'

// Module-level cache — same destination shown again (or the user cycling
// back through a trip's images) reuses the fetched gallery instead of
// re-hitting Wikipedia.
const cache = new Map<string, GalleryImage[]>()

// Every real photo Wikipedia has for a destination, not just the one
// infobox thumbnail — lets "Change Image" actually cycle through genuine
// options instead of being a dead button. Starts empty (falls back to
// whatever single image the caller already has) and fills in once fetched;
// never fabricates extra images if a destination genuinely only has one
// (or none).
export function useDestinationGallery(destination: string): GalleryImage[] {
  const [images, setImages] = useState<GalleryImage[]>([])
  const debouncedDestination = useDebouncedValue(destination, 400)

  useEffect(() => {
    if (!debouncedDestination) {
      setImages([])
      return
    }

    const cached = cache.get(debouncedDestination)
    if (cached) {
      setImages(cached)
      return
    }

    const controller = new AbortController()
    fetchDestinationGallery(debouncedDestination, controller.signal)
      .then((result) => {
        cache.set(debouncedDestination, result)
        setImages(result)
      })
      .catch(() => {
        // Network hiccup or aborted — leave the gallery empty rather than
        // retry-looping; the cache simply stays unset so the next mount tries again.
      })

    return () => controller.abort()
  }, [debouncedDestination])

  return images
}
