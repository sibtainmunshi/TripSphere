import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { useNearbyPlaces } from '@/hooks/useNearbyPlaces'
import type { PlaceType } from '@/services/placesApi'

interface PlacePickerProps {
  type: PlaceType
  label: string
  lat?: number
  lon?: number
  name: string
  onChange: (name: string, address?: string) => void
}

// Real, named hotels/restaurants from OpenStreetMap — picking one anchors
// this booking entry to an actual place instead of arbitrary free text.
// Typing without picking a suggestion still works (not every real place is
// mapped on OSM), same "typing invalidates the real selection" rule as
// DestinationSearchField.
export function PlacePicker({ type, label, lat, lon, name, onChange }: PlacePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { data, loading, error } = useNearbyPlaces(type, lat, lon)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = name.trim()
    ? data.filter((place) => place.name.toLowerCase().includes(name.trim().toLowerCase()))
    : data

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">{label}</label>
      <div className="relative" ref={containerRef}>
        <input
          value={name}
          onChange={(event) => {
            onChange(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={lat != null ? 'Search real places nearby…' : 'Enter a name'}
          className="w-full rounded-lg border border-mist bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ocean focus:ring-1 focus:ring-ocean"
        />

        {isOpen && lat != null && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-mist bg-white shadow-lg">
            {loading && (
              <p className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Looking up real places nearby…
              </p>
            )}
            {!loading && error && (
              <p className="px-4 py-2.5 text-xs text-slate">Couldn&rsquo;t load nearby places — you can still type one.</p>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="px-4 py-2.5 text-xs text-slate">
                No real {type === 'hotel' ? 'hotels' : 'restaurants'} mapped nearby yet — you can still type one.
              </p>
            )}
            {!loading &&
              filtered.slice(0, 15).map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => {
                    onChange(place.name, place.address)
                    setIsOpen(false)
                  }}
                  className="flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm text-ink hover:bg-cream"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate" />
                  <span className="flex flex-col">
                    <span className="font-medium">{place.name}</span>
                    {place.address && <span className="line-clamp-1 text-xs text-slate">{place.address}</span>}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
