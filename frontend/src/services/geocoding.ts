// Real, free geocoding via OpenStreetMap Nominatim — this is the exact
// provider 3.md's tech stack already commits to (Leaflet + OpenStreetMap,
// "no Google Maps dependency"). No API key required. Nominatim's usage
// policy asks for max ~1 request/second and an identifying header; browsers
// can't set a custom User-Agent from fetch(), so the automatic Referer is
// what identifies the app here — fine for dev/demo traffic, but a real
// production deployment should proxy this through the backend instead of
// calling Nominatim directly from the browser.
const BASE_URL = 'https://nominatim.openstreetmap.org'

export interface PlaceResult {
  id: string
  /** Short, human destination label, e.g. "Alappuzha, Kerala" — always prefer this for display/storage. */
  label: string
  /** Full Nominatim display_name, kept only as secondary context in dropdowns. */
  fullAddress: string
  lat: number
  lon: number
  /** True for an actual city/town/village/region/country; false for a business/POI match (e.g. a shop that happens to share the query text). */
  isRealPlace: boolean
}

interface NominatimAddress {
  city?: string
  town?: string
  village?: string
  suburb?: string
  county?: string
  state_district?: string
  state?: string
  country?: string
}

interface NominatimItem {
  place_id: number
  name?: string
  display_name: string
  category?: string
  type?: string
  address?: NominatimAddress
  lat: string
  lon: string
}

// Nominatim happily matches business/POI names (e.g. "Alleppey Co-operative
// Spinning Mills Limited" for a search of "Alleppey", since OSM only tags the
// actual town under "Alappuzha"). Rather than trust `name`/`display_name` for
// those, climb the address hierarchy to the nearest real place so a trip
// destination is always a sensible town/city/region, never a business name.
function buildShortLabel(item: NominatimItem): string {
  const addr = item.address ?? {}
  const isRealPlace = item.category === 'place' || (item.category === 'boundary' && item.type === 'administrative')
  const fallbackName = item.name ?? item.display_name.split(',')[0].trim()

  if (isRealPlace) {
    const region = addr.state && addr.state !== fallbackName ? addr.state : addr.country
    return region ? `${fallbackName}, ${region}` : fallbackName
  }

  const place = addr.city ?? addr.town ?? addr.village ?? addr.suburb ?? addr.county ?? addr.state_district ?? addr.state
  if (!place) return fallbackName
  const region = addr.state && addr.state !== place ? addr.state : addr.country
  return region ? `${place}, ${region}` : place
}

function isRealPlaceItem(item: NominatimItem): boolean {
  return item.category === 'place' || (item.category === 'boundary' && item.type === 'administrative')
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const url = `${BASE_URL}/search?format=jsonv2&addressdetails=1&limit=10&accept-language=en&q=${encodeURIComponent(trimmed)}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('Location search failed')

  const data: NominatimItem[] = await response.json()

  // Real places (cities/towns/regions) first, POI/business matches after —
  // preserves Nominatim's own relevance order within each group.
  const sorted = [...data].sort((a, b) => Number(isRealPlaceItem(b)) - Number(isRealPlaceItem(a)))

  const seenLabels = new Set<string>()
  const results: PlaceResult[] = []
  for (const item of sorted) {
    const label = buildShortLabel(item)
    const key = label.toLowerCase()
    if (seenLabels.has(key)) continue
    seenLabels.add(key)
    results.push({
      id: String(item.place_id),
      label,
      fullAddress: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
      isRealPlace: isRealPlaceItem(item),
    })
    if (results.length >= 6) break
  }
  return results
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = `${BASE_URL}/reverse?format=jsonv2&addressdetails=1&accept-language=en&lat=${lat}&lon=${lon}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Reverse geocoding failed')

  const data: NominatimItem = await response.json()
  return buildShortLabel(data)
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
    })
  })
}
