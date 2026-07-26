// Real photo gallery for a destination — pulls every image actually
// embedded in that destination's Wikipedia article (not just the one
// infobox thumbnail used elsewhere), via the same free, keyless, CORS-open
// MediaWiki API family already used for the summary lookup. Wikipedia's own
// convention keeps flags/logos/emblems/maps/charts as SVG and genuine
// photographs as JPEG, so filtering to JPEG-only already removes almost all
// of the non-scenic content; a small keyword denylist catches the rest
// (portraits, assembly buildings, election charts, etc.) that still slip
// through as JPEG.
const API_URL = 'https://en.wikipedia.org/w/api.php'

export interface GalleryImage {
  url: string
  title: string
}

interface ImageInfo {
  thumburl?: string
  url?: string
  mime?: string
}

interface WikiPage {
  title: string
  imageinfo?: ImageInfo[]
}

const EXCLUDE_KEYWORDS = [
  'flag_of',
  'logo',
  'emblem',
  'coat_of_arms',
  'coatofarms',
  'locator',
  '_map',
  'map_of',
  'district',
  'chart',
  'graph',
  'population',
  'census',
  'election',
  'portrait',
  'assembly',
  'seal_of',
  'symbol',
  'commons-logo',
  'wiktionary',
  'question_book',
  'increase',
  'decrease',
  'coa_',
]

function looksScenic(title: string, mime: string | undefined): boolean {
  if (mime !== 'image/jpeg') return false
  const lower = title.toLowerCase()
  return !EXCLUDE_KEYWORDS.some((word) => lower.includes(word))
}

export async function fetchDestinationGallery(destination: string, signal?: AbortSignal): Promise<GalleryImage[]> {
  const trimmed = destination.trim()
  if (!trimmed) return []

  const url =
    `${API_URL}?action=query&titles=${encodeURIComponent(trimmed)}` +
    '&generator=images&gimlimit=40&prop=imageinfo&iiprop=url|mime&iiurlwidth=800&format=json&origin=*'

  const response = await fetch(url, { signal })
  if (!response.ok) return []

  const data = await response.json()
  const pages: Record<string, WikiPage> | undefined = data?.query?.pages
  if (!pages) return []

  const images: GalleryImage[] = []
  const seen = new Set<string>()
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0]
    const src = info?.thumburl ?? info?.url
    if (!src || !looksScenic(page.title, info?.mime)) continue
    if (seen.has(src)) continue
    seen.add(src)
    images.push({ url: src, title: page.title.replace(/^File:/, '').replace(/\.\w+$/, '') })
    if (images.length >= 10) break
  }
  return images
}
