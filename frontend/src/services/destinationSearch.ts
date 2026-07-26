import { searchWikipediaPlaces } from './wikipedia'
import { searchPlaces, type PlaceResult } from './geocoding'

// Wikipedia's full-text search is the primary destination search — far
// better at natural, casual phrasing than Nominatim's address-matching
// engine (see searchWikipediaPlaces). Nominatim stays as the fallback for
// small/obscure places that don't have their own Wikipedia article at all.
export async function searchDestinations(query: string, signal?: AbortSignal): Promise<PlaceResult[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  try {
    const wikiMatches = await searchWikipediaPlaces(trimmed, signal)
    if (wikiMatches.length > 0) {
      return wikiMatches.map((match) => ({
        id: match.title,
        label: match.title,
        fullAddress: match.title,
        lat: match.lat,
        lon: match.lon,
      }))
    }
  } catch {
    // Fall through to Nominatim below.
  }

  return searchPlaces(trimmed, signal)
}
