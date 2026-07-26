// Real destination photos + coordinates via Wikipedia's REST summary API —
// free, no API key, CORS-open (Access-Control-Allow-Origin: *), and works
// for essentially any named place since Wikipedia has an article for
// virtually every city/region/town. Used to fill gaps for destinations that
// don't have hand-picked local photography (see destinationImagery.ts) —
// never fabricates a match: an unknown or disambiguated name returns nulls,
// same "no image beats a wrong image" rule as the rest of this app.
const BASE_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary'

export interface DestinationSummary {
  image: string | null
  lat?: number
  lon?: number
}

interface WikiSummaryResponse {
  type?: string
  thumbnail?: { source: string }
  originalimage?: { source: string }
  coordinates?: { lat: number; lon: number }
}

export async function fetchDestinationSummary(name: string, signal?: AbortSignal): Promise<DestinationSummary> {
  const trimmed = name.trim()
  if (!trimmed) return { image: null }

  const url = `${BASE_URL}/${encodeURIComponent(trimmed)}`
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) return { image: null }

  const data: WikiSummaryResponse = await response.json()
  // "disambiguation" means the title matches multiple unrelated topics —
  // no way to know which real place was meant, so don't guess.
  if (data.type === 'disambiguation') return { image: null }

  return {
    image: data.thumbnail?.source ?? data.originalimage?.source ?? null,
    lat: data.coordinates?.lat,
    lon: data.coordinates?.lon,
  }
}

const SEARCH_URL = 'https://en.wikipedia.org/w/api.php'

export interface WikiPlaceMatch {
  title: string
  lat: number
  lon: number
  image: string | null
}

interface SearchResponse {
  query?: { search?: { title: string }[] }
}

// Wikipedia's own full-text search understands natural, casual phrasing far
// better than a geocoder's address-matching engine — e.g. "the valley of
// flowers" correctly finds "Valley of Flowers National Park" as the top
// hit, where Nominatim's text search returns nothing useful for that exact
// phrasing (only the fully official name works there). Candidate titles are
// confirmed as genuine geographic places by requiring real coordinates from
// the summary endpoint — this is what filters out non-place results (e.g.
// "Valley of Flowers (film)" has no coordinates, so it's dropped).
export async function searchWikipediaPlaces(query: string, signal?: AbortSignal): Promise<WikiPlaceMatch[]> {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const searchUrl = `${SEARCH_URL}?action=query&list=search&srsearch=${encodeURIComponent(trimmed)}&srlimit=6&format=json&origin=*`
  const response = await fetch(searchUrl, { signal })
  if (!response.ok) return []

  const data: SearchResponse = await response.json()
  const titles = (data.query?.search ?? []).map((result) => result.title)
  if (titles.length === 0) return []

  const candidates = await Promise.all(
    titles.map(async (title): Promise<WikiPlaceMatch | null> => {
      try {
        const summary = await fetchDestinationSummary(title, signal)
        if (summary.lat == null || summary.lon == null) return null
        return { title, lat: summary.lat, lon: summary.lon, image: summary.image }
      } catch {
        return null
      }
    }),
  )

  return candidates.filter((candidate): candidate is WikiPlaceMatch => candidate !== null)
}
