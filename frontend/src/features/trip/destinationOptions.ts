import { getDestinationImage } from './destinationImagery'
import { fetchDestinationSummary } from '@/services/wikipedia'
import { searchPlaces } from '@/services/geocoding'

export interface DestinationOption {
  name: string
  country: string
  category: string
  image: string | null
  gradient: string
  bestTime: string
  lat?: number
  lon?: number
  description: string
}

// No coordinates here yet — this is a free-typed name (from the user or
// extracted by the AI planner chat), not a geocoded result.
// enrichWithRealData() (below) fills in a real photo + real lat/lon via
// Wikipedia right after this is created.
export function getDestinationForCustomName(rawName: string): DestinationOption {
  const trimmed = rawName.trim()
  const image = getDestinationImage(trimmed)
  return {
    name: trimmed,
    country: '',
    category: 'Getaway',
    image,
    gradient: 'from-ocean to-navy',
    bestTime: 'Year-round',
    description: `A trip built around ${trimmed} — customise every detail in the next step.`,
  }
}

// Fills in whatever real data is still missing (photo and/or coordinates)
// via Wikipedia first, then OpenStreetMap geocoding as a fallback — used for
// both custom-typed destinations (which start with neither) and preset
// vibes that don't have hand-picked local photography (Goa/Dubai). Never
// overwrites real data that's already there. If NEITHER source can confirm
// this is a real place, lat/lon are left unset — the caller (AiTripChat)
// uses that as the honest "this isn't a real destination" signal, rather
// than pretending any typed text is a valid pick.
export async function enrichWithRealData(option: DestinationOption): Promise<DestinationOption> {
  if (option.image && option.lat != null && option.lon != null) return option

  let image = option.image
  let lat = option.lat
  let lon = option.lon
  let name = option.name

  try {
    const summary = await fetchDestinationSummary(option.name)
    image = image ?? summary.image
    lat = lat ?? summary.lat
    lon = lon ?? summary.lon
  } catch {
    // Wikipedia lookup failed — geocoding fallback below still gets a try.
  }

  if (lat == null || lon == null) {
    try {
      const results = await searchPlaces(option.name)
      // Nominatim happily matches business/POI names too (e.g. a shop
      // literally called "Hey There Sunshine") — only a genuine place
      // (city/town/village/region/country) counts as confirming this is a
      // real destination, never a business that happens to share the text.
      const match = results.find((result) => result.isRealPlace)
      if (match) {
        lat = match.lat
        lon = match.lon
        // Nominatim's cleaned label (e.g. "Alappuzha, Kerala") corrects
        // typos/casing in what the user typed — only applied here, never
        // for the preset vibes above, which already have canonical names.
        name = match.label
      }
    } catch {
      // Both real sources failed — lat/lon stay unset, which is the honest
      // outcome: this genuinely couldn't be confirmed as a real place.
    }
  }

  return { ...option, name, image, lat, lon }
}
