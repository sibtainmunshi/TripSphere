import destMountains from '@/assets/dest-mountains.jpg'
import destLakes from '@/assets/dest-lakes.jpg'

export interface DestinationSuggestion {
  name: string
  blurb: string
  estimatedBudget: string
  bestTime: string
  image: string
}

export interface AiTripSummary {
  destinations: DestinationSuggestion[]
  itinerary: string[]
  weather: string
  packingList: string[]
}

// Only destinations with real project photography are offered here — see
// destinationImagery.ts. Add more once more destination photos land.
const SUGGESTION_POOL: DestinationSuggestion[] = [
  {
    name: 'Manali',
    blurb: 'Pine forests, mountain air and easy day hikes — a reset button for a busy group.',
    estimatedBudget: '₹15,000 – ₹19,000 / person',
    bestTime: 'Mar – Jun, clear mountain skies',
    image: destMountains,
  },
  {
    name: 'Udaipur',
    blurb: 'Lakes, palaces and golden-hour boat rides — the most photogenic option on this list.',
    estimatedBudget: '₹20,000 – ₹25,000 / person',
    bestTime: 'Oct – Mar, warm days and cool evenings',
    image: destLakes,
  },
]

// Placeholder for the real LLM call (Claude/Gemini, per Final_Concept.md) — keyword-matched for now.
export function generateMockAiSummary(userMessage: string): AiTripSummary {
  const msg = userMessage.toLowerCase()
  const priority =
    msg.includes('mountain') || msg.includes('hill') || msg.includes('snow') ? 'Manali' : 'Udaipur'

  const destinations = [...SUGGESTION_POOL].sort((a, b) =>
    a.name === priority ? -1 : b.name === priority ? 1 : 0,
  )

  return {
    destinations,
    itinerary: [
      'Day 1 — Arrive, check in, sunset by the water',
      'Day 2 — Local sightseeing + a signature local meal',
      'Day 3 — Free day: shopping, cafes, or an optional day trip',
      'Day 4 — Slow morning, pack up, head home',
    ],
    weather: 'Pleasant, 22°C–30°C — pack light layers and one warm layer for evenings.',
    packingList: [
      'Sunscreen',
      'Comfortable walking shoes',
      'Power bank',
      'Light jacket',
      'ID proof',
    ],
  }
}
