import destMountains from '@/assets/dest-mountains.jpg'
import destLakes from '@/assets/dest-lakes.jpg'
import { getDestinationImage } from './destinationImagery'
import { fetchDestinationSummary } from '@/services/wikipedia'

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

// Real photography only where it genuinely exists (Manali/Udaipur) — the
// rest use an honest brand-gradient card. Same principle as the Trip
// Workspace hero and Home inspiration carousel. Coordinates are real,
// well-known city-level values — used to fetch real weather (see
// services/weather.ts) rather than the hardcoded "28°C Sunny" strings this
// file used to carry.
const VIBE_DESTINATIONS: Record<string, DestinationOption> = {
  Beach: {
    name: 'Goa',
    country: 'India',
    category: 'Beach',
    image: null,
    gradient: 'from-gold to-gold-dark',
    bestTime: 'Nov - Feb',
    lat: 15.2993,
    lon: 74.124,
    description: 'Beautiful beaches, vibrant nightlife, water sports and delicious Goan cuisine.',
  },
  Mountains: {
    name: 'Manali',
    country: 'India',
    category: 'Mountains',
    image: destMountains,
    gradient: 'from-ocean to-navy',
    bestTime: 'Mar - Jun',
    lat: 32.2396,
    lon: 77.1887,
    description: 'Pine forests, snow-capped peaks and easy day hikes — a reset for a busy group.',
  },
  City: {
    name: 'Dubai',
    country: 'UAE',
    category: 'City',
    image: null,
    gradient: 'from-lavender to-lavender-dark',
    bestTime: 'Nov - Mar',
    lat: 25.2048,
    lon: 55.2708,
    description: 'Iconic skyline, desert safaris and world-class shopping and dining.',
  },
  Nature: {
    name: 'Udaipur',
    country: 'India',
    category: 'Nature',
    image: destLakes,
    gradient: 'from-sea to-forest',
    bestTime: 'Oct - Mar',
    lat: 24.5854,
    lon: 73.7125,
    description: 'Lakes, palaces and golden-hour boat rides — the most photogenic option around.',
  },
  Anywhere: {
    name: 'Udaipur',
    country: 'India',
    category: 'Surprise pick',
    image: destLakes,
    gradient: 'from-sea to-forest',
    bestTime: 'Oct - Mar',
    lat: 24.5854,
    lon: 73.7125,
    description: 'We picked a crowd favourite — lakes, palaces and golden-hour boat rides.',
  },
}

export function getDestinationForVibe(vibe: string): DestinationOption {
  return VIBE_DESTINATIONS[vibe] ?? VIBE_DESTINATIONS.Anywhere
}

// No coordinates here yet — this is a free-typed name, not a geocoded
// result. enrichWithRealData() (below) fills in a real photo + real lat/lon
// via Wikipedia right after this is created, so weather/attractions still
// work for custom destinations instead of only the 4 preset vibes.
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
// via Wikipedia — used for both custom-typed destinations (which start with
// neither) and preset vibes that don't have hand-picked local photography
// (Goa/Dubai). Never overwrites real data that's already there, and never
// fabricates a substitute if Wikipedia has nothing — the card just keeps
// its honest gradient/no-weather fallback exactly as it did before.
export async function enrichWithRealData(option: DestinationOption): Promise<DestinationOption> {
  if (option.image && option.lat != null && option.lon != null) return option

  try {
    const summary = await fetchDestinationSummary(option.name)
    return {
      ...option,
      image: option.image ?? summary.image,
      lat: option.lat ?? summary.lat,
      lon: option.lon ?? summary.lon,
    }
  } catch {
    return option
  }
}
