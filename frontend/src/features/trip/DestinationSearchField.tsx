import { useEffect, useRef, useState } from 'react'
import { Loader2, LocateFixed, MapPin } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { getCurrentPosition, reverseGeocode, searchPlaces, type PlaceResult } from '@/services/geocoding'

const QUICK_PICKS = ['Goa', 'Manali', 'Kerala', 'Ladakh', 'Dubai']

// Real, well-known coordinates for the fixed quick-pick set — lets these get
// real weather too, same as a geocoded search result would.
const QUICK_PICK_COORDS: Record<string, { lat: number; lon: number }> = {
  Goa: { lat: 15.2993, lon: 74.124 },
  Manali: { lat: 32.2396, lon: 77.1887 },
  Kerala: { lat: 10.8505, lon: 76.2711 },
  Ladakh: { lat: 34.1526, lon: 77.5771 },
  Dubai: { lat: 25.2048, lon: 55.2708 },
}

interface Coordinates {
  lat: number
  lon: number
}

interface DestinationSearchFieldProps {
  value: string
  onChange: (value: string, coords?: Coordinates) => void
  error?: string
}

export function DestinationSearchField({ value, onChange, error }: DestinationSearchFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<PlaceResult[]>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const [showAllPicks, setShowAllPicks] = useState(false)
  const debouncedValue = useDebouncedValue(value, 450)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || debouncedValue.trim().length < 2) {
      setResults([])
      return
    }
    const controller = new AbortController()
    setLoading(true)
    searchPlaces(debouncedValue, controller.signal)
      .then((places) => setResults(places))
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') setResults([])
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [debouncedValue, isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectPlace = (name: string, coords?: Coordinates) => {
    onChange(name, coords)
    setIsOpen(false)
  }

  const handleLocate = async () => {
    setLocating(true)
    setLocateError(null)
    try {
      const position = await getCurrentPosition()
      const place = await reverseGeocode(position.coords.latitude, position.coords.longitude)
      selectPlace(place, { lat: position.coords.latitude, lon: position.coords.longitude })
    } catch (err) {
      setLocateError(err instanceof Error ? err.message : 'Could not get your location')
    } finally {
      setLocating(false)
    }
  }

  const visiblePicks = showAllPicks ? QUICK_PICKS : QUICK_PICKS.slice(0, 4)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="destination" className="text-sm font-medium text-ink">
        Destination
      </label>

      <div className="relative" ref={containerRef}>
        <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate">
          <MapPin className="h-4 w-4" />
        </div>
        <input
          id="destination"
          value={value}
          onChange={(event) => {
            // Typing invalidates any previously-selected coordinates — only a
            // real selection (dropdown, quick-pick, or geolocation) sets them.
            onChange(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="e.g. Goa, India"
          className={`w-full rounded-lg border bg-white py-2.5 pr-10 pl-10 text-sm text-ink outline-none transition-colors placeholder:text-slate/60 focus:border-ocean focus:ring-1 focus:ring-ocean ${
            error ? 'border-red-300' : 'border-mist'
          }`}
        />
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Use my current location"
          className="absolute inset-y-0 right-3 flex items-center text-slate hover:text-ocean disabled:opacity-50"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </button>

        {isOpen && (loading || results.length > 0) && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-mist bg-white shadow-lg">
            {loading && <p className="px-4 py-2.5 text-sm text-slate">Searching…</p>}
            {!loading &&
              results.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => selectPlace(place.label, { lat: place.lat, lon: place.lon })}
                  className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-cream"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate" />
                  <span className="flex flex-col">
                    <span className="font-medium">{place.label}</span>
                    <span className="line-clamp-1 text-xs text-slate">{place.fullAddress}</span>
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {locateError && <p className="text-xs text-red-500">{locateError}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {visiblePicks.map((pick) => (
          <button
            key={pick}
            type="button"
            onClick={() => selectPlace(pick, QUICK_PICK_COORDS[pick])}
            className="rounded-full border border-mist bg-white px-3 py-1.5 text-xs font-medium text-ocean transition-colors hover:border-ocean hover:bg-ocean/5"
          >
            {pick}
          </button>
        ))}
        {!showAllPicks && (
          <button
            type="button"
            onClick={() => setShowAllPicks(true)}
            className="text-xs font-medium text-slate hover:text-ink"
          >
            More
          </button>
        )}
      </div>
    </div>
  )
}
