import type { DestinationOption } from './destinationOptions'

export interface TripPlanData {
  destination: string
  country: string
  tag: string
  days: number
  nights: number
  category: string
  budgetTier: string
  description: string
  bestTime: string
  lat?: number
  lon?: number
  estimatedBudget: string
  travelers: number
  travelStyle: string
  travelStyleNote: string
  image: string | null
  gradient: string
}

function durationForBudget(budget: number): { days: number; nights: number; tier: string } {
  if (budget <= 15_000) return { days: 3, nights: 2, tier: 'Budget Friendly' }
  if (budget <= 25_000) return { days: 4, nights: 3, tier: 'Budget Friendly' }
  if (budget <= 50_000) return { days: 5, nights: 4, tier: 'Comfort' }
  return { days: 6, nights: 5, tier: 'Premium' }
}

const STYLE_NOTES: Record<string, string> = {
  Relaxed: 'Slow mornings, easy pace',
  Adventurous: 'Packed with activities',
  Cultural: 'Local sights & history',
  Party: 'Nightlife-first itinerary',
}

// Placeholder for the real Gemini call (see 3.md's AI Flow) — this derives a
// plan entirely from what the user actually chose in the wizard rather than
// a fixed example, so at least the *inputs* are honest even before the real
// itinerary/packing-list generation lands.
export function generateTripPlan(
  destination: DestinationOption,
  travelStyle: string,
  travelers: number,
  budget: number,
): TripPlanData {
  const { days, nights, tier } = durationForBudget(budget)
  return {
    destination: destination.name,
    country: destination.country,
    tag: 'Recommended',
    days,
    nights,
    category: destination.category,
    budgetTier: tier,
    description: destination.description,
    bestTime: destination.bestTime || 'Year-round',
    lat: destination.lat,
    lon: destination.lon,
    estimatedBudget: `₹${budget.toLocaleString('en-IN')}`,
    travelers,
    travelStyle,
    travelStyleNote: STYLE_NOTES[travelStyle] ?? 'Editable in the next step',
    image: destination.image,
    gradient: destination.gradient,
  }
}
