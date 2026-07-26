import { ExternalLink, Landmark, Loader2, MapPin } from 'lucide-react'
import { useAttractions } from '@/hooks/useAttractions'
import { googleMapsUrl } from '@/services/attractions'

interface NearbyAttractionsProps {
  lat?: number
  lon?: number
}

// Real, named places pulled live from OpenStreetMap — never fabricated.
// Tapping one opens Google Maps at that exact real coordinate.
export function NearbyAttractions({ lat, lon }: NearbyAttractionsProps) {
  const { data, loading, error } = useAttractions(lat, lon)

  if (lat == null || lon == null) return null

  return (
    <div className="mt-6">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Landmark className="h-4 w-4 text-ocean" />
        Real Places to Visit
      </p>

      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-mist p-4 text-sm text-slate">
          <Loader2 className="h-4 w-4 animate-spin" />
          Looking up real attractions near this destination...
        </div>
      )}

      {!loading && error && (
        <p className="rounded-xl border border-mist p-4 text-xs text-slate">
          Couldn&rsquo;t load live attraction data right now. Try regenerating the plan in a moment.
        </p>
      )}

      {!loading && !error && data.length === 0 && (
        <p className="rounded-xl border border-mist p-4 text-xs text-slate">
          No mapped attractions found nearby yet on OpenStreetMap for this exact spot.
        </p>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="space-y-2">
          {data.map((place) => (
            <a
              key={place.id}
              href={googleMapsUrl(place.lat, place.lon)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-xl border border-mist p-3 transition-colors hover:border-ocean/40 hover:bg-ocean/5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-ocean" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{place.name}</p>
                  <p className="text-xs text-slate">{place.category}</p>
                </div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate opacity-0 transition-opacity group-hover:opacity-100" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
