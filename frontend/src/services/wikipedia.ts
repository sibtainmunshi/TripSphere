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
