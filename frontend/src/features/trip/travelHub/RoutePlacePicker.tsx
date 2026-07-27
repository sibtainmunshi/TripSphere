import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { searchTravelPlaces, type TravelPlaceType } from '@/services/travelPlacesApi'

interface RoutePlacePickerProps {
  type: TravelPlaceType
  label: string
  value: string
  onChange: (value: string) => void
}

// Real airports (OpenFlights) / real Indian train stations, text-searched —
// same "typing invalidates the last real pick, only a real selection is
// backed by real data" idea as DestinationSearchField and PlacePicker.
export function RoutePlacePicker({ type, label, value, onChange }: RoutePlacePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<{ label: string; value: string }[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedValue = useDebouncedValue(value, 350)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || debouncedValue.trim().length < 2) {
      setResults([])
      return
    }
    const controller = new AbortController()
    setLoading(true)
    searchTravelPlaces(type, debouncedValue, controller.signal)
      .then(setResults)
      .catch((err) => {
        if (err instanceof Error && err.name !== 'AbortError') setResults([])
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [type, debouncedValue, isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <div className="relative" ref={containerRef}>
        <input
          value={value}
          onChange={(event) => {
            onChange(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={type === 'airport' ? 'City or airport name…' : 'Station name or code…'}
          className="w-full rounded-lg border border-mist bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
        />

        {isOpen && (loading || results.length > 0) && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-mist bg-white shadow-lg">
            {loading && (
              <p className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching…
              </p>
            )}
            {!loading &&
              results.map((place) => (
                <button
                  key={place.value}
                  type="button"
                  onClick={() => {
                    onChange(place.value)
                    setIsOpen(false)
                  }}
                  className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-cream"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate" />
                  {place.label}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
